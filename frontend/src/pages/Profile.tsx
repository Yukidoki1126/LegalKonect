// src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLawyers } from '../context/LawyersContext';
import LocationPickerWithMap from '../components/LocationPickerWithMap';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import api, { authAPI } from '../services/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { invalidateCache } = useLawyers();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Clear any stale errors on mount
  useEffect(() => {
    setError('');
    setSuccess('');
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Temporary location state (not saved until "Done" is clicked)
  const [tempLocation, setTempLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  // Handle location selection from map (temporary, not saved yet)
  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setTempLocation({ lat, lng, address });
  };

  // Save location when "Done" is clicked
  const handleSaveLocation = async () => {
    if (!tempLocation) {
      setShowLocationPicker(false);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Extract city and province from address (basic extraction)
      const addressParts = tempLocation.address.split(',');
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 3]?.trim() || 'Unknown' : 'Unknown';
      const province = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() || 'Unknown' : 'Unknown';

      const response = await api.post('/auth/location', {
        latitude: tempLocation.lat,
        longitude: tempLocation.lng,
        address: tempLocation.address,
        city: city,
        province: province,
      });

      // Update user context with new location data
      updateUser(response.data.user);

      // Request immediate refresh of lawyers list (search page)
      invalidateCache();
      window.dispatchEvent(new CustomEvent('lawyers:event', { detail: 'lawyers:refresh' }));

      setSuccess('Location updated successfully!');
      setShowLocationPicker(false);
      setTempLocation(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  // Cancel location picker
  const handleCancelLocation = () => {
    setShowLocationPicker(false);
    setTempLocation(null);
  };

  // Handle basic info update
  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/auth/profile', formData);
      updateUser(response.data.user);
      // Request immediate refresh of lawyers list (search page)
      invalidateCache();
      window.dispatchEvent(new CustomEvent('lawyers:event', { detail: 'lawyers:refresh' }));
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file: File) => {
    // Validate file exists
    if (!file) {
      console.error('No file provided to upload');
      setError('Please select a file to upload');
      return;
    }

    console.log('Uploading file:', file.name, file.type, file.size);
    setUploadingPicture(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.uploadProfilePicture(file);
      console.log('Upload successful:', response);
      updateUser(response.data.user);
      setSuccess('Profile picture uploaded successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message
        || err.response?.data?.errors?.profile_picture?.[0]
        || 'Failed to upload profile picture';
      setError(errorMessage);
    } finally {
      setUploadingPicture(false);
    }
  };

  // Handle profile picture delete
  const handleProfilePictureDelete = async () => {
    setUploadingPicture(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.deleteProfilePicture();
      updateUser(response.data.user);
      setSuccess('Profile picture deleted successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting profile picture:', err);
      setError(err.response?.data?.message || 'Failed to delete profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 animate-fadeIn pt-16">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-8">
        {/* Header - upper left with gradient accent */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          </div>
          <p className="text-base text-gray-500 ml-13">Manage your account information and location</p>
        </div>

        {/* Content wrapper - full width */}
        <div>
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm animate-slideDown">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 shadow-sm animate-shake">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button onClick={() => setError('')} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        {/* Main Card */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-soft overflow-hidden">
          {/* Profile Header Section */}
          <div className="p-4 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/20">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <ProfilePictureUpload
                currentPicture={user?.profile_picture_url || user?.profile_picture}
                onUpload={handleProfilePictureUpload}
                onDelete={handleProfilePictureDelete}
                isUploading={uploadingPicture}
              />
              <div className="flex-1 text-center sm:text-left w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{user?.name || 'Your Name'}</h2>
                <p className="text-sm sm:text-base text-gray-500 mt-1 break-all">{user?.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <span className="inline-flex items-center px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client
                  </span>
                  {user?.city && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600 bg-gray-100 px-2.5 sm:px-3 py-1.5 rounded-full max-w-full">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{user.city}, {user.province}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleBasicInfoSubmit} className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div className="group">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                    placeholder="+63 912 345 6789"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <div className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl bg-gray-50/50 flex items-center gap-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <span className={`truncate ${user?.address || user?.city ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {user?.address || (user?.city ? `${user.city}, ${user.province}` : 'No address set')}
                  </span>
                </div>
              </div>
            </div>

            {/* Map Section - Always Visible */}
            <div className="mt-8">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Update Your Address</h3>
                </div>
                <LocationPickerWithMap
                  initialLat={user?.latitude}
                  initialLng={user?.longitude}
                  initialAddress={user?.address || ''}
                  onLocationChange={handleLocationChange}
                />
                <div className="mt-4 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    disabled={loading}
                    className="px-6 py-2.5 text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Save Location
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-start">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-button hover:shadow-button-hover transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
