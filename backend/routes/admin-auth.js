// backend/routes/admin-auth.js
// Supabase Authentication Routes

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const supabase = global.supabase;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/admin/auth/login
 * Authenticate with Supabase Auth
 * Body: { email, password }
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Sign in with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (signInError) {
      console.error('Supabase sign in error:', signInError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    if (!data.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }

    // Get user profile from admin_profiles
    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
      return res.status(401).json({
        success: false,
        error: 'Admin profile not found. Contact system administrator.'
      });
    }

    // Check if user is actually an admin
    if (profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'User is not authorized as admin'
      });
    }

    // Create custom JWT token for API authentication
    const customToken = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: profile.role,
        fullName: profile.full_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      success: true,
      token: customToken,
      refreshToken: data.session?.refresh_token || null,
      session: {
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        expiresIn: data.session?.expires_in || null,
        expiresAt: data.session?.expires_at || null
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.full_name,
        role: profile.role
      }
    });

    console.log(`✅ Admin login successful: ${email}`);

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/admin/auth/signup
 * Create new admin user (requires authentication)
 * Body: { email, password, fullName }
 */
router.post('/auth/signup', verifyToken, async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Only existing admins can create new admins
    if (req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create new users'
      });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true // Auto-confirm the email
    });

    if (signUpError) {
      console.error('Signup error:', signUpError.message);
      return res.status(400).json({
        success: false,
        error: signUpError.message || 'Failed to create user'
      });
    }

    // Add to admin_profiles table
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .insert([
        {
          id: signUpData.user.id,
          email: email.toLowerCase(),
          full_name: fullName || email,
          role: 'admin'
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
      // Try to delete the auth user since profile creation failed
      await supabase.auth.admin.deleteUser(signUpData.user.id);
      return res.status(400).json({
        success: false,
        error: 'Failed to create admin profile'
      });
    }

    res.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: signUpData.user.id,
        email: email.toLowerCase(),
        name: fullName || email
      }
    });

    console.log(`✅ New admin created: ${email}`);

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      success: false,
      error: 'Signup failed'
    });
  }
});

/**
 * POST /api/admin/auth/logout
 * Logout admin user
 */
router.post('/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

    console.log('✅ Admin logout successful');

  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * POST /api/admin/auth/refresh
 * Refresh authentication token using refresh token
 * Body: { refreshToken }
 */
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.error('Refresh error:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Create new custom token
    const customToken = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: customToken,
      session: data.session
    });

    console.log('✅ Token refreshed successfully');

  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

/**
 * GET /api/admin/auth/profile
 * Get current admin profile (requires authentication)
 */
router.get('/auth/profile', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, email, full_name, role, created_at, updated_at')
      .eq('id', req.admin.userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error.message);
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile: data
    });

  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * PATCH /api/admin/auth/profile
 * Update current admin profile (requires authentication)
 * Body: { fullName }
 */
router.patch('/auth/profile', verifyToken, async (req, res) => {
  try {
    const { fullName } = req.body;

    const { data, error } = await supabase
      .from('admin_profiles')
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.admin.userId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      profile: data
    });

    console.log(`✅ Profile updated for user: ${req.admin.email}`);

  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/admin/auth/change-password
 * Change admin password (requires authentication)
 * Body: { oldPassword, newPassword }
 */
router.post('/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old and new passwords required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Update password in Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password change error:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Failed to change password'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

    console.log(`✅ Password changed for user: ${req.admin.email}`);

  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * POST /api/admin/auth/reset-password
 * Send password reset email
 * Body: { email }
 */
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email required'
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/admin-reset-password.html`
    });

    if (error) {
      console.error('Reset password error:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Failed to send reset email'
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent. Check your inbox.'
    });

    console.log(`✅ Password reset email sent to: ${email}`);

  } catch (err) {
    console.error('Error sending reset email:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to send reset email'
    });
  }
});

/**
 * Middleware: Verify JWT Token
 * Used to protect routes that require authentication
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
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

// Export router and middleware
router.verifyToken = verifyToken;

module.exports = router;