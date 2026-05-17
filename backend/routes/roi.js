const express = require('express');
const router = express.Router();
const { getEstimateFromPublicData } = require('../services/scraper.js');

router.post('/calculate', async (req, res) => {
  try {
    const userInput = req.body;
    const marketData = await getEstimateFromPublicData(userInput);
    res.json({
      success: true,
      marketData: {
        avgRent: marketData.avgRent,
        avgPricePerSqft: marketData.avgPricePerSqft,
        comparableListings: marketData.comparableListings,
        marketArea: marketData.marketArea,
        province: marketData.province,
        minRent: marketData.minRent,
        maxRent: marketData.maxRent
      }
    });
  } catch (error) {
    console.error('ROI error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch market data' });
  }
});

module.exports = router;