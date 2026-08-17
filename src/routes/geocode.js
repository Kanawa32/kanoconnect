import { Router } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json', 'accept-language': 'en' },
      headers: { 'User-Agent': 'KanoConnect/1.0' },
    });

    if (response.data?.display_name) {
      res.json({
        success: true,
        data: {
          address: response.data.display_name,
          lat: parseFloat(response.data.lat),
          lng: parseFloat(response.data.lon),
        },
      });
    } else {
      res.json({ success: false, message: 'No address found for these coordinates' });
    }
  } catch (error) {
    res.status(502).json({ success: false, message: 'Geocoding service unavailable' });
  }
});

router.post('/forward', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ success: false, message: 'address is required' });
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', limit: 1, 'accept-language': 'en' },
      headers: { 'User-Agent': 'KanoConnect/1.0' },
    });

    if (response.data?.length > 0) {
      res.json({
        success: true,
        data: {
          address: response.data[0].display_name,
          lat: parseFloat(response.data[0].lat),
          lng: parseFloat(response.data[0].lon),
        },
      });
    } else {
      res.json({ success: false, message: 'No results found for this address' });
    }
  } catch (error) {
    res.status(502).json({ success: false, message: 'Geocoding service unavailable' });
  }
});

export default router;
