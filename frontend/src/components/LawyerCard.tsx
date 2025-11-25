// src/components/LawyerCard.tsx - REDESIGNED
// Professional, minimal card design - clean borders, no heavy shadows
import React from 'react';
import { Link } from 'react-router-dom';
import { Lawyer } from '../types/lawyer';
import { MapPin, Briefcase } from 'lucide-react';

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
    <div className="bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col hover:shadow-sm transition-shadow">
      {/* Profile Photo and Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-blue-50 flex-shrink-0">
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt={lawyerName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full bg-blue-50 flex items-center justify-center"><span class="text-2xl font-bold text-blue-600">${lawyerName.charAt(0).toUpperCase()}</span></div>`;
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

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">{lawyerName}</h3>
          {/* Specializations */}
          <div className="flex flex-wrap gap-1.5">
            {specs.slice(0, 2).map((spec) => (
              <span
                key={spec.id}
                className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded"
              >
                {spec.name}
              </span>
            ))}
            {specs.length > 2 && (
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                +{specs.length - 2} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Info - Clean Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600">Experience</p>
            <p className="text-sm font-semibold text-gray-900">
              {experience} {experience === 1 ? 'year' : 'years'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 text-gray-400 flex-shrink-0 flex items-center justify-center text-sm">₱</span>
          <div>
            <p className="text-xs text-gray-600">Rate/hour</p>
            <p className="text-sm font-semibold text-gray-900">₱{rate.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Location */}
      {(lawyer.user?.city || lawyer.office_address) && (
        <div className="flex items-start gap-2 mb-4 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="flex-1 line-clamp-2">
            {lawyer.user?.city
              ? `${lawyer.user.city}, ${lawyer.user.province}`
              : lawyer.office_address
            }
          </span>
          {lawyer.distance !== undefined && (
            <span className="font-semibold text-blue-600 whitespace-nowrap ml-2">
              {lawyer.distance.toFixed(1)} km
            </span>
          )}
        </div>
      )}

      {/* View Profile Button - Professional */}
      <div className="mt-auto">
        <Link
          to={`/lawyers/${lawyer.id}`}
          className="block w-full px-4 py-2.5 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default LawyerCard;
