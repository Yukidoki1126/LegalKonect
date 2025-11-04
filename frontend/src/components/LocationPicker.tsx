// src/components/LocationPicker.tsx
import React, { useState } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import {
  getCurrentPosition,
  reverseGeocode,
  geocodeAddress,
  LocationData,
} from '../services/locationService';

const libraries: ("places")[] = ["places"];

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialAddress?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialAddress = '',
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Handle current location detection
  const handleDetectLocation = async () => {
    setLoading(true);
    setError('');

    try {
      // Get current position
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const locationData = await reverseGeocode(latitude, longitude);
      
      setAddress(locationData.address);
      onLocationSelect(locationData);
    } catch (err: any) {
      setError(err.message || 'Failed to detect location');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual address input
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const locationData = await geocodeAddress(address);
      onLocationSelect(locationData);
    } catch (err: any) {
      setError(err.message || 'Failed to find location');
    } finally {
      setLoading(false);
    }
  };

  // Handle autocomplete place selection
  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.formatted_address) {
        const location = place.geometry.location;
        
        if (location) {
          const lat = location.lat();
          const lng = location.lng();

          // Extract city and province
          let city = '';
          let province = '';

          place.address_components?.forEach((component) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              province = component.long_name;
            }
          });

          const locationData: LocationData = {
            latitude: lat,
            longitude: lng,
            address: place.formatted_address,
            city: city || 'Unknown',
            province: province || 'Unknown',
          };

          setAddress(place.formatted_address);
          onLocationSelect(locationData);
        }
      }
    }
  };

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  if (loadError) {
    return (
      <div className="text-red-600 text-sm">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="text-gray-600 text-sm">
        Loading location services...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Detect Current Location Button */}
      <div>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Detecting location...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Use My Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or enter address manually</span>
        </div>
      </div>

      {/* Manual Address Input with Autocomplete */}
      <form onSubmit={handleAddressSubmit} className="space-y-3">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </Autocomplete>
          <p className="mt-1 text-xs text-gray-500">
            Start typing to see suggestions
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Finding location...' : 'Confirm Address'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;