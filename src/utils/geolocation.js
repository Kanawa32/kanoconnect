import axios from 'axios';
import logger from './logger.js';

export const geocodeAddress = async (address) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.startsWith('your-')) {
    logger.warn('Google Maps API key not configured, using fallback coordinates');
    return { lat: 9.0579, lng: 7.4951, formattedAddress: address };
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: apiKey,
      },
    });

    if (response.data.results.length === 0) {
      return null;
    }

    const { lat, lng } = response.data.results[0].geometry.location;
    return { lat, lng, formattedAddress: response.data.results[0].formatted_address };
  } catch (error) {
    logger.error(`Geocoding error: ${error.message}`);
    return null;
  }
};

export const calculateDistance = async (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.startsWith('your-')) {
    const R = 6371;
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLng = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { distance: Math.round(distance * 10) / 10, duration: Math.round(distance * 2) };
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        key: apiKey,
      },
    });

    const element = response.data.rows[0].elements[0];
    if (element.status !== 'OK') {
      return null;
    }

    return {
      distance: element.distance.value / 1000,
      duration: Math.ceil(element.duration.value / 60),
    };
  } catch (error) {
    logger.error(`Distance calculation error: ${error.message}`);
    return null;
  }
};

export const getDirections = async (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.startsWith('your-')) {
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        key: apiKey,
      },
    });

    if (response.data.routes.length === 0) {
      return null;
    }

    const route = response.data.routes[0];
    return {
      polyline: route.overview_polyline.points,
      distance: route.legs[0].distance.value / 1000,
      duration: Math.ceil(route.legs[0].duration.value / 60),
      steps: route.legs[0].steps.map(step => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text,
      })),
    };
  } catch (error) {
    logger.error(`Directions error: ${error.message}`);
    return null;
  }
};
