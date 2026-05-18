require('dotenv').config();
const express = require('express');
const cors = require('cors');
const roiRoutes = require('./routes/roi.js');
const contactRoutes = require('./routes/contact.js');
const reviewsRoutes = require('./routes/reviews.js');
const leadRoutes = require('./routes/lead.js');
const excelRoutes = require('./routes/excel.js');  // ← NEW LINE

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/roi', roiRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/lead', leadRoutes);
app.use('/api/excel', excelRoutes);  // ← NEW LINE

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lease Nexus Backend Running' });
});

app.listen(PORT, () => {
  console.log(`✅ SendGrid initialized`);
  console.log(`Server running on http://localhost:${PORT}`);
});