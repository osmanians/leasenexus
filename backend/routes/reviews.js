const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/google', async (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return res.json({ success: false, reviews: [], error: 'Google API keys not configured' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.result && data.result.reviews) {
      const reviews = data.result.reviews.slice(0, 6).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: new Date(r.time * 1000).toLocaleDateString(),
        profilePhoto: r.profile_photo_url
      }));
      res.json({ success: true, reviews });
    } else {
      res.json({ success: false, reviews: [], error: 'No reviews found' });
    }
  } catch (err) {
    console.error('Google Reviews error:', err);
    res.json({ success: false, reviews: [], error: err.message });
  }
});

module.exports = router;