// src/components/LawyerCard.tsx - REDESIGNED
// Professional, minimal card design - clean borders, no heavy shadows
import React from 'react';
import { Link } from 'react-router-dom';
import { Lawyer } from '../types/lawyer';
import { MapPin, Briefcase, Star, Shield, Clock } from 'lucide-react';

interface LawyerCardProps {
  lawyer: Lawyer;
}

const LawyerCard: React.FC<LawyerCardProps> = ({ lawyer }) => {
  // Handle both old and new data structures
  const lawyerName = lawyer.user?.name || `${lawyer.first_name || ''} ${lawyer.last_name || ''}`.trim();
  const experience = lawyer.years_experience || lawyer.experience_years || 0;
  const rate = lawyer.consultation_fee || lawyer.hourly_rate || 0;
  const specs = lawyer.specializations || [];

  // Get profile photo URL
  const getProfilePhotoUrl = () => {
    if (!lawyer.profile_photo) return null;
    if (lawyer.profile_photo.startsWith('http')) return lawyer.profile_photo;
    return `http://localhost:8000/storage/${lawyer.profile_photo}`;
  };

  const profilePhotoUrl = getProfilePhotoUrl();

  return (
    <div className="group bg-white border border-gray-200/80 rounded-2xl p-6 h-full flex flex-col hover:shadow-card-hover hover:border-gray-300/80 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      {/* Subtle gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-300 pointer-events-none"></div>
      
      {/* Availability Badge */}
      <div className="absolute top-4 right-4 z-10">
        {lawyer.is_available ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            Available
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            Unavailable
          </div>
        )}
      </div>

      {/* Profile Photo and Name */}
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="relative">
          <div className="w-16 h-16 rounded-xl border-2 border-gray-100 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 shadow-sm group-hover:border-blue-200 transition-colors">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={lawyerName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center"><span class="text-2xl font-bold text-blue-600">${lawyerName.charAt(0).toUpperCase()}</span></div>`;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {lawyerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {/* Verified checkmark */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <Shield className="w-3 h-3 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate mb-1 group-hover:text-blue-700 transition-colors">{lawyerName}</h3>
          {/* Specializations */}
          <div className="flex flex-wrap gap-1.5">
            {specs.slice(0, 2).map((spec) => (
              <span
                key={spec.id}
                className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs font-medium rounded-full border border-gray-200"
              >
                {spec.name}
              </span>
            ))}
            {specs.length > 2 && (
              <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
                +{specs.length - 2} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Info - Clean Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100 relative z-10">
        <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Experience</p>
            <p className="text-sm font-bold text-gray-900">
              {experience} {experience === 1 ? 'year' : 'years'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-green-600">₱</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rate/hour</p>
            <p className="text-sm font-bold text-gray-900">₱{rate.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Location */}
      {(lawyer.user?.city || lawyer.office_address) && (
        <div className="flex items-start gap-2 mb-4 text-sm text-gray-600 relative z-10">
          <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <span className="flex-1 line-clamp-2">
            {lawyer.user?.city
              ? `${lawyer.user.city}, ${lawyer.user.province}`
              : lawyer.office_address
            }
          </span>
          {lawyer.distance !== undefined && (
            <span className="font-bold text-blue-600 whitespace-nowrap ml-2 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
              {lawyer.distance.toFixed(1)} km
            </span>
          )}
        </div>
      )}

      {/* Rating Stars */}
      <div className="flex items-center gap-2 mb-5 relative z-10">
        <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(Number(lawyer.rating) || 0)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 fill-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-bold text-gray-900">
          {lawyer.rating ? Number(lawyer.rating).toFixed(1) : '0.0'}
        </span>
        <span className="text-sm text-gray-500">
          ({lawyer.total_reviews || 0} {(lawyer.total_reviews || 0) === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {/* View Profile Button - Professional */}
      <div className="mt-auto relative z-10">
        <Link
          to={`/lawyers/${lawyer.id}`}
          className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold shadow-md hover:shadow-lg group-hover:shadow-button"
        >
          <span className="flex items-center justify-center gap-2">
            View Profile
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
};

export default LawyerCard;
