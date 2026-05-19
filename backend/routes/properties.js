// backend/routes/properties.js
// Property management endpoints — all require a portal JWT

const express = require('express');
const router = express.Router();
const portalRouter = require('./portal.js');
const verifyPortalToken = portalRouter.verifyPortalToken;

/**
 * GET /api/properties
 * Returns properties scoped to the caller's role.
 *   - Landlord → their own properties (via landlord_properties join)
 *   - Admin    → all properties
 *   - Tenant   → the single property they are assigned to
 */
router.get('/', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const role = req.user.role;

    if (role === 'landlord') {
      // Fetch IDs via join table first
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
        return res.json({ success: true, data: [] });
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data: data || [] });
    }

    if (role === 'tenant') {
      if (!req.user.propertyId) {
        return res.json({ success: true, data: [] });
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', req.user.propertyId)
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data: data ? [data] : [] });
    }

    // Admin — return all
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Get properties error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties'
    });
  }
});

/**
 * POST /api/properties
 * Create a new property (admin only).
 * Body: {
 *   landlord_id, address, city, province, postal_code, property_type,
 *   unit_count, bedrooms, bathrooms, monthly_rent, management_fee_pct, notes
 * }
 * Also inserts into landlord_properties if landlord_id is provided.
 */
router.post('/', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create properties'
      });
    }

    const {
      landlord_id,
      address,
      city,
      province,
      postal_code,
      property_type,
      unit_count,
      bedrooms,
      bathrooms,
      monthly_rent,
      management_fee_pct,
      notes
    } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'address is required'
      });
    }

    const insertPayload = {
      landlord_id: landlord_id || null,
      address,
      city: city || 'Windsor',
      province: province || 'ON',
      postal_code: postal_code || null,
      property_type: property_type || null,
      unit_count: unit_count ? parseInt(unit_count, 10) : 1,
      bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
      bathrooms: bathrooms ? parseFloat(bathrooms) : null,
      monthly_rent: monthly_rent ? parseFloat(monthly_rent) : null,
      management_fee_pct: management_fee_pct ? parseFloat(management_fee_pct) : 10.0,
      status: 'active',
      notes: notes || null
    };

    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert([insertPayload])
      .select()
      .single();

    if (propError) {
      console.error('Error creating property:', propError.message);
      return res.status(500).json({
        success: false,
        error: propError.message
      });
    }

    // Link to landlord in join table if landlord_id provided
    if (landlord_id) {
      const { error: linkError } = await supabase
        .from('landlord_properties')
        .insert([{
          landlord_id,
          property_id: property.id
        }]);

      if (linkError && linkError.code !== '23505') {
        console.error('Error linking property to landlord:', linkError.message);
      }
    }

    res.status(201).json({ success: true, data: property });

    console.log(`Property created: ${property.id} — ${address}`);
  } catch (err) {
    console.error('Create property error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create property'
    });
  }
});

/**
 * PATCH /api/properties/:id
 * Update a property.
 *   - Landlord → may update notes and status only
 *   - Admin    → may update any field
 */
router.patch('/:id', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const { id } = req.params;
    const role = req.user.role;

    if (role === 'tenant') {
      return res.status(403).json({
        success: false,
        error: 'Tenants cannot update properties'
      });
    }

    // Verify landlord owns this property
    if (role === 'landlord') {
      const { data: lp } = await supabase
        .from('landlord_properties')
        .select('property_id')
        .eq('landlord_id', req.user.landlordId)
        .eq('property_id', id)
        .single();

      if (!lp) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: property does not belong to this landlord'
        });
      }
    }

    const {
      address,
      city,
      province,
      postal_code,
      property_type,
      unit_count,
      bedrooms,
      bathrooms,
      monthly_rent,
      management_fee_pct,
      status,
      notes
    } = req.body;

    let updatePayload = { updated_at: new Date().toISOString() };

    if (role === 'admin') {
      // Admin can update everything
      if (address !== undefined) updatePayload.address = address;
      if (city !== undefined) updatePayload.city = city;
      if (province !== undefined) updatePayload.province = province;
      if (postal_code !== undefined) updatePayload.postal_code = postal_code;
      if (property_type !== undefined) updatePayload.property_type = property_type;
      if (unit_count !== undefined) updatePayload.unit_count = parseInt(unit_count, 10);
      if (bedrooms !== undefined) updatePayload.bedrooms = parseInt(bedrooms, 10);
      if (bathrooms !== undefined) updatePayload.bathrooms = parseFloat(bathrooms);
      if (monthly_rent !== undefined) updatePayload.monthly_rent = parseFloat(monthly_rent);
      if (management_fee_pct !== undefined) updatePayload.management_fee_pct = parseFloat(management_fee_pct);
      if (status !== undefined) updatePayload.status = status;
      if (notes !== undefined) updatePayload.notes = notes;
    } else {
      // Landlord: notes and status only
      if (notes !== undefined) updatePayload.notes = notes;
      if (status !== undefined) updatePayload.status = status;
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({ success: true, data });

    console.log(`Property ${id} updated by ${role} ${req.user.email}`);
  } catch (err) {
    console.error('Update property error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update property'
    });
  }
});

/**
 * POST /api/properties/:id/assign-tenant
 * Admin assigns (or re-assigns) a tenant to this property.
 * Updates the tenant record's property_id field.
 * Body: { tenant_id }
 */
router.post('/:id/assign-tenant', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const { id } = req.params;
    const { tenant_id } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can assign tenants to properties'
      });
    }

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      });
    }

    // Verify property exists
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, address')
      .eq('id', id)
      .single();

    if (propError || !property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Update tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .update({
        property_id: id,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenant_id)
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('Error assigning tenant:', tenantError?.message);
      return res.status(500).json({
        success: false,
        error: tenantError?.message || 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: {
        property,
        tenant
      }
    });

    console.log(`Tenant ${tenant_id} assigned to property ${id} by admin ${req.user.email}`);
  } catch (err) {
    console.error('Assign tenant error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to assign tenant'
    });
  }
});

module.exports = router;
