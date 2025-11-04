import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, Autocomplete, useLoadScript } from '@react-google-maps/api';

interface LocationPickerWithMapProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 14.5995, // Manila, Philippines
  lng: 120.9842,
};

const libraries: ("places")[] = ["places"];

const LocationPickerWithMap: React.FC<LocationPickerWithMapProps> = ({
  initialLat,
  initialLng,
  initialAddress,
  onLocationChange,
}) => {
  // Parse and validate initial coordinates
  const parseLat = initialLat ? Number(initialLat) : null;
  const parseLng = initialLng ? Number(initialLng) : null;
  const hasValidCoords = parseLat !== null && parseLng !== null &&
                         !isNaN(parseLat) && !isNaN(parseLng) &&
                         parseLat >= -90 && parseLat <= 90 &&
                         parseLng >= -180 && parseLng <= 180;

  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    hasValidCoords && parseLat !== null && parseLng !== null
      ? { lat: parseLat, lng: parseLng }
      : defaultCenter
  );
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    hasValidCoords && parseLat !== null && parseLng !== null
      ? { lat: parseLat, lng: parseLng }
      : null
  );
  const [address, setAddress] = useState(initialAddress || '');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
    preventGoogleFontsLoading: true,
    version: 'weekly',
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = Number(place.geometry.location.lat());
        const lng = Number(place.geometry.location.lng());
        const formattedAddress = place.formatted_address || '';

        const newCenter = { lat, lng };
        setCenter(newCenter);
        setMarkerPosition(newCenter);
        setAddress(formattedAddress);
        onLocationChange(lat, lng, formattedAddress);

        // Animate to new location
        if (map) {
          map.panTo(newCenter);
        }
      }
    }
  };

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = Number(e.latLng.lat());
        const lng = Number(e.latLng.lng());
        const position = { lat, lng };

        setMarkerPosition(position);

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const formattedAddress = results[0].formatted_address;
            setAddress(formattedAddress);
            onLocationChange(lat, lng, formattedAddress);
          }
        });
      }
    },
    [onLocationChange]
  );

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude);
          const lng = Number(position.coords.longitude);
          const newPosition = { lat, lng };

          setCenter(newPosition);
          setMarkerPosition(newPosition);

          // Reverse geocode with preferences for more accurate results
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            {
              location: newPosition,
              // Prefer rooftop accuracy and specific addresses
            },
            (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                // Try to find the most specific address (prefer ROOFTOP or RANGE_INTERPOLATED)
                let bestResult = results[0];

                // Look for a more specific result if available
                for (const result of results) {
                  if (result.geometry.location_type === 'ROOFTOP' ||
                      result.geometry.location_type === 'RANGE_INTERPOLATED') {
                    bestResult = result;
                    break;
                  }
                }

                const formattedAddress = bestResult.formatted_address;
                setAddress(formattedAddress);
                onLocationChange(lat, lng, formattedAddress);
              } else {
                // If geocoding fails, still set the coordinates with a generic message
                const genericAddress = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setAddress(genericAddress);
                onLocationChange(lat, lng, genericAddress);
              }
            }
          );

          // Pan to location
          if (map) {
            map.panTo(newPosition);
            map.setZoom(18); // Zoom in closer for current location
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location access denied. Please enable location permissions in your browser settings.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert('Location information is unavailable. Please try again or search manually.');
          } else if (error.code === error.TIMEOUT) {
            alert('Location request timed out. Please try again.');
          } else {
            alert('Could not get your current location. Please search or click on the map.');
          }
        },
        {
          enableHighAccuracy: true, // Request high accuracy GPS
          timeout: 10000, // 10 second timeout
          maximumAge: 0 // Don't use cached position
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Error loading Google Maps. Please check your API key configuration.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Google Maps API key is not configured. Please add <code className="bg-yellow-100 px-1 py-0.5 rounded">REACT_APP_GOOGLE_MAPS_API_KEY</code> to your .env file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search Location or Click on Map <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {isLoaded && (
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              className="flex-1"
            >
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Search for your office location..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </Autocomplete>
          )}
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden md:inline">Use Current Location</span>
            <span className="md:hidden">Current</span>
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          onClick={onMapClick}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
            />
          )}
        </GoogleMap>
      </div>

      {/* Selected Address Display */}
      {markerPosition && address && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">Selected Office Location:</p>
              <p className="text-sm text-blue-800">{address}</p>
              <p className="text-xs text-blue-600 mt-2">
                Coordinates: {Number(markerPosition.lat).toFixed(6)}, {Number(markerPosition.lng).toFixed(6)}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${Number(markerPosition.lat)},${Number(markerPosition.lng)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-700 hover:text-blue-900 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Get Directions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div className="flex-1">
            <p className="text-xs text-gray-700 font-medium mb-1">How to pin your office location:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Search for your office address in the search box</li>
              <li>Click "Use Current Location" if you're at your office (may show approximate address)</li>
              <li>Or click anywhere on the map to manually pin your exact location</li>
              <li>The pin location is what matters - you can edit the address text if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerWithMap;
