require('dotenv').config();
const express = require('express');
const cors = require('cors');
const roiRoutes = require('./routes/roi.js');
const contactRoutes = require('./routes/contact.js');
const reviewsRoutes = require('./routes/reviews.js');
const leadRoutes = require('./routes/lead.js');
const excelRoutes = require('./routes/excel.js');
const adminAuthRoutes = require('./routes/admin-auth.js');
const adminRoutes = require('./routes/admin.js');  // ← ADD THIS

// Initialize Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Make it globally accessible
global.supabase = supabase;
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register all routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);  // ← ADD THIS

app.use('/api/roi', roiRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/lead', leadRoutes);
app.use('/api/excel', excelRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lease Nexus Backend Running' });
});

app.listen(PORT, () => {
  console.log(`✅ SendGrid initialized`);
  console.log(`Server running on http://localhost:${PORT}`);
});