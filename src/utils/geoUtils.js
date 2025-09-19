const axios = require('axios');
const { GEOCODE_API_KEY } = require('../config/config');

// TODO: Implement a robust geocoding utility.
// This is a placeholder for a 3rd party geocoding service like Google Geocoding API or OpenStreetMap Nominatim.
// Steps:
// 1. Configure actual API endpoint and authentication.
// 2. Handle rate limiting and error responses.
// 3. Potentially cache results for frequently requested addresses.

/**
 * Converts an address string to GeoJSON (latitude, longitude, city, country).
 * @param {string} address - The address string.
 * @returns {Promise<object>} GeoJSON object or null if not found.
 */
const geocodeAddress = async (address) => {
  if (!GEOCODE_API_KEY) {
    console.warn('GEOCODE_API_KEY is not set. Geocoding will return placeholder data.');
    // Return a mock GeoJSON structure if API key is missing
    return {
      type: 'Point',
      coordinates: [0, 0], // Placeholder coordinates
      properties: { city: 'Unknown', country: 'Unknown', originalAddress: address }
    };
  }

  try {
    // --- Step 1: Configure actual API endpoint and authentication ---
    // For demonstration, we'll use OpenStreetMap Nominatim API.
    // You might need to adjust the API endpoint and parameters based on your chosen service.
    // Nominatim requires a user agent.
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;

    const response = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'NodeGeoUtils/1.0' // Essential for Nominatim
      }
    });

    const data = response.data;

    // --- Step 2: Handle rate limiting and error responses ---
    // Nominatim's status is usually indicated by the response code and data presence.
    // A 429 error would indicate rate limiting, which we'll handle generically.
    if (response.status >= 400) {
      console.error(`Geocoding API returned an error for address "${address}" with status: ${response.status}`);
      return null;
    }

    if (data && data.length > 0) {
      const result = data[0];
      const { lat, lon } = result;
      const { city, country } = result.address;

      // --- Step 3: Potentially cache results for frequently requested addresses ---
      // Caching logic would typically go here, perhaps using a library like 'node-cache'
      // or a Redis instance, before making the API call. For this example, we'll skip caching.

      return {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)], // GeoJSON standard is [longitude, latitude]
        properties: {
          city: city || 'Unknown',
          country: country || 'Unknown',
          originalAddress: address,
          // You can add more properties from the API response if needed
        }
      };
    } else {
      // Address not found
      console.warn(`Address "${address}" not found by the geocoding service.`);
      return null;
    }

  } catch (error) {
    // --- Step 2 (cont.): Handle error responses ---
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Geocoding API error for address "${address}": Status ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`Geocoding API request failed for address "${address}": No response received.`, error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`Geocoding utility error for address "${address}":`, error.message);
    }
    return null;
  }
};

module.exports = { geocodeAddress };