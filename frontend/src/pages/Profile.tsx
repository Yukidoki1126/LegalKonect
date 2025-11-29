// src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LocationPickerWithMap from '../components/LocationPickerWithMap';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import api, { authAPI } from '../services/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
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
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account information and location</p>
        </div>

        {/* Content wrapper - constrain form width for better UX */}
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-red-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {/* Profile Header Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-5">
              <ProfilePictureUpload
                currentPicture={user?.profile_picture}
                onUpload={handleProfilePictureUpload}
                onDelete={handleProfilePictureDelete}
                isUploading={uploadingPicture}
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{user?.name || 'Your Name'}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    Client
                  </span>
                  {user?.city && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {user.city}, {user.province}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleBasicInfoSubmit} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+63 912 345 6789"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className={`w-full px-3 py-2 text-sm border rounded-md text-left flex items-center justify-between transition-colors ${
                    showLocationPicker 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className={user?.address ? '' : 'text-gray-400'}>
                      {user?.address ? `${user.city}, ${user.province}` : 'Set location'}
                    </span>
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showLocationPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Location Picker - Expandable */}
            {showLocationPicker && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <LocationPickerWithMap
                  initialLat={user?.latitude}
                  initialLng={user?.longitude}
                  initialAddress={user?.address || ''}
                  onLocationChange={handleLocationChange}
                />
                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCancelLocation}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {loading ? 'Saving...' : 'Save Location'}
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
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
