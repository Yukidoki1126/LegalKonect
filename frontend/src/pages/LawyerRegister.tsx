import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Scale, MapPin, Phone, Mail, Lock, User, FileText, Clock, DollarSign, Award, Upload, CheckCircle, XCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface Specialization {
  id: number;
  name: string;
  description?: string;
}

const LawyerRegister = () => {
  const [step, setStep] = useState(1);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    first_name: '',
    last_name: '',
    bio: '',
    license_number: '',
    years_experience: '',
    hourly_rate: '',
    specialization_ids: [] as number[],
    office_address: '',
    office_phone: '',
    office_latitude: null as string | null,
    office_longitude: null as string | null,
    ibp_number: '',
    roll_of_attorneys_number: '',
    prc_license_number: '',
  });

  const [documents, setDocuments] = useState<{
    ibp_card: File | null;
    government_id: File | null;
    prc_license: File | null;
    good_standing_cert: File | null;
  }>({
    ibp_card: null,
    government_id: null,
    prc_license: null,
    good_standing_cert: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSpecializations();
  }, []);

  // Scroll to error banner when errors occur
  useEffect(() => {
    if (errorBanner && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorBanner]);

 const fetchSpecializations = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/specializations');
    const data = await response.json();
    // Fix: Handle the response structure
    setSpecializations(data.specializations || data || []);
  } catch (error) {
    console.error('Error fetching specializations:', error);
    setSpecializations([]); // Set empty array on error
  }
};

  // Helper function to determine which step an error belongs to
  const getStepForError = (errorKey: string): number => {
    const step1Fields = ['email', 'password', 'password_confirmation', 'phone'];
    const step2Fields = ['first_name', 'last_name', 'bio'];
    const step3Fields = ['license_number', 'years_experience', 'hourly_rate', 'specializations'];
    const step4Fields = ['office_address', 'office_phone'];
    const step5Fields = ['ibp_number', 'ibp_card', 'government_id', 'prc_license', 'good_standing_cert', 'roll_of_attorneys_number', 'prc_license_number'];

    if (step1Fields.includes(errorKey)) return 1;
    if (step2Fields.includes(errorKey)) return 2;
    if (step3Fields.includes(errorKey)) return 3;
    if (step4Fields.includes(errorKey)) return 4;
    if (step5Fields.includes(errorKey)) return 5;
    return 1; // Default to step 1
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSpecializationToggle = (id: number) => {
    setFormData(prev => ({
      ...prev,
      specialization_ids: prev.specialization_ids.includes(id)
        ? prev.specialization_ids.filter(sid => sid !== id)
        : [...prev.specialization_ids, id]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: keyof typeof documents) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [docType]: 'File size must be less than 20MB. Please compress or resize your image.' }));
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, [docType]: 'Only JPG, PNG, and PDF files are allowed' }));
        return;
      }
      setDocuments(prev => ({ ...prev, [docType]: file }));
      // Clear error if exists
      if (errors[docType]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[docType];
          return newErrors;
        });
      }
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Passwords do not match';
      }
      if (!formData.phone) newErrors.phone = 'Phone number is required';
    }

    if (currentStep === 2) {
      if (!formData.first_name) newErrors.first_name = 'First name is required';
      if (!formData.last_name) newErrors.last_name = 'Last name is required';
      if (!formData.bio) newErrors.bio = 'Bio is required';
      if (formData.bio.length < 50) newErrors.bio = 'Bio must be at least 50 characters';
    }

    if (currentStep === 3) {
      if (!formData.license_number) newErrors.license_number = 'License number is required';
      if (!formData.years_experience) newErrors.years_experience = 'Years of experience is required';
      if (!formData.hourly_rate) newErrors.hourly_rate = 'Hourly rate is required';
      if (formData.specialization_ids.length === 0) {
        newErrors.specializations = 'Please select at least one specialization';
      }
    }

    if (currentStep === 4) {
      if (!formData.office_address) newErrors.office_address = 'Office address is required';
      // office_phone is optional
    }

    if (currentStep === 5) {
      if (!formData.ibp_number) newErrors.ibp_number = 'IBP number is required';
      if (!documents.ibp_card) newErrors.ibp_card = 'IBP card is required';
      if (!documents.government_id) newErrors.government_id = 'Government ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      return;
    }

    setLoading(true);
    setErrors({});
    setErrorBanner(null);

    try {
      // First, try to register the user account
      const userResponse = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.first_name} ${formData.last_name}`,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          phone: formData.phone
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.log('User registration error:', errorData);

        // Handle validation errors for user registration
        if (errorData.errors) {
          const validationErrors: Record<string, string> = {};
          Object.keys(errorData.errors).forEach(key => {
            validationErrors[key] = Array.isArray(errorData.errors[key])
              ? errorData.errors[key][0]
              : errorData.errors[key];
          });
          setErrors(validationErrors);

          // Navigate to the step with the error
          const firstErrorKey = Object.keys(validationErrors)[0];
          const errorStep = getStepForError(firstErrorKey);
          setStep(errorStep);

          // Set error banner
          if (validationErrors.email?.includes('already')) {
            setErrorBanner('This email is already registered. Please use a different email or login instead.');
          } else {
            setErrorBanner(`Account registration failed: ${validationErrors[firstErrorKey]}`);
          }

          return; // Don't throw, just return to show errors
        }

        throw new Error(errorData.message || 'User registration failed');
      }

      const userData = await userResponse.json();
      const token = userData.token;
      const userId = userData.user?.id;
      console.log('User registered successfully, creating lawyer profile...');

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('license_number', formData.license_number);
      formDataToSend.append('years_experience', formData.years_experience);
      formDataToSend.append('hourly_rate', formData.hourly_rate);
      formDataToSend.append('office_address', formData.office_address);
      formDataToSend.append('office_phone', formData.office_phone);
      if (formData.office_latitude) formDataToSend.append('office_latitude', formData.office_latitude);
      if (formData.office_longitude) formDataToSend.append('office_longitude', formData.office_longitude);

      // Add specializations
      formData.specialization_ids.forEach(id => {
        formDataToSend.append('specialization_ids[]', id.toString());
      });

      // Add verification credentials
      formDataToSend.append('ibp_number', formData.ibp_number);
      if (formData.roll_of_attorneys_number) {
        formDataToSend.append('roll_of_attorneys_number', formData.roll_of_attorneys_number);
      }
      if (formData.prc_license_number) {
        formDataToSend.append('prc_license_number', formData.prc_license_number);
      }

      // Add documents
      if (documents.ibp_card) {
        console.log('Adding ibp_card:', documents.ibp_card.name, documents.ibp_card.type);
        formDataToSend.append('ibp_card', documents.ibp_card);
      }
      if (documents.government_id) {
        console.log('Adding government_id:', documents.government_id.name, documents.government_id.type);
        formDataToSend.append('government_id', documents.government_id);
      }
      if (documents.prc_license) {
        console.log('Adding prc_license:', documents.prc_license.name, documents.prc_license.type);
        formDataToSend.append('prc_license', documents.prc_license);
      }
      if (documents.good_standing_cert) {
        console.log('Adding good_standing_cert:', documents.good_standing_cert.name, documents.good_standing_cert.type);
        formDataToSend.append('good_standing_cert', documents.good_standing_cert);
      }

      // Log all FormData entries
      console.log('FormData contents:');
      formDataToSend.forEach((value, key) => {
        if (value instanceof File) {
          console.log(key, '=', value.name, '(', value.size, 'bytes)');
        } else {
          console.log(key, '=', value);
        }
      });

      const lawyerResponse = await fetch('http://localhost:8000/api/lawyer/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Do NOT set Content-Type header - browser will set it with boundary for multipart/form-data
        },
        body: formDataToSend
      });

      if (!lawyerResponse.ok) {
        const errorData = await lawyerResponse.json();
        console.log('Full error response:', errorData);

        // CRITICAL: Lawyer profile creation failed, but user account was created
        // We need to clean up the orphaned user account to prevent database inconsistency
        console.error('Lawyer profile creation failed. Attempting to cleanup orphaned user account...');

        try {
          // Delete the orphaned user account using cleanup endpoint
          const cleanupResponse = await fetch('http://localhost:8000/api/auth/cleanup', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (cleanupResponse.ok) {
            console.log('✅ Orphaned user account cleaned up successfully - you can try again with the same email');
          } else {
            console.error('⚠️ Failed to cleanup orphaned user account - email may be locked');
          }
        } catch (cleanupError) {
          console.error('❌ Cleanup request failed:', cleanupError);
          // Continue with error handling even if cleanup fails
        }

        // Handle Laravel validation errors
        if (errorData.errors) {
          const validationErrors: Record<string, string> = {};
          Object.keys(errorData.errors).forEach(key => {
            validationErrors[key] = Array.isArray(errorData.errors[key])
              ? errorData.errors[key][0]
              : errorData.errors[key];
          });
          console.log('Parsed validation errors:', validationErrors);
          setErrors(validationErrors);

          // Navigate to the step with the first error
          const firstErrorKey = Object.keys(validationErrors)[0];
          const errorStep = getStepForError(firstErrorKey);
          setStep(errorStep);

          // Set error banner with specific message
          const errorMessage = validationErrors[firstErrorKey];
          if (firstErrorKey === 'license_number' && errorMessage.includes('already')) {
            setErrorBanner('⚠️ This license number is already registered in our system. Please verify your license number or contact support if you believe this is an error.');
          } else if (firstErrorKey === 'ibp_number' && errorMessage.includes('already')) {
            setErrorBanner('⚠️ This IBP number is already registered in our system. Please verify your IBP number or contact support if you believe this is an error.');
          } else {
            const fieldName = firstErrorKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            setErrorBanner(`⚠️ ${fieldName}: ${errorMessage}`);
          }

          return; // Don't throw, just return to show errors
        }

        throw new Error(errorData.message || 'Lawyer profile creation failed');
      }

      setSuccess(true);

    } catch (error: any) {
      setErrorBanner(`❌ Registration failed: ${error.message || 'Please try again.'}`);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your lawyer account has been created successfully. Your credentials and documents are now being reviewed by our admin team.
            You will receive an email notification once your account is verified and approved.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="LegalKonect" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join LegalKonect</h1>
          <p className="text-gray-600 mt-2">Register as a legal professional and connect with clients</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {num}
                </div>
                {num < 5 && (
                  <div className={`flex-1 h-1 mx-1 ${
                    step > num ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            {['Account', 'Personal', 'Professional', 'Office', 'Verification'].map((label, index) => (
              <div key={index} className="flex-1 flex items-center">
                <span className={`${index === 0 ? 'text-left' : index === 4 ? 'text-right' : 'text-center'} ${index < 4 ? 'flex-1' : ''}`}>
                  {label}
                </span>
                {index < 4 && <div className="flex-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div
            ref={errorBannerRef}
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-md animate-pulse"
          >
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-900 font-bold text-lg mb-1">Registration Error</h3>
                <p className="text-red-800 text-sm leading-relaxed">{errorBanner}</p>
                <button
                  onClick={() => setErrorBanner(null)}
                  className="mt-3 text-red-700 hover:text-red-900 text-sm font-medium underline"
                >
                  Dismiss
                </button>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-red-400 hover:text-red-600 ml-4"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Must contain: uppercase, lowercase, number, and special character (@$!%*#?&)
                </p>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+63 912 345 6789"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Juan"
                    />
                  </div>
                  {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dela Cruz"
                  />
                  {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Bio
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell clients about your experience, expertise, and what makes you unique... (minimum 50 characters)"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">{formData.bio.length} / 50 characters minimum</p>
                {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bar License Number
                </label>
                <div className="relative">
                  <Award className={`absolute left-3 top-3 w-5 h-5 ${errors.license_number ? 'text-red-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      errors.license_number
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., PH-LAW-2024-018"
                  />
                </div>
                {errors.license_number && (
                  <div className="mt-2 flex items-start">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-1 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">{errors.license_number}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="years_experience"
                      value={formData.years_experience}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                      min="0"
                    />
                  </div>
                  {errors.years_experience && <p className="mt-1 text-sm text-red-600">{errors.years_experience}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (₱)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2000"
                      min="0"
                      step="100"
                    />
                  </div>
                  {errors.hourly_rate && <p className="mt-1 text-sm text-red-600">{errors.hourly_rate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Areas of Specialization
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {specializations.map((spec) => (
                    <label
                      key={spec.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        formData.specialization_ids.includes(spec.id)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.specialization_ids.includes(spec.id)}
                        onChange={() => handleSpecializationToggle(spec.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">{spec.name}</span>
                    </label>
                  ))}
                </div>
                {errors.specializations && <p className="mt-2 text-sm text-red-600">{errors.specializations}</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Office Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="office_address"
                    value={formData.office_address}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main St, Cagayan de Oro City"
                  />
                </div>
                {errors.office_address && <p className="mt-1 text-sm text-red-600">{errors.office_address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="office_phone"
                    value={formData.office_phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+63 88 123 4567"
                  />
                </div>
                {errors.office_phone && <p className="mt-1 text-sm text-red-600">{errors.office_phone}</p>}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Documents</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Required:</strong> Please provide your IBP credentials and upload verification documents.
                  All documents will be securely reviewed by our admin team.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBP Number *
                </label>
                <div className="relative">
                  <Award className={`absolute left-3 top-3 w-5 h-5 ${errors.ibp_number ? 'text-red-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    name="ibp_number"
                    value={formData.ibp_number}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      errors.ibp_number
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., 1234567"
                  />
                </div>
                {errors.ibp_number && (
                  <div className="mt-2 flex items-start">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-1 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">{errors.ibp_number}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll of Attorneys Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="roll_of_attorneys_number"
                    value={formData.roll_of_attorneys_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRC License Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="prc_license_number"
                    value={formData.prc_license_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1234567"
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>

                {/* IBP Card */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBP Card * (Front and Back)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
                    <input
                      type="file"
                      id="ibp_card"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(e, 'ibp_card')}
                      className="hidden"
                    />
                    <label
                      htmlFor="ibp_card"
                      className="flex items-center justify-center cursor-pointer"
                    >
                      {documents.ibp_card ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{documents.ibp_card.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Click to upload (JPG, PNG, PDF - Max 20MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.ibp_card && <p className="mt-1 text-sm text-red-600">{errors.ibp_card}</p>}
                </div>

                {/* Government ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Government ID *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
                    <input
                      type="file"
                      id="government_id"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(e, 'government_id')}
                      className="hidden"
                    />
                    <label
                      htmlFor="government_id"
                      className="flex items-center justify-center cursor-pointer"
                    >
                      {documents.government_id ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{documents.government_id.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Click to upload (JPG, PNG, PDF - Max 20MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.government_id && <p className="mt-1 text-sm text-red-600">{errors.government_id}</p>}
                </div>

                {/* PRC License (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRC License (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
                    <input
                      type="file"
                      id="prc_license"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(e, 'prc_license')}
                      className="hidden"
                    />
                    <label
                      htmlFor="prc_license"
                      className="flex items-center justify-center cursor-pointer"
                    >
                      {documents.prc_license ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{documents.prc_license.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Click to upload (JPG, PNG, PDF - Max 20MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.prc_license && <p className="mt-1 text-sm text-red-600">{errors.prc_license}</p>}
                </div>

                {/* Certificate of Good Standing (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate of Good Standing (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
                    <input
                      type="file"
                      id="good_standing_cert"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(e, 'good_standing_cert')}
                      className="hidden"
                    />
                    <label
                      htmlFor="good_standing_cert"
                      className="flex items-center justify-center cursor-pointer"
                    >
                      {documents.good_standing_cert ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{documents.good_standing_cert.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Click to upload (JPG, PNG, PDF - Max 20MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.good_standing_cert && <p className="mt-1 text-sm text-red-600">{errors.good_standing_cert}</p>}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Privacy Notice:</strong> Your documents are stored securely and will only be viewed by authorized administrators for verification purposes.
                </p>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
            )}
            
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LawyerRegister