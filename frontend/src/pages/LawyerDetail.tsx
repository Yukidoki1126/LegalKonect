// src/pages/LawyerDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BookingModal from '../components/BookingModal';

interface Lawyer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  bio: string;
  profile_photo?: string | null;
  experience_years: number;
  hourly_rate: number;
  office_address: string;
  office_phone: string;
  office_latitude?: string;
  office_longitude?: string;
  license_number: string;
  years_experience: string;
  is_approved: boolean;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  specializations: Array<{
    id: number;
    name: string;
  }>;
}

const LawyerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchLawyer = async () => {
      if (!id) return;

      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/lawyers/${id}`);
        const lawyerData = response.data.lawyer || response.data;
        setLawyer(lawyerData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load lawyer details');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyer();
  }, [id]);

  const handleGetDirections = () => {
    // Build the destination part of the URL
    let destinationParam = '';
    if (lawyer?.office_latitude && lawyer?.office_longitude) {
      destinationParam = `${lawyer.office_latitude},${lawyer.office_longitude}`;
    } else if (lawyer?.office_address) {
      destinationParam = encodeURIComponent(lawyer.office_address);
    }

    if (!destinationParam) return;

    // Check if user has saved location to use as starting point
    if (user?.latitude && user?.longitude) {
      // User has a saved location - use it as origin
      const url = `https://www.google.com/maps/dir/?api=1&origin=${user.latitude},${user.longitude}&destination=${destinationParam}`;
      window.open(url, '_blank');
    } else {
      // No saved location - try to get current location in real-time
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Got current position - use it as origin
            const { latitude, longitude } = position.coords;
            const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destinationParam}`;
            window.open(url, '_blank');
          },
          (error) => {
            // Failed to get location - open without origin (Google Maps will handle it)
            console.warn('Could not get current location:', error);
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;
            window.open(url, '_blank');
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000, // Accept location from last 60 seconds
          }
        );
      } else {
        // Geolocation not supported - open without origin
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;
        window.open(url, '_blank');
      }
    }
  };

  const handleBookAppointment = () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/lawyers/${id}` } });
      return;
    }
    setIsBookingModalOpen(true);
  };

  const getFullName = () => {
    if (!lawyer) return '';
    return `${lawyer.first_name} ${lawyer.last_name}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lawyer details...</p>
        </div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'Lawyer not found'}</p>
            <Link to="/lawyers" className="text-blue-600 hover:underline mt-2 inline-block">
              ← Back to search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fullName = getFullName();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/lawyers"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to search
        </Link>

        {/* Main Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {lawyer.profile_photo ? (
                  <img
                    src={
                      lawyer.profile_photo.startsWith('http')
                        ? lawyer.profile_photo
                        : `http://localhost:8000/storage/${lawyer.profile_photo}`
                    }
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initial if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl font-bold text-blue-600">${lawyer.first_name.charAt(0).toUpperCase()}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-4xl font-bold text-blue-600">
                    {lawyer.first_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
                <div className="flex flex-wrap gap-2 mb-3">
                  {lawyer.specializations.map((spec) => (
                    <span
                      key={spec.id}
                      className="px-3 py-1 bg-blue-500 bg-opacity-50 rounded-full text-sm"
                    >
                      {spec.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span>📋 License: {lawyer.license_number}</span>
                  <span>💼 {lawyer.years_experience} years experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* About Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed">{lawyer.bio}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Consultation Fee */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₱{parseFloat(lawyer.hourly_rate.toString()).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Years of Experience</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {lawyer.years_experience} years
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Office Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Office Information</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5"
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
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-600">{lawyer.office_address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-gray-600">{lawyer.office_phone}</p>
                  </div>
                </div>

                {lawyer.user.email && (
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{lawyer.user.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGetDirections}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2"
              >
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <span>Get Directions</span>
              </button>

              <button 
                onClick={handleBookAppointment}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2"
              >
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Book Appointment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {lawyer && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          lawyer={lawyer}
        />
      )}
    </div>
  );
};

export default LawyerDetail;