// src/components/LawyerCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Lawyer } from '../types/lawyer';

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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 h-full flex flex-col">
      {/* Header with Avatar and Name */}
      <div className="flex items-start space-x-4 mb-3">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt={lawyerName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initial if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-bold text-white">${lawyerName.charAt(0).toUpperCase()}</span>`;
              }}
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {lawyerName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 truncate">{lawyerName}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {specs.map((spec) => (
              <span
                key={spec.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {spec.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      {lawyer.bio && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{lawyer.bio}</p>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Experience</p>
          <p className="text-sm font-semibold text-gray-900">
            {experience} {experience === 1 ? 'year' : 'years'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Rate</p>
          <p className="text-sm font-semibold text-gray-900">₱{rate.toLocaleString()}</p>
        </div>
      </div>

      {/* Location */}
      {(lawyer.user?.city || lawyer.office_address) && (
        <div className="flex items-start space-x-2 mb-4 text-sm text-gray-600">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
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
          <span className="flex-1">
            {lawyer.user?.city
              ? `${lawyer.user.city}, ${lawyer.user.province}`
              : lawyer.office_address
            }
          </span>
          {lawyer.distance !== undefined && (
            <span className="font-semibold text-blue-600 whitespace-nowrap">
              • {lawyer.distance.toFixed(1)} km
            </span>
          )}
        </div>
      )}

      {/* Actions - pushed to bottom */}
      <div className="mt-auto">
        <Link
          to={`/lawyers/${lawyer.id}`}
          className="block w-full px-4 py-2.5 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition text-sm font-medium"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default LawyerCard;