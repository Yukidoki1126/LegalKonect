import React, { useEffect, useState } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import LocationPickerWithMap from '../../components/LocationPickerWithMap';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';
import PaymentSettings from '../../components/lawyer/PaymentSettings';
import { 
  User, 
  Shield, 
  BadgeCheck, 
  Clock, 
  AlertCircle, 
  Save,
  Briefcase,
  MapPin,
  Phone,
  FileText,
  DollarSign
} from 'lucide-react';

interface LawyerProfile {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  license_number: string;
  years_experience: number;
  hourly_rate: number;
  reservation_fee: number;
  office_address: string;
  office_phone: string;
  office_hours: string;
  profile_photo?: string | null;
  is_available: boolean;
  verification_status?: 'pending' | 'verified' | 'rejected';
  verified_at?: string | null;
  verification_notes?: string | null;
  specializations: Array<{ id: number; name: string }>;
  // Payment info
  gcash_number?: string;
  gcash_account_name?: string;
  gcash_qr_code?: string | null;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  preferred_payout_method?: 'gcash' | 'bank';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected' | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<string | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [pendingAvailability, setPendingAvailability] = useState<boolean | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Payment info state
  const [paymentInfo, setPaymentInfo] = useState<{
    gcash_number?: string;
    gcash_account_name?: string;
    gcash_qr_code?: string | null;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    preferred_payout_method?: 'gcash' | 'bank';
  }>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    license_number: '',
    years_experience: 0,
    hourly_rate: 0,
    reservation_fee: 100,
    office_address: '',
    office_latitude: null as number | null,
    office_longitude: null as number | null,
    office_phone: '',
    office_hours: '',
    is_available: true,
    specialization_ids: [] as number[],
  });

  useEffect(() => {
    Promise.all([fetchProfile(), fetchSpecializations()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchProfile = async () => {
    try {
      // Use fresh profile data (bypass cache) to ensure latest photo URL
      const data = await lawyerApi.getProfileFresh();
      console.log('Profile data:', data);
      console.log('Profile photo URL:', data.profile_photo_url);
      console.log('Profile photo:', data.profile_photo);
      setCurrentProfilePhoto(data.profile_photo_url || data.profile_photo || null);
      setVerificationStatus(data.verification_status || null);
      setVerifiedAt(data.verified_at || null);
      setVerificationNotes(data.verification_notes || null);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        bio: data.bio || '',
        license_number: data.license_number || '',
        years_experience: data.years_experience || 0,
        hourly_rate: data.hourly_rate || 0,
        reservation_fee: data.reservation_fee || 100,
        office_address: data.office_address || '',
        office_latitude: data.office_latitude || null,
        office_longitude: data.office_longitude || null,
        office_phone: data.office_phone || '',
        office_hours: data.office_hours || '',
        is_available: data.is_available,
        specialization_ids: data.specializations?.map((s: { id: number; name: string }) => s.id) || [],
      });
      // Set payment info
      setPaymentInfo({
        gcash_number: data.gcash_number || '',
        gcash_account_name: data.gcash_account_name || '',
        gcash_qr_code: data.gcash_qr_url || data.gcash_qr_code || null,
        bank_name: data.bank_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_account_name: data.bank_account_name || '',
        preferred_payout_method: data.preferred_payout_method || 'gcash',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
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
    // Show confirmation modal instead of direct change
    setPendingAvailability(e.target.checked);
    setShowAvailabilityModal(true);
  };

  const confirmAvailabilityChange = async () => {
    if (pendingAvailability === null) return;
    
    setSavingAvailability(true);
    try {
      // Call the toggle availability API
      const response = await lawyerApi.toggleAvailability();
      
      // Update local state with the response
      setFormData(prev => ({
        ...prev,
        is_available: response.is_available,
      }));
      
      setSuccessMessage(response.is_available 
        ? 'You are now available for new clients!' 
        : 'You are now unavailable for new clients.');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err: any) {
      console.error('Error toggling availability:', err);
      setError(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setSavingAvailability(false);
      setShowAvailabilityModal(false);
      setPendingAvailability(null);
    }
  };

  const cancelAvailabilityChange = () => {
    setShowAvailabilityModal(false);
    setPendingAvailability(null);
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

    // Debug: Log what we're sending
    console.log('📤 Submitting profile with is_available:', formData.is_available);
    console.log('📤 Full formData:', formData);

    try {
      await lawyerApi.updateProfile(formData);
      setSuccessMessage('Profile updated successfully!');
      setShowSuccessModal(true);
      fetchProfile();

      // Auto-dismiss modal after 3 seconds
      setTimeout(() => setShowSuccessModal(false), 3000);
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

      // Prioritize profile_photo_url for R2 storage compatibility
      const profilePhoto = response.lawyer?.profile_photo_url || 
                          response.lawyer?.profile_photo || 
                          response.profile_photo_url || 
                          response.profile_photo || 
                          null;
      setCurrentProfilePhoto(profilePhoto);
      setSuccessMessage('Profile photo uploaded successfully!');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
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
      setSuccessMessage('Profile photo deleted successfully!');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
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
      <div className="max-w-full overflow-x-hidden animate-fadeIn">
        {/* Header Skeleton - matching actual design */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-slate-100 rounded-xl">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            <div className="h-8 bg-gray-200 rounded-lg w-44 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-64 ml-14 animate-pulse"></div>
        </div>

        {/* Profile Photo and Verification Status Section - Two Columns */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
          {/* Profile Photo Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-300" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <div className="h-9 bg-gray-200 rounded-lg w-24"></div>
              <div className="h-9 bg-gray-100 rounded-lg w-20"></div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Shield className="w-4 h-4 text-purple-300" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-36"></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-7 bg-gray-200 rounded-full w-24"></div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-200 rounded-lg w-8 h-8"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section Skeleton */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 animate-pulse">
          {/* Personal Information */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg w-8 h-8"></div>
              <div className="h-5 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-11 bg-gray-100 rounded-xl"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-11 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-28 bg-gray-100 rounded-xl"></div>
          </div>

          {/* Professional Details */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg w-8 h-8"></div>
              <div className="h-5 bg-gray-200 rounded w-44"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                <div className="h-11 bg-gray-100 rounded-xl"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
                <div className="h-11 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-11 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          </div>

          {/* Office Details */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-50 rounded-lg w-8 h-8"></div>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                <div className="h-11 bg-gray-100 rounded-xl"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-11 bg-gray-100 rounded-xl"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-11 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <div className="h-11 bg-gray-200 rounded-xl w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden animate-fadeIn">
      {/* Header - Clean transparent style */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-slate-100 rounded-xl">
            <User className="w-6 h-6 text-slate-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
        </div>
        <p className="text-gray-500 ml-14">Manage your professional information</p>
      </div>

      {/* Alerts - Enhanced */}
      {error && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <BadgeCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Profile Photo and Verification Status Section */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile Photo - Enhanced */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Profile Photo</h2>
          </div>
          <div className="flex justify-center">
            <ProfilePictureUpload
              currentPicture={currentProfilePhoto}
              onUpload={handleProfilePhotoUpload}
              onDelete={handleProfilePhotoDelete}
              isUploading={uploadingPhoto}
            />
          </div>
        </div>

        {/* Verification Status - Enhanced */}
        {verificationStatus && (
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${
                  verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                  verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {verificationStatus === 'verified' && <BadgeCheck className="w-4 h-4" />}
                  {verificationStatus === 'rejected' && <AlertCircle className="w-4 h-4" />}
                  {verificationStatus === 'pending' && <Clock className="w-4 h-4" />}
                  {verificationStatus === 'verified' ? 'Verified' :
                   verificationStatus === 'rejected' ? 'Rejected' :
                   'Pending'}
                </span>
              </div>

              {verificationStatus === 'pending' && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-800">Verification In Progress</h3>
                      <p className="text-xs text-yellow-700 mt-1">
                        Your credentials are being reviewed. You'll be notified once complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus === 'verified' && verifiedAt && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <BadgeCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-green-800">Verified Lawyer</h3>
                      <p className="text-xs text-green-700 mt-1">
                        Your credentials have been verified on {new Date(verifiedAt).toLocaleDateString()}
                      </p>
                      {verificationNotes && (
                        <p className="text-xs text-green-700 mt-2 italic">
                          Note: {verificationNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus === 'rejected' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Verification Rejected</h3>
                      <p className="text-xs text-red-700 mt-1">
                        Unfortunately, your verification was not approved. Please contact support for more information.
                      </p>
                      {verificationNotes && (
                        <div className="mt-2 p-2 bg-red-100 rounded">
                          <p className="text-xs text-red-800 font-medium">Reason:</p>
                          <p className="text-xs text-red-700 mt-1">{verificationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
     
          <div className="space-y-4">
            {/* Personal Information - Enhanced */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Professional Bio <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Tell clients about your expertise..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Minimum 50 characters</p>
                </div>
              </div>
            </div>

            {/* Professional Details - Enhanced */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Professional Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="years_experience"
                    value={formData.years_experience}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reservation Fee (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="reservation_fee"
                    value={formData.reservation_fee}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Clients pay this amount to reserve an appointment. Default is ₱100.00
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Office Phone <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="office_phone"
                    value={formData.office_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Specializations - Enhanced */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Specializations <span className="text-red-500">*</span>
                </h2>
              </div>
              <p className="text-xs text-gray-600 mb-4 ml-10">Select at least one area of practice</p>

              <div className="grid grid-cols-2 gap-2">
                {specializations.map((spec) => (
                  <label
                    key={spec.id}
                    className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.specialization_ids.includes(spec.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.specialization_ids.includes(spec.id)}
                      onChange={() => handleSpecializationToggle(spec.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">{spec.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

        
          <div>
            {/* Office Location - Enhanced */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Office Location</h2>
              </div>

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

            {/* Availability - Enhanced */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Availability</h2>
              </div>

              <label className="flex items-center cursor-pointer p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-semibold text-gray-700">Available for new clients</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When unchecked, your profile will be hidden from client searches
                  </p>
                </div>
              </label>
            </div>

            {/* Payment Settings - NEW */}
            <div className="mt-6">
              <PaymentSettings 
                initialData={paymentInfo}
                onUpdate={fetchProfile}
              />
            </div>
          </div>
        </div>

        {/* Actions - Enhanced */}
        <div className="mt-6 bg-white rounded-2xl border-2 border-gray-100 p-5 flex justify-start gap-3">
          <button
            type="button"
            onClick={fetchProfile}
            className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving || formData.specialization_ids.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-200/50"
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
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                Success!
              </h3>

              {/* Message */}
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
                {successMessage}
              </p>

              {/* Close Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Confirmation Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelAvailabilityChange}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-fadeIn">
            {/* Icon */}
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              pendingAvailability ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {pendingAvailability ? (
                <BadgeCheck className="w-8 h-8 text-green-600" />
              ) : (
                <Clock className="w-8 h-8 text-orange-600" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              {pendingAvailability ? 'Go Available?' : 'Go Unavailable?'}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-600 text-center mb-6">
              {pendingAvailability 
                ? 'Your profile will be visible to clients searching for lawyers. You may receive new appointment requests.'
                : 'Your profile will be hidden from client searches. Existing appointments will not be affected.'}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelAvailabilityChange}
                disabled={savingAvailability}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAvailabilityChange}
                disabled={savingAvailability}
                className={`flex-1 px-4 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  pendingAvailability 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {savingAvailability ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerProfile;
