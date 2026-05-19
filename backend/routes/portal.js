// backend/routes/portal.js
// Portal authentication and dashboard routes for landlords and tenants

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware: Verify Portal JWT Token
 * Accepts tokens with role 'landlord' or 'tenant'
 */
function verifyPortalToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!['landlord', 'tenant', 'admin'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: insufficient role'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

/**
 * POST /api/portal/landlord/login
 * Authenticate landlord with Supabase auth, verify landlord_profiles table, return JWT
 * Body: { email, password }
 */
router.post('/landlord/login', async (req, res) => {
  try {
    const supabase = global.supabase;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not initialized'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Authenticate with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (signInError || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Look up landlord profile
    const { data: profile, error: profileError } = await supabase
      .from('landlord_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError || !profile) {
      // Try matching by email as fallback
      const { data: profileByEmail, error: emailError } = await supabase
        .from('landlord_profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (emailError || !profileByEmail) {
        return res.status(401).json({
          success: false,
          error: 'Landlord profile not found. Contact your property manager.'
        });
      }

      const token = jwt.sign(
        {
          userId: data.user.id,
          email: data.user.email,
          role: 'landlord',
          landlordId: profileByEmail.id,
          name: `${profileByEmail.first_name} ${profileByEmail.last_name}`
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`Landlord login successful: ${email}`);

      return res.json({
        success: true,
        token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'landlord',
          landlordId: profileByEmail.id,
          name: `${profileByEmail.first_name} ${profileByEmail.last_name}`,
          company: profileByEmail.company_name
        }
      });
    }

    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: 'landlord',
        landlordId: profile.id,
        name: `${profile.first_name} ${profile.last_name}`
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Landlord login successful: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'landlord',
        landlordId: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        company: profile.company_name
      }
    });
  } catch (err) {
    console.error('Landlord login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/portal/tenant/login
 * Authenticate tenant with Supabase auth, verify tenants table, return JWT
 * Body: { email, password }
 */
router.post('/tenant/login', async (req, res) => {
  try {
    const supabase = global.supabase;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not initialized'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Authenticate with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (signInError || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Look up tenant profile
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (tenantError || !tenant) {
      // Try matching by email as fallback
      const { data: tenantByEmail, error: emailError } = await supabase
        .from('tenants')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (emailError || !tenantByEmail) {
        return res.status(401).json({
          success: false,
          error: 'Tenant profile not found. Contact your property manager.'
        });
      }

      const token = jwt.sign(
        {
          userId: data.user.id,
          email: data.user.email,
          role: 'tenant',
          tenantId: tenantByEmail.id,
          propertyId: tenantByEmail.property_id,
          name: `${tenantByEmail.first_name} ${tenantByEmail.last_name}`
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`Tenant login successful: ${email}`);

      return res.json({
        success: true,
        token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'tenant',
          tenantId: tenantByEmail.id,
          propertyId: tenantByEmail.property_id,
          name: `${tenantByEmail.first_name} ${tenantByEmail.last_name}`
        }
      });
    }

    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: 'tenant',
        tenantId: tenant.id,
        propertyId: tenant.property_id,
        name: `${tenant.first_name} ${tenant.last_name}`
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Tenant login successful: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'tenant',
        tenantId: tenant.id,
        propertyId: tenant.property_id,
        name: `${tenant.first_name} ${tenant.last_name}`
      }
    });
  } catch (err) {
    console.error('Tenant login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * GET /api/portal/landlord/dashboard
 * Returns landlord dashboard data: properties, service calls, rent summary, performance
 * Requires landlord JWT
 */
router.get('/landlord/dashboard', verifyPortalToken, async (req, res) => {
  try {
    if (req.user.role !== 'landlord' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: landlord role required'
      });
    }

    const supabase = global.supabase;
    const landlordId = req.user.landlordId;

    // Fetch landlord's properties via landlord_properties join
    const { data: landlordProperties, error: lpError } = await supabase
      .from('landlord_properties')
      .select('property_id')
      .eq('landlord_id', landlordId);

    if (lpError) {
      console.error('Error fetching landlord properties:', lpError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch properties'
      });
    }

    const propertyIds = (landlordProperties || []).map(lp => lp.property_id);

    // Fetch full property details
    let properties = [];
    if (propertyIds.length > 0) {
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds)
        .eq('status', 'active');

      if (propError) {
        console.error('Error fetching property details:', propError.message);
      } else {
        properties = propData || [];
      }
    }

    // Fetch service calls for landlord's properties
    let serviceCalls = [];
    if (propertyIds.length > 0) {
      const { data: scData, error: scError } = await supabase
        .from('service_calls')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (scError) {
        console.error('Error fetching service calls:', scError.message);
      } else {
        serviceCalls = scData || [];
      }
    }

    // Fetch rent ledger for current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let rentRecords = [];
    if (propertyIds.length > 0) {
      const { data: rentData, error: rentError } = await supabase
        .from('rent_ledger')
        .select('*')
        .in('property_id', propertyIds)
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear);

      if (rentError) {
        console.error('Error fetching rent ledger:', rentError.message);
      } else {
        rentRecords = rentData || [];
      }
    }

    // Calculate rent summary
    const totalExpected = rentRecords.reduce((sum, r) => sum + parseFloat(r.amount_due || 0), 0);
    const totalCollected = rentRecords.reduce((sum, r) => sum + parseFloat(r.amount_paid || 0), 0);
    const collectionRate = totalExpected > 0
      ? Math.round((totalCollected / totalExpected) * 100)
      : 0;

    // Calculate service call metrics
    const openServiceCalls = serviceCalls.filter(sc => sc.status === 'open' || sc.status === 'in_progress').length;
    const resolvedThisMonth = serviceCalls.filter(sc => {
      if (sc.status !== 'resolved' || !sc.resolved_at) return false;
      const resolvedDate = new Date(sc.resolved_at);
      return resolvedDate.getMonth() + 1 === currentMonth && resolvedDate.getFullYear() === currentYear;
    }).length;

    // Calculate savings vs DIY
    // DIY estimate: 15% of expected rent + $200 emergency per property per month
    const diyEstimate = (totalExpected * 0.15) + (properties.length * 200);
    // Our fee: management_fee_pct% of collected rent (average fee across properties)
    const avgFeePct = properties.length > 0
      ? properties.reduce((sum, p) => sum + parseFloat(p.management_fee_pct || 10), 0) / properties.length
      : 10;
    const ourFee = totalCollected * (avgFeePct / 100);
    const savingsVsDiy = Math.max(0, diyEstimate - ourFee);

    // Build performance summary
    const performance = {
      totalProperties: properties.length,
      totalExpected,
      totalCollected,
      collectionRate,
      openServiceCalls,
      resolvedThisMonth,
      diyEstimate: Math.round(diyEstimate * 100) / 100,
      ourFee: Math.round(ourFee * 100) / 100,
      savingsVsDiy: Math.round(savingsVsDiy * 100) / 100,
      period: { month: currentMonth, year: currentYear }
    };

    const rentSummary = {
      total_expected: Math.round(totalExpected * 100) / 100,
      total_collected: Math.round(totalCollected * 100) / 100,
      collection_rate: collectionRate,
      records: rentRecords
    };

    // Fetch monthly performance history (last 6 months) from building_performance if available
    let monthlyPerformance = [];
    if (propertyIds.length > 0) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: perfData } = await supabase
        .from('building_performance')
        .select('*')
        .in('property_id', propertyIds)
        .gte('period_year', sixMonthsAgo.getFullYear())
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true });
      monthlyPerformance = perfData || [];
    }

    const resolvedCount = serviceCalls.filter(sc => ['resolved', 'closed'].includes(sc.status)).length;
    const resolutionRate = serviceCalls.length > 0 ? Math.round(resolvedCount / serviceCalls.length * 100) : 100;

    res.json({
      success: true,
      properties,
      service_calls: serviceCalls,
      rent_ledger: rentRecords,
      stats: {
        rent_collected: Math.round(totalCollected * 100) / 100,
        rent_expected: Math.round(totalExpected * 100) / 100,
        open_calls: openServiceCalls,
        savings: Math.round(savingsVsDiy * 100) / 100,
        management_fees: Math.round(ourFee * 100) / 100,
        diy_estimated_cost: Math.round(diyEstimate * 100) / 100,
        collection_rate: collectionRate
      },
      performance: {
        occupancy_rate: 100,
        resolution_rate: resolutionRate,
        avg_resolution_days: null,
        collection_rate: collectionRate
      },
      monthly_performance: monthlyPerformance
    });
  } catch (err) {
    console.error('Landlord dashboard error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard'
    });
  }
});

/**
 * GET /api/portal/tenant/dashboard
 * Returns tenant dashboard data: tenant info, service calls, rent history
 * Requires tenant JWT
 */
router.get('/tenant/dashboard', verifyPortalToken, async (req, res) => {
  try {
    if (req.user.role !== 'tenant' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: tenant role required'
      });
    }

    const supabase = global.supabase;
    const tenantId = req.user.tenantId;
    const propertyId = req.user.propertyId;

    // Fetch tenant info with property details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*, properties(address, city, province, postal_code, property_type, bedrooms, bathrooms)')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant profile not found'
      });
    }

    // Fetch tenant's service calls
    const { data: serviceCalls, error: scError } = await supabase
      .from('service_calls')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (scError) {
      console.error('Error fetching tenant service calls:', scError.message);
    }

    // Fetch rent history for this tenant
    const { data: rentHistory, error: rentError } = await supabase
      .from('rent_ledger')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(24);

    if (rentError) {
      console.error('Error fetching rent history:', rentError.message);
    }

    // Flatten property address into tenant object for UI convenience
    const tenantWithProperty = {
      ...tenant,
      property_address: tenant.properties
        ? `${tenant.properties.address}, ${tenant.properties.city || ''}, ${tenant.properties.province || ''}`
        : null
    };

    res.json({
      success: true,
      tenant: tenantWithProperty,
      service_calls: serviceCalls || [],
      rent_history: rentHistory || []
    });
  } catch (err) {
    console.error('Tenant dashboard error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard'
    });
  }
});

// Export middleware so other route files can use it
router.verifyPortalToken = verifyPortalToken;

module.exports = router;
