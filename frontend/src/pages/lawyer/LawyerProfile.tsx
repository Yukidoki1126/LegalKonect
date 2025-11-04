import React, { useEffect, useState } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import LocationPickerWithMap from '../../components/LocationPickerWithMap';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';

interface LawyerProfile {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  license_number: string;
  years_experience: number;
  hourly_rate: number;
  office_address: string;
  office_phone: string;
  office_hours: string;
  profile_photo?: string | null;
  is_available: boolean;
  specializations: Array<{ id: number; name: string }>;
}

interface Specialization {
  id: number;
  name: string;
}

const LawyerProfile: React.FC = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    license_number: '',
    years_experience: 0,
    hourly_rate: 0,
    office_address: '',
    office_latitude: null as number | null,
    office_longitude: null as number | null,
    office_phone: '',
    office_hours: '',
    is_available: true,
    specialization_ids: [] as number[],
  });

  useEffect(() => {
    fetchProfile();
    fetchSpecializations();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await lawyerApi.getProfile();
      setCurrentProfilePhoto(data.profile_photo || null);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        bio: data.bio || '',
        license_number: data.license_number || '',
        years_experience: data.years_experience || 0,
        hourly_rate: data.hourly_rate || 0,
        office_address: data.office_address || '',
        office_latitude: data.office_latitude || null,
        office_longitude: data.office_longitude || null,
        office_phone: data.office_phone || '',
        office_hours: data.office_hours || '',
        is_available: data.is_available,
        specialization_ids: data.specializations?.map((s: { id: number; name: string }) => s.id) || [],
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await lawyerApi.getSpecializations();
      setSpecializations(response);
    } catch (err) {
      console.error('Error fetching specializations:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      is_available: e.target.checked,
    }));
  };

  const handleSpecializationToggle = (specId: number) => {
    setFormData(prev => ({
      ...prev,
      specialization_ids: prev.specialization_ids.includes(specId)
        ? prev.specialization_ids.filter(id => id !== specId)
        : [...prev.specialization_ids, specId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await lawyerApi.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      fetchProfile();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setError('');
    setSuccess('');

    try {
      const response = await lawyerApi.uploadProfilePhoto(file);
      console.log('Upload response:', response);

      // Handle both response structures
      const profilePhoto = response.lawyer?.profile_photo || response.profile_photo || null;
      setCurrentProfilePhoto(profilePhoto);
      setSuccess('Profile photo uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error uploading profile photo:', err);
      console.error('Error details:', err.response?.data);

      // Extract validation errors if present
      const errors = err.response?.data?.errors;
      let errorMessage = err.response?.data?.message || 'Failed to upload profile photo';

      if (errors && errors.profile_photo) {
        errorMessage = errors.profile_photo[0];
      }

      setError(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle profile photo delete
  const handleProfilePhotoDelete = async () => {
    setUploadingPhoto(true);
    setError('');
    setSuccess('');

    try {
      const response = await lawyerApi.deleteProfilePhoto();
      console.log('Delete response:', response);
      setCurrentProfilePhoto(null);
      setSuccess('Profile photo deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting profile photo:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to delete profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your professional information</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-3 sm:mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs sm:text-sm text-red-800 break-words">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-3 sm:mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-xs sm:text-sm text-green-800 break-words">{success}</p>
          </div>
        </div>
      )}

      {/* Profile Photo Section */}
      <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Profile Photo</h2>
        <div className="flex justify-center">
          <ProfilePictureUpload
            currentPicture={currentProfilePhoto}
            onUpload={handleProfilePhotoUpload}
            onDelete={handleProfilePhotoDelete}
            isUploading={uploadingPhoto}
          />
        </div>
      </div>

    
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
     
          <div className="space-y-4 sm:space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Personal Information</h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Professional Bio <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Tell clients about your expertise..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 50 characters</p>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="years_experience"
                    value={formData.years_experience}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Office Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="office_phone"
                    value={formData.office_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Office Hours
                  </label>
                  <input
                    type="text"
                    name="office_hours"
                    value={formData.office_hours}
                    onChange={handleInputChange}
                    placeholder="e.g., Mon-Fri 9:00 AM - 5:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Specializations <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-gray-600 mb-3">Select at least one area of practice</p>

              <div className="grid grid-cols-2 gap-2">
                {specializations.map((spec) => (
                  <label
                    key={spec.id}
                    className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.specialization_ids.includes(spec.id)}
                      onChange={() => handleSpecializationToggle(spec.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{spec.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Availability</h2>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Available for new clients</span>
                  <p className="text-xs text-gray-500">
                    When unchecked, your profile will be hidden from client searches
                  </p>
                </div>
              </label>
            </div>
          </div>

        
          <div>
            {/* Office Location */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Office Location</h2>

              <LocationPickerWithMap
                initialLat={formData.office_latitude || undefined}
                initialLng={formData.office_longitude || undefined}
                initialAddress={formData.office_address}
                onLocationChange={(lat, lng, address) => {
                  setFormData(prev => ({
                    ...prev,
                    office_latitude: lat,
                    office_longitude: lng,
                    office_address: address,
                  }));
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex justify-end space-x-3">
          <button
            type="button"
            onClick={fetchProfile}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving || formData.specialization_ids.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LawyerProfile;
