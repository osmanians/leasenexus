// backend/routes/service-calls.js
// CRUD for service calls — landlords and tenants both access via portal JWT

const express = require('express');
const router = express.Router();
const portalRouter = require('./portal.js');
const verifyPortalToken = portalRouter.verifyPortalToken;

/**
 * POST /api/service-calls
 * Create a new service call.
 * Tenants auto-set tenant_id from JWT; landlords auto-set landlord_id from JWT.
 * Inserts the first status entry into service_call_updates.
 * Body: { property_id, title, description, category, priority }
 */
router.post('/', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const { property_id, title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'title, description, and category are required'
      });
    }

    const role = req.user.role;

    // Resolve the effective property_id
    let effectivePropertyId = property_id || null;
    if (!effectivePropertyId && role === 'tenant' && req.user.propertyId) {
      effectivePropertyId = req.user.propertyId;
    }

    const insertPayload = {
      property_id: effectivePropertyId,
      title,
      description,
      category,
      priority: priority || 'medium',
      status: 'open',
      created_by_role: role
    };

    if (role === 'tenant') {
      insertPayload.tenant_id = req.user.tenantId;
    } else if (role === 'landlord') {
      insertPayload.landlord_id = req.user.landlordId;
    }

    const { data: serviceCall, error: scError } = await supabase
      .from('service_calls')
      .insert([insertPayload])
      .select()
      .single();

    if (scError) {
      console.error('Error creating service call:', scError.message);
      return res.status(500).json({
        success: false,
        error: scError.message
      });
    }

    // Insert first timeline entry
    const { error: updateError } = await supabase
      .from('service_call_updates')
      .insert([{
        service_call_id: serviceCall.id,
        updated_by: req.user.name || req.user.email,
        updated_by_role: role,
        status: 'open',
        note: 'Service call created'
      }]);

    if (updateError) {
      console.error('Error creating initial service call update:', updateError.message);
    }

    // Fire email notification to landlord when tenant creates a call
    if (role === 'tenant' && effectivePropertyId) {
      try {
        const { sendServiceCallCreated } = require('../services/emailService.js');

        // Fetch property address and landlord email in parallel
        const [propResult, landlordResult] = await Promise.all([
          supabase
            .from('properties')
            .select('address, city')
            .eq('id', effectivePropertyId)
            .single(),
          supabase
            .from('landlord_properties')
            .select('landlord_profiles(email)')
            .eq('property_id', effectivePropertyId)
            .limit(1)
            .single()
        ]);

        const propertyAddress = propResult.data
          ? `${propResult.data.address}, ${propResult.data.city}`
          : 'Unknown Property';

        const landlordEmail = landlordResult.data?.landlord_profiles?.email || null;

        if (landlordEmail) {
          sendServiceCallCreated({
            serviceCall,
            tenantName: req.user.name || req.user.email,
            landlordEmail,
            propertyAddress
          });
        }
      } catch (emailErr) {
        console.error('Email notification error (non-fatal):', emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      service_call: serviceCall
    });

    console.log(`Service call created: ${serviceCall.id} by ${role} ${req.user.email}`);
  } catch (err) {
    console.error('Create service call error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create service call'
    });
  }
});

/**
 * GET /api/service-calls
 * List service calls.
 * Tenants see only their own calls; landlords see all calls for their properties.
 * Query params: property_id, status
 */
router.get('/', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const role = req.user.role;
    const { property_id, status } = req.query;

    let query = supabase
      .from('service_calls')
      .select('*')
      .order('created_at', { ascending: false });

    if (role === 'tenant') {
      query = query.eq('tenant_id', req.user.tenantId);
    } else if (role === 'landlord') {
      // Fetch landlord's property IDs first
      const { data: landlordProperties, error: lpError } = await supabase
        .from('landlord_properties')
        .select('property_id')
        .eq('landlord_id', req.user.landlordId);

      if (lpError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch landlord properties'
        });
      }

      const propertyIds = (landlordProperties || []).map(lp => lp.property_id);

      if (propertyIds.length === 0) {
        return res.json({ success: true, service_calls: [] });
      }

      query = query.in('property_id', propertyIds);
    }
    // admin role: no additional filters — sees all

    if (property_id) {
      query = query.eq('property_id', property_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching service calls:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({ success: true, service_calls: data || [] });
  } catch (err) {
    console.error('Get service calls error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service calls'
    });
  }
});

/**
 * GET /api/service-calls/:id
 * Get a single service call with its full updates timeline.
 */
router.get('/:id', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const { id } = req.params;
    const role = req.user.role;

    const { data: serviceCall, error: scError } = await supabase
      .from('service_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (scError || !serviceCall) {
      return res.status(404).json({
        success: false,
        error: 'Service call not found'
      });
    }

    // Enforce ownership for tenants
    if (role === 'tenant' && serviceCall.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Enforce property ownership for landlords
    if (role === 'landlord') {
      const { data: lp } = await supabase
        .from('landlord_properties')
        .select('property_id')
        .eq('landlord_id', req.user.landlordId)
        .eq('property_id', serviceCall.property_id)
        .single();

      if (!lp) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Fetch updates timeline
    const { data: updates, error: updatesError } = await supabase
      .from('service_call_updates')
      .select('*')
      .eq('service_call_id', id)
      .order('created_at', { ascending: true });

    if (updatesError) {
      console.error('Error fetching service call updates:', updatesError.message);
    }

    res.json({
      success: true,
      service_call: serviceCall,
      updates: updates || []
    });
  } catch (err) {
    console.error('Get service call error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service call'
    });
  }
});

/**
 * PATCH /api/service-calls/:id/status
 * Update service call status and add a timeline entry.
 * Only landlords and admins may move status beyond 'open'.
 * Body: { status, note, assigned_to, estimated_cost, actual_cost, resolution_notes }
 */
router.patch('/:id/status', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const { id } = req.params;
    const role = req.user.role;
    const { status, note, assigned_to, estimated_cost, actual_cost, resolution_notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required'
      });
    }

    // Tenants can only keep status as 'open' (i.e. they cannot escalate/close)
    const tenantRestrictedStatuses = ['in_progress', 'resolved', 'closed', 'cancelled'];
    if (role === 'tenant' && tenantRestrictedStatuses.includes(status)) {
      return res.status(403).json({
        success: false,
        error: 'Tenants cannot update status beyond open'
      });
    }

    // Fetch existing service call
    const { data: existing, error: fetchError } = await supabase
      .from('service_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Service call not found'
      });
    }

    // Enforce ownership checks
    if (role === 'tenant' && existing.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (role === 'landlord') {
      const { data: lp } = await supabase
        .from('landlord_properties')
        .select('property_id')
        .eq('landlord_id', req.user.landlordId)
        .eq('property_id', existing.property_id)
        .single();

      if (!lp) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    const now = new Date().toISOString();
    const updatePayload = {
      status,
      updated_at: now
    };

    if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;
    if (estimated_cost !== undefined) updatePayload.estimated_cost = estimated_cost;
    if (actual_cost !== undefined) updatePayload.actual_cost = actual_cost;
    if (resolution_notes !== undefined) updatePayload.resolution_notes = resolution_notes;
    if (status === 'resolved') updatePayload.resolved_at = now;

    const { data: updated, error: updateError } = await supabase
      .from('service_calls')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service call:', updateError.message);
      return res.status(500).json({
        success: false,
        error: updateError.message
      });
    }

    // Add timeline entry
    const { data: timelineEntry, error: timelineError } = await supabase
      .from('service_call_updates')
      .insert([{
        service_call_id: id,
        updated_by: req.user.name || req.user.email,
        updated_by_role: role,
        status,
        note: note || null
      }])
      .select()
      .single();

    if (timelineError) {
      console.error('Error adding timeline entry:', timelineError.message);
    }

    // Notify tenant by email when landlord/admin updates the status
    if ((role === 'landlord' || role === 'admin') && existing.tenant_id) {
      try {
        const { sendServiceCallUpdate } = require('../services/emailService.js');

        const [tenantResult, propResult] = await Promise.all([
          supabase
            .from('tenants')
            .select('email, first_name, last_name')
            .eq('id', existing.tenant_id)
            .single(),
          supabase
            .from('properties')
            .select('address, city')
            .eq('id', existing.property_id)
            .single()
        ]);

        if (tenantResult.data?.email) {
          sendServiceCallUpdate({
            serviceCall: updated,
            tenantEmail: tenantResult.data.email,
            update: { status, note: note || null },
            propertyAddress: propResult.data
              ? `${propResult.data.address}, ${propResult.data.city}`
              : 'Unknown Property'
          });
        }
      } catch (emailErr) {
        console.error('Email notification error (non-fatal):', emailErr.message);
      }
    }

    res.json({
      success: true,
      data: updated,
      update: timelineEntry || null
    });

    console.log(`Service call ${id} status updated to '${status}' by ${role} ${req.user.email}`);
  } catch (err) {
    console.error('Update service call status error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update service call status'
    });
  }
});

/**
 * DELETE /api/service-calls/:id
 * Cancel (soft-delete) a service call.
 * Only the creator or an admin may cancel.
 */
router.delete('/:id', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const { id } = req.params;
    const role = req.user.role;

    const { data: existing, error: fetchError } = await supabase
      .from('service_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Service call not found'
      });
    }

    // Permission: admin always allowed; others must be the creator
    if (role !== 'admin') {
      const isCreator =
        (role === 'tenant' && existing.tenant_id === req.user.tenantId) ||
        (role === 'landlord' && existing.landlord_id === req.user.landlordId);

      if (!isCreator) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: only the creator or admin may cancel this service call'
        });
      }
    }

    const now = new Date().toISOString();

    const { data: cancelled, error: cancelError } = await supabase
      .from('service_calls')
      .update({ status: 'cancelled', updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (cancelError) {
      console.error('Error cancelling service call:', cancelError.message);
      return res.status(500).json({
        success: false,
        error: cancelError.message
      });
    }

    // Add timeline entry
    await supabase.from('service_call_updates').insert([{
      service_call_id: id,
      updated_by: req.user.name || req.user.email,
      updated_by_role: role,
      status: 'cancelled',
      note: 'Service call cancelled'
    }]);

    res.json({
      success: true,
      data: cancelled
    });

    console.log(`Service call ${id} cancelled by ${role} ${req.user.email}`);
  } catch (err) {
    console.error('Cancel service call error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel service call'
    });
  }
});

module.exports = router;
