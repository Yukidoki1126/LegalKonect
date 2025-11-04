// src/pages/LawyerSearch.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLawyers } from '../context/LawyersContext';
import LawyerCard from '../components/LawyerCard';
import api from '../services/api';
import { Lawyer, Specialization } from '../types/lawyer';

// Skeleton Loading Component
const LawyerCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-300 rounded w-12"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
      <div className="h-10 bg-gray-300 rounded-lg"></div>
    </div>
  </div>
);

const LawyerSearch: React.FC = () => {
  const { user } = useAuth();
  
  // Get cache from context
  const { 
    lawyers: cachedLawyers, 
    specializations: cachedSpecializations,
    setLawyers: setCachedLawyers,
    setSpecializations: setCachedSpecializations,
    isCached 
  } = useLawyers();

  // Local state
  const [lawyers, setLawyers] = useState<Lawyer[]>(cachedLawyers);
  const [specializations, setSpecializations] = useState<Specialization[]>(cachedSpecializations);
  const [loading, setLoading] = useState(!isCached);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch lawyers and specializations with caching
  useEffect(() => {
    const fetchData = async () => {
      // Check if we have cached data
      if (isCached && cachedLawyers.length > 0) {
        console.log('✅ Using cached lawyers data');
        
        // Just recalculate distances if needed
        let lawyersData = cachedLawyers;
        
        if (user?.latitude && user?.longitude) {
          lawyersData = cachedLawyers.map((lawyer: Lawyer) => {
            if (lawyer.office_latitude && lawyer.office_longitude) {
              const distance = calculateDistance(
                user.latitude!,
                user.longitude!,
                parseFloat(lawyer.office_latitude),
                parseFloat(lawyer.office_longitude)
              );
              return { ...lawyer, distance };
            }
            return lawyer;
          });
        }
        
        setLawyers(lawyersData);
        setSpecializations(cachedSpecializations);
        setLoading(false);
        return; // Exit - don't fetch from API
      }

      // No cache - fetch from API
      console.log('📡 Fetching lawyers from API...');
      setLoading(true);
      setError('');

      try {
        // Fetch both in parallel
        const [lawyersResponse, specsResponse] = await Promise.all([
          api.get('/lawyers'),
          api.get('/specializations')
        ]);

        // Process lawyers
        let lawyersData = lawyersResponse.data.lawyers || lawyersResponse.data;

        // Calculate distance if user has location
        if (user?.latitude && user?.longitude) {
          lawyersData = lawyersData.map((lawyer: Lawyer) => {
            if (lawyer.office_latitude && lawyer.office_longitude) {
              const distance = calculateDistance(
                user.latitude!,
                user.longitude!,
                parseFloat(lawyer.office_latitude),
                parseFloat(lawyer.office_longitude)
              );
              return { ...lawyer, distance };
            }
            return lawyer;
          });
        }

        // Update both local and cached state
        setLawyers(lawyersData);
        setCachedLawyers(lawyersData);

        // Process specializations
        const specsData = specsResponse.data.specializations || specsResponse.data;
        const specsArray = Array.isArray(specsData) ? specsData : [];
        
        setSpecializations(specsArray);
        setCachedSpecializations(specsArray);
        
        console.log('✅ Data fetched and cached');
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load lawyers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.latitude, user?.longitude]); // Only re-run if user location changes

  // Filter and sort lawyers
  const filteredLawyers = (lawyers || [])
    .filter((lawyer) => {
      // Handle both old and new data structure
      const lawyerName = lawyer.user?.name || `${lawyer.first_name || ''} ${lawyer.last_name || ''}`.trim();

      const matchesSearch = lawyerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesSpecialization =
        !selectedSpecialization ||
        (lawyer.specializations || []).some(
          (spec) => spec.id === parseInt(selectedSpecialization)
        );

      return matchesSearch && matchesSpecialization;
    })
    .sort((a, b) => {
      if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (sortBy === 'price') {
        const priceA = a.consultation_fee || a.hourly_rate || 0;
        const priceB = b.consultation_fee || b.hourly_rate || 0;
        return priceA - priceB;
      }
      if (sortBy === 'experience') {
        const expA = a.years_experience || a.experience_years || 0;
        const expB = b.years_experience || b.experience_years || 0;
        return expB - expA;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Find a Lawyer</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Connect with experienced legal professionals near you
          </p>
        </div>

        {/* Location Warning */}
        {!user?.latitude && (
          <div className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-yellow-800">
                  Set your location to see distances
                </p>
                <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                  Go to{' '}
                  <a href="/profile" className="underline font-semibold hover:text-yellow-900">
                    Profile Settings
                  </a>{' '}
                  to add your location.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Search by name
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lawyers..."
                  className="w-full px-3 py-2 pl-9 sm:pl-10 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-2.5 sm:left-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Specialization Filter */}
            <div>
              <label
                htmlFor="specialization"
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >
                Specialization
              </label>
              <select
                id="specialization"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label htmlFor="sortBy" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="distance">Distance (nearest first)</option>
                <option value="price">Price (lowest first)</option>
                <option value="experience">Experience (most first)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedSpecialization) && (
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
              <span className="text-xs sm:text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-blue-900"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedSpecialization && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full">
                  {specializations.find(s => s.id === parseInt(selectedSpecialization))?.name}
                  <button
                    onClick={() => setSelectedSpecialization('')}
                    className="hover:text-blue-900"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialization('');
                }}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="h-4 sm:h-5 bg-gray-300 rounded w-24 sm:w-32 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <LawyerCardSkeleton key={skeleton} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 sm:p-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-red-800">Error loading lawyers</h3>
                <p className="mt-1 text-xs sm:text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-xs sm:text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900">No lawyers found</h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 px-4">
              {searchQuery || selectedSpecialization
                ? 'Try adjusting your search or filters.'
                : 'No lawyers are currently available.'}
            </p>
            {(searchQuery || selectedSpecialization) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialization('');
                }}
                className="mt-4 px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Showing{' '}
                <span className="text-blue-600 font-bold">{filteredLawyers.length}</span>{' '}
                {filteredLawyers.length === 1 ? 'lawyer' : 'lawyers'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredLawyers.map((lawyer, index) => (
                <div
                  key={lawyer.id}
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                  }}
                >
                  <LawyerCard lawyer={lawyer} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LawyerSearch;