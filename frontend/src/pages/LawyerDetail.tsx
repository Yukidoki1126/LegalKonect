// src/pages/LawyerDetail.tsx - REDESIGNED
// Professional, minimal design - no gradients, consistent spacing, clean layout
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Phone, Mail, ChevronLeft, Calendar, Shield } from 'lucide-react';
import api from '../services/api';
import BookingModal from '../components/BookingModal';
import { STORAGE_URL } from '../config/api.config';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    name: string;
  };
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface Lawyer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  bio: string;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

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

    const fetchReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const response = await api.get(`/lawyers/${id}/reviews`);
        setReviews(response.data.reviews || []);
        setReviewStats(response.data.stats || null);
      } catch (err: any) {
        console.error('Failed to load reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchLawyer();
    fetchReviews();
  }, [id]);

  const handleGetDirections = () => {
    let destinationParam = '';
    if (lawyer?.office_latitude && lawyer?.office_longitude) {
      destinationParam = `${lawyer.office_latitude},${lawyer.office_longitude}`;
    } else if (lawyer?.office_address) {
      destinationParam = encodeURIComponent(lawyer.office_address);
    }

    if (!destinationParam) return;

    if (user?.latitude && user?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${user.latitude},${user.longitude}&destination=${destinationParam}`;
      window.open(url, '_blank');
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destinationParam}`;
            window.open(url, '_blank');
          },
          (error) => {
            console.warn('Could not get current location:', error);
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;
            window.open(url, '_blank');
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000,
          }
        );
      } else {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;
        window.open(url, '_blank');
      }
    }
  };

  const handleBookAppointment = () => {
    setIsBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading lawyer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center pt-16">
        <div className="text-center bg-white rounded-2xl p-10 shadow-soft border border-gray-100 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error || 'Lawyer not found'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-button hover:shadow-button-hover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${lawyer.first_name} ${lawyer.last_name}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-16 animate-fadeIn">
      {/* Clean Top Bar - Transparent to blend with background */}
      <div className="border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Search
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lawyer Header - Clean & Professional */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-soft overflow-hidden relative">
              <div className="flex items-start gap-6">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl overflow-hidden border-2 border-white shadow-lg ring-4 ring-blue-50">
                    {(lawyer.profile_photo_url || lawyer.profile_photo) ? (
                      <img
                        src={
                          lawyer.profile_photo_url ||
                          (lawyer.profile_photo?.startsWith('http')
                            ? lawyer.profile_photo
                            : `${STORAGE_URL}/storage/${lawyer.profile_photo}`)
                        }
                        alt={fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600"><span class="text-4xl font-bold text-white">${lawyer.first_name.charAt(0).toUpperCase()}</span></div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                        <span className="text-4xl font-bold text-white">
                          {lawyer.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lawyer Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{fullName}</h1>

                  {/* Specializations - Modern Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lawyer.specializations.map((spec) => (
                      <span
                        key={spec.id}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>

                  {/* Key Stats - Minimal */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>License: <span className="font-semibold text-gray-800">{lawyer.license_number}</span></span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span><span className="font-semibold text-gray-800">{lawyer.years_experience}</span> years experience</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-soft">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                About
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{lawyer.bio}</p>
            </div>

            {/* Reviews - Cleaner Design */}
            {reviewStats && reviewStats.total_reviews > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    Client Reviews
                  </h2>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 rounded-xl border border-amber-200">
                    <span className="text-2xl font-bold text-gray-900">
                      {reviewStats.average_rating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(reviewStats.average_rating)
                              ? 'text-amber-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">({reviewStats.total_reviews} reviews)</span>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div
                      key={review.id}
                      className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 hover:bg-gray-50/50 -mx-4 px-4 py-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.user.name}</p>
                          <div className="flex mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating ? 'text-amber-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Clean & Functional */}
          <div className="space-y-6">
            {/* Pricing Card - Simple */}
            <div className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-100 rounded-2xl p-6 shadow-soft relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Consultation Fee</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                <span className="text-xl">₱</span>{parseFloat(lawyer.hourly_rate.toString()).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">per hour</p>
            </div>

            {/* Contact Info - Clean List */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                Contact Information
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{lawyer.office_address}</span>
                </div>
                {lawyer.office_phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{lawyer.office_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Mail className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700">{lawyer.user.email}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Professional */}
            <div className="space-y-3">
              <button
                onClick={handleBookAppointment}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-button hover:shadow-button-hover hover:-translate-y-0.5"
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </button>
              <button
                onClick={handleGetDirections}
                className="w-full px-6 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300"
              >
                <MapPin className="w-5 h-5" />
                Get Directions
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
