// backend/routes/roi.js
// ROI Calculator - Property rental income estimation
// Uses offline algorithm based on postal code FSA and property details

const express = require('express');
const router = express.Router();
const { getEstimateFromPublicData } = require('../services/scraper');

/**
 * POST /api/roi/calculate
 * Calculates estimated rental income for a property
 * 
 * Expected payload:
 * {
 *   address: string (full address),
 *   postal: string (postal code),
 *   bedrooms: string | number (e.g., '1', '2', '3+'),
 *   sqft: number (square footage),
 *   propertyType: string (e.g., 'Apartment', 'Condo', 'Townhouse', 'Single Family'),
 *   bathrooms: string | number (e.g., '1', '1.5', '2'),
 *   levels: string | number (e.g., '1', '2', '3'),
 *   parking: string | number (e.g., '0', '1', '2', '3+')
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   marketData: {
 *     avgRent: number,
 *     minRent: number,
 *     maxRent: number,
 *     avgPricePerSqft: number,
 *     marketArea: string,
 *     province: string,
 *     comparableListings: number
 *   }
 * }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { address, postal, bedrooms, sqft, propertyType, bathrooms, levels, parking } = req.body;

    // Validate required fields
    if (!address || !postal) {
      return res.status(400).json({
        success: false,
        error: 'Address and postal code are required'
      });
    }

    if (!bedrooms) {
      return res.status(400).json({
        success: false,
        error: 'Number of bedrooms is required'
      });
    }

    if (!sqft || sqft < 100) {
      return res.status(400).json({
        success: false,
        error: 'Valid square footage is required (minimum 100 sqft)'
      });
    }

    // Log the ROI calculation request
    console.log(`📊 ROI Calculation: ${address}, ${postal} - ${bedrooms} bed, ${sqft} sqft`);

    // Prepare input for estimation algorithm
    const userInput = {
      address: address.trim(),
      postal: postal.trim().toUpperCase(),
      bedrooms: bedrooms?.toString() || '1',
      sqft: parseInt(sqft) || 1000,
      propertyType: propertyType?.toLowerCase() || 'apartment',
      bathrooms: bathrooms?.toString() || '1',
      levels: levels?.toString() || '1',
      parking: parking?.toString() || '0'
    };

    // Call the estimation algorithm
    const marketData = await getEstimateFromPublicData(userInput);

    // Validate the response
    if (!marketData || !marketData.avgRent) {
      return res.status(500).json({
        success: false,
        error: 'Unable to calculate estimate for the provided location'
      });
    }

    // Format response
    const response = {
      success: true,
      marketData: {
        avgRent: Math.round(marketData.avgRent),
        minRent: Math.round(marketData.minRent),
        maxRent: Math.round(marketData.maxRent),
        avgPricePerSqft: parseFloat(marketData.avgPricePerSqft.toFixed(2)),
        marketArea: marketData.marketArea,
        province: marketData.province,
        comparableListings: marketData.comparableListings || 15
      }
    };

    // Log the result
    console.log(`✅ Estimate: $${response.marketData.avgRent}/month for ${marketData.marketArea}, ${marketData.province}`);

    res.json(response);

  } catch (err) {
    console.error('ROI calculation error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to calculate ROI estimate'
    });
  }
});

/**
 * GET /api/roi/estimate
 * Optional: Get an estimate without full details (for quick estimates)
 */
router.get('/estimate', async (req, res) => {
  try {
    const { postal, bedrooms } = req.query;

    if (!postal || !bedrooms) {
      return res.status(400).json({
        success: false,
        error: 'Postal code and bedrooms are required'
      });
    }

    const quickEstimate = await getEstimateFromPublicData({
      postal: postal.trim().toUpperCase(),
      bedrooms: bedrooms.toString(),
      sqft: 1000,
      propertyType: 'apartment',
      bathrooms: '1',
      levels: '1',
      parking: '0'
    });

    res.json({
      success: true,
      estimate: {
        avgRent: Math.round(quickEstimate.avgRent),
        marketArea: quickEstimate.marketArea,
        province: quickEstimate.province
      }
    });

  } catch (err) {
    console.error('Quick estimate error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;