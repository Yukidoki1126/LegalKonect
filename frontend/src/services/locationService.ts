// src/services/locationService.ts

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  province: string;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Get user's current location using browser geolocation
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        let message = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Please try again or enter your address manually.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again or enter your address manually.';
            break;
        }
        reject({ code: error.code, message });
      },
      {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 15000, // Increase timeout to 15 seconds
        maximumAge: 0, // Don't use cached position
      }
    );
  });
};

// Reverse geocode coordinates to address using Google Geocoding API
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<LocationData> => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Unable to find address for this location');
    }

    // Try to find the most specific address (prefer ROOFTOP or RANGE_INTERPOLATED)
    let bestResult = data.results[0];

    for (const result of data.results) {
      if (result.geometry?.location_type === 'ROOFTOP' ||
          result.geometry?.location_type === 'RANGE_INTERPOLATED') {
        bestResult = result;
        break;
      }
    }

    const addressComponents = bestResult.address_components;

    // Extract city and province from address components
    let city = '';
    let province = '';

    addressComponents.forEach((component: any) => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        province = component.long_name;
      }
    });

    return {
      latitude,
      longitude,
      address: bestResult.formatted_address,
      city: city || 'Unknown',
      province: province || 'Unknown',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to get address from coordinates');
  }
};

// Geocode address to coordinates using Google Geocoding API
export const geocodeAddress = async (address: string): Promise<LocationData> => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Address not found. Please check and try again.');
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    const addressComponents = result.address_components;

    let city = '';
    let province = '';

    addressComponents.forEach((component: any) => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        province = component.long_name;
      }
    });

    return {
      latitude: lat,
      longitude: lng,
      address: result.formatted_address,
      city: city || 'Unknown',
      province: province || 'Unknown',
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to find location for this address');
  }
};