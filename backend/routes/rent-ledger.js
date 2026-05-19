// backend/routes/rent-ledger.js
// Rent tracking endpoints — all require a portal JWT (landlord, tenant, or admin)

const express = require('express');
const router = express.Router();
const portalRouter = require('./portal.js');
const verifyPortalToken = portalRouter.verifyPortalToken;

/**
 * GET /api/rent-ledger
 * Fetch rent records.
 *   - Tenant  → only their own records
 *   - Landlord → all records for their properties
 *   - Admin   → all records (optionally filtered)
 * Query params: year, month, status
 */
router.get('/', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const role = req.user.role;
    const { year, month, status } = req.query;

    let query = supabase
      .from('rent_ledger')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (role === 'tenant') {
      query = query.eq('tenant_id', req.user.tenantId);
    } else if (role === 'landlord') {
      // Resolve property IDs the landlord owns
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
        return res.json({ success: true, records: [] });
      }

      query = query.in('property_id', propertyIds);
    }
    // admin: no ownership filter

    if (year) query = query.eq('period_year', parseInt(year, 10));
    if (month) query = query.eq('period_month', parseInt(month, 10));
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rent ledger:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({ success: true, records: data || [] });
  } catch (err) {
    console.error('Get rent ledger error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rent records'
    });
  }
});

/**
 * POST /api/rent-ledger
 * Create a rent record (admin or landlord only).
 * Body: { property_id, tenant_id, period_month, period_year, amount_due, notes }
 */
router.post('/', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const role = req.user.role;

    if (role === 'tenant') {
      return res.status(403).json({
        success: false,
        error: 'Tenants cannot create rent records'
      });
    }

    const { property_id, tenant_id, period_month, period_year, amount_due, notes } = req.body;

    if (!property_id || !tenant_id || !period_month || !period_year || amount_due === undefined) {
      return res.status(400).json({
        success: false,
        error: 'property_id, tenant_id, period_month, period_year, and amount_due are required'
      });
    }

    // Landlords may only create records for their own properties
    if (role === 'landlord') {
      const { data: lp, error: lpError } = await supabase
        .from('landlord_properties')
        .select('property_id')
        .eq('landlord_id', req.user.landlordId)
        .eq('property_id', property_id)
        .single();

      if (lpError || !lp) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: property does not belong to this landlord'
        });
      }
    }

    const { data, error } = await supabase
      .from('rent_ledger')
      .insert([{
        property_id,
        tenant_id,
        period_month: parseInt(period_month, 10),
        period_year: parseInt(period_year, 10),
        amount_due: parseFloat(amount_due),
        amount_paid: 0,
        status: 'pending',
        notes: notes || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating rent record:', error.message);
      // Surface unique constraint violation clearly
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'A rent record for this tenant/month/year already exists'
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(201).json({ success: true, data });

    console.log(`Rent record created for tenant ${tenant_id} - ${period_month}/${period_year}`);
  } catch (err) {
    console.error('Create rent record error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create rent record'
    });
  }
});

/**
 * PATCH /api/rent-ledger/:id
 * Record a payment against a rent ledger entry.
 * Body: { amount_paid, payment_date, payment_method }
 * Auto-computes status: 'paid' | 'partial' | 'pending' and checks if payment is late.
 */
router.patch('/:id', verifyPortalToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    const role = req.user.role;
    const { id } = req.params;
    const { amount_paid, payment_date, payment_method } = req.body;

    if (amount_paid === undefined) {
      return res.status(400).json({
        success: false,
        error: 'amount_paid is required'
      });
    }

    // Fetch the existing record
    const { data: existing, error: fetchError } = await supabase
      .from('rent_ledger')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Rent record not found'
      });
    }

    // Tenants cannot record payments themselves
    if (role === 'tenant' && existing.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    if (role === 'tenant') {
      return res.status(403).json({
        success: false,
        error: 'Tenants cannot record payments. Please contact your property manager.'
      });
    }

    // Landlords may only update records for their own properties
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
          error: 'Access denied: property does not belong to this landlord'
        });
      }
    }

    const paid = parseFloat(amount_paid);
    const due = parseFloat(existing.amount_due);

    // Determine payment status
    let status;
    if (paid >= due) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partial';
    } else {
      status = 'pending';
    }

    // Check lateness: payment is late if payment_date is after the 1st of the
    // period month/year (i.e. past the first day of the due month)
    let lateFee = parseFloat(existing.late_fee || 0);
    const effectivePaymentDate = payment_date ? new Date(payment_date) : new Date();
    const dueDate = new Date(existing.period_year, existing.period_month - 1, 1);

    if (effectivePaymentDate > dueDate && lateFee === 0) {
      // Apply a default late fee of $50 if none has been set yet
      lateFee = 50;
    }

    const updatePayload = {
      amount_paid: paid,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment_method || null,
      status,
      late_fee: lateFee,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error: updateError } = await supabase
      .from('rent_ledger')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating rent record:', updateError.message);
      return res.status(500).json({
        success: false,
        error: updateError.message
      });
    }

    res.json({ success: true, data: updated });

    console.log(`Rent payment recorded for record ${id}: $${paid} (status: ${status})`);
  } catch (err) {
    console.error('Update rent record error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment'
    });
  }
});

module.exports = router;
