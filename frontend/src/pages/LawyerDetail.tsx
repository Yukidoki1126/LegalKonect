// src/pages/LawyerDetail.tsx - REDESIGNED
// Professional, minimal design - no gradients, consistent spacing, clean layout
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Phone, Mail, ChevronLeft, Calendar, Shield } from 'lucide-react';
import api from '../services/api';
import BookingModal from '../components/BookingModal';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Lawyer not found'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${lawyer.first_name} ${lawyer.last_name}`;

  return (
    <div className="min-h-screen bg-blue-50/30 pt-16">
      {/* Clean Top Bar - Transparent to blend with background */}
      <div className="border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Search
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lawyer Header - Clean & Professional */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex items-start gap-6">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
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
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-blue-50"><span class="text-3xl font-bold text-blue-600">${lawyer.first_name.charAt(0).toUpperCase()}</span></div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        <span className="text-3xl font-bold text-blue-600">
                          {lawyer.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lawyer Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>

                  {/* Specializations - Simple Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lawyer.specializations.map((spec) => (
                      <span
                        key={spec.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>

                  {/* Key Stats - Minimal */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>License: {lawyer.license_number}</span>
                    </div>
                    <div>{lawyer.years_experience} years experience</div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{lawyer.bio}</p>
            </div>

            {/* Reviews - Cleaner Design */}
            {reviewStats && reviewStats.total_reviews > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Client Reviews</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {reviewStats.average_rating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(reviewStats.average_rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">({reviewStats.total_reviews} reviews)</span>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div
                      key={review.id}
                      className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.user.name}</p>
                          <div className="flex mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Consultation Fee</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                ₱{parseFloat(lawyer.hourly_rate.toString()).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">per hour</p>
            </div>

            {/* Contact Info - Clean List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{lawyer.office_address}</span>
                </div>
                {lawyer.office_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{lawyer.office_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{lawyer.user.email}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Professional */}
            <div className="space-y-3">
              <button
                onClick={handleBookAppointment}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </button>
              <button
                onClick={handleGetDirections}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
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
