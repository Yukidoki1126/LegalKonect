import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api';

interface LocationPickerWithMapProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '280px',
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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapLocked, setIsMapLocked] = useState(true); // Lock map by default to prevent accidental clicks
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchInput, setSearchInput] = useState('');

  // Store original saved location for reset functionality
  const [savedLocation] = useState({
    lat: hasValidCoords && parseLat !== null ? parseLat : null,
    lng: hasValidCoords && parseLng !== null ? parseLng : null,
    address: initialAddress || ''
  });

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

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      // Only allow clicks if map is unlocked
      if (isMapLocked) {
        return;
      }

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
    [onLocationChange, isMapLocked]
  );

  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = useCallback(() => {
    // Only allow place selection if map is unlocked (in edit mode)
    if (!isMapLocked && autocomplete) {
      const place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        const lat = Number(place.geometry.location.lat());
        const lng = Number(place.geometry.location.lng());
        const position = { lat, lng };

        setCenter(position);
        setMarkerPosition(position);
        setAddress(place.formatted_address || '');
        setSearchInput('');

        onLocationChange(lat, lng, place.formatted_address || '');

        // Pan and zoom to the selected location
        if (map) {
          map.panTo(position);
          map.setZoom(17);
        }
      }
    } else if (isMapLocked) {
      // Clear search input if map is locked
      setSearchInput('');
    }
  }, [autocomplete, map, onLocationChange, isMapLocked]);

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

  const resetToSavedLocation = () => {
    if (savedLocation.lat !== null && savedLocation.lng !== null) {
      const position = { lat: savedLocation.lat, lng: savedLocation.lng };

      setCenter(position);
      setMarkerPosition(position);
      setAddress(savedLocation.address);
      setSearchInput('');

      // Pan to saved location
      if (map) {
        map.panTo(position);
        map.setZoom(15);
      }

      // Notify parent of reset (back to original saved location)
      onLocationChange(savedLocation.lat, savedLocation.lng, savedLocation.address);
    }
  };

  // Check if current location is different from saved location
  const hasUnsavedChanges =
    markerPosition &&
    savedLocation.lat !== null &&
    savedLocation.lng !== null &&
    (Math.abs(markerPosition.lat - savedLocation.lat) > 0.000001 ||
     Math.abs(markerPosition.lng - savedLocation.lng) > 0.000001);

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
    <div className="space-y-3">
      {/* Search and Controls Row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              componentRestrictions: { country: 'ph' },
              fields: ['formatted_address', 'geometry', 'name'],
            }}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isMapLocked ? 'Click "Edit" to search' : 'Search location...'}
                disabled={isMapLocked}
                className={`w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                  isMapLocked ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''
                }`}
              />
            </div>
          </Autocomplete>
        </div>
        <button
          type="button"
          onClick={() => setIsMapLocked(!isMapLocked)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isMapLocked
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {isMapLocked ? 'Edit' : 'Lock'}
        </button>
        <button
          type="button"
          onClick={getCurrentLocation}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm"
          title="Use current location"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">Current</span>
        </button>
        {/* Reset Button - Show when there are unsaved changes */}
        {hasUnsavedChanges && !isMapLocked && (
          <button
            type="button"
            onClick={resetToSavedLocation}
            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-sm"
            title="Reset to saved location"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Map */}
      <div className={`border border-gray-200 rounded-md overflow-hidden relative ${isMapLocked ? 'cursor-not-allowed' : 'cursor-crosshair'}`}>
        {isMapLocked && (
          <div className="absolute inset-0 bg-black/5 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
              <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Click "Edit" to change
              </p>
            </div>
          </div>
        )}
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
            gestureHandling: isMapLocked ? 'none' : 'greedy',
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
            />
          )}
        </GoogleMap>
      </div>

      {/* Selected Address Display - Compact */}
      {markerPosition && address && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">{address}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {Number(markerPosition.lat).toFixed(6)}, {Number(markerPosition.lng).toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(LocationPickerWithMap);
