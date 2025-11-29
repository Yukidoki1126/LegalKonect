// src/pages/LawyerSearch.tsx - REDESIGNED
// Professional, minimal design - clean layout, no gradients, consistent spacing
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLawyers } from '../context/LawyersContext';
import LawyerCard from '../components/LawyerCard';
import api from '../services/api';
import { Lawyer, Specialization } from '../types/lawyer';
import { Search, AlertCircle } from 'lucide-react';

// Skeleton Loading Component - Redesigned
const LawyerCardSkeleton: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-100 rounded w-20"></div>
          <div className="h-5 bg-gray-100 rounded w-24"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
      <div>
        <div className="h-3 bg-gray-100 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
      <div>
        <div className="h-3 bg-gray-100 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-100 rounded w-full mb-4"></div>
    <div className="h-10 bg-gray-200 rounded"></div>
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
  const [sortBy, setSortBy] = useState('rating');

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

  // Calculate weighted score for a lawyer based on multiple factors
  const calculateWeightedScore = (lawyer: Lawyer): number => {
    // Define maximum values for normalization
    const MAX_DISTANCE = 50; // km
    const MAX_EXPERIENCE = 30; // years
    const MAX_REVIEWS = 100; // review count
    const MAX_PRICE = 5000; // pesos per hour

    // Check if user has location - if yes, prioritize distance more
    const hasUserLocation = user?.latitude && user?.longitude;

    // 1. Distance Score (0-100)
    // Closer lawyers score higher
    const distanceScore = lawyer.distance !== undefined
      ? Math.max(0, ((MAX_DISTANCE - lawyer.distance) / MAX_DISTANCE) * 100)
      : 50; // Neutral score if no distance available

    // 2. Rating Score (0-100)
    // Higher rating scores higher
    const rating = lawyer.rating || 0;
    const ratingScore = (rating / 5.0) * 100;

    // 3. Experience Score (0-100)
    // More experience scores higher
    const experience = lawyer.years_experience || 0;
    const experienceScore = Math.min(100, (experience / MAX_EXPERIENCE) * 100);

    // 4. Review Count Score (0-100)
    // More reviews = more credibility
    const reviewCount = lawyer.total_reviews || 0;
    const reviewScore = Math.min(100, (reviewCount / MAX_REVIEWS) * 100);

    // 5. Availability Score (0-100)
    // Available lawyers get a boost
    const availabilityScore = lawyer.is_available ? 100 : 0;

    // 6. Price Score (0-100)
    // Lower price scores higher
    const price = lawyer.consultation_fee || lawyer.hourly_rate || 0;
    const priceScore = Math.max(0, ((MAX_PRICE - price) / MAX_PRICE) * 100);

    // Adaptive weights based on user location availability
    let totalScore;

    if (hasUserLocation && lawyer.distance !== undefined) {
      // User has location: Prioritize distance heavily (40%), then quality (30%), experience (15%)
      totalScore =
        (distanceScore * 0.40) +    // 40% - Distance is very important
        (ratingScore * 0.30) +       // 30% - Quality matters
        (experienceScore * 0.15) +   // 15% - Experience
        (reviewScore * 0.08) +       // 8%  - Review count
        (availabilityScore * 0.05) + // 5%  - Availability
        (priceScore * 0.02);         // 2%  - Price (least important)
    } else {
      // No user location: Focus on quality (40%), experience (25%), reviews (15%)
      totalScore =
        (ratingScore * 0.40) +       // 40% - Rating most important
        (experienceScore * 0.25) +   // 25% - Experience
        (reviewScore * 0.15) +       // 15% - Review count
        (distanceScore * 0.10) +     // 10% - Distance (if available)
        (availabilityScore * 0.05) + // 5%  - Availability
        (priceScore * 0.05);         // 5%  - Price
    }

    return totalScore;
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
              console.log(`📍 ${lawyer.first_name} ${lawyer.last_name}: ${distance.toFixed(2)} km from user`);
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
          console.log(`👤 User location: ${user.latitude}, ${user.longitude}`);
          lawyersData = lawyersData.map((lawyer: Lawyer) => {
            if (lawyer.office_latitude && lawyer.office_longitude) {
              const distance = calculateDistance(
                user.latitude!,
                user.longitude!,
                parseFloat(lawyer.office_latitude),
                parseFloat(lawyer.office_longitude)
              );
              console.log(`📍 ${lawyer.first_name} ${lawyer.last_name} (${lawyer.office_latitude}, ${lawyer.office_longitude}): ${distance.toFixed(2)} km from user`);
              return { ...lawyer, distance };
            }
            console.log(`⚠️ ${lawyer.first_name} ${lawyer.last_name}: No coordinates`);
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
      // Distance: Nearest first
      if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }

      // Price: Lowest first
      if (sortBy === 'price') {
        const priceA = a.consultation_fee || a.hourly_rate || 0;
        const priceB = b.consultation_fee || b.hourly_rate || 0;
        return priceA - priceB;
      }

      // Experience: Most experienced first
      if (sortBy === 'experience') {
        const expA = a.years_experience || a.experience_years || 0;
        const expB = b.years_experience || b.experience_years || 0;
        return expB - expA;
      }

      // Rating: Highest rated first
      if (sortBy === 'rating') {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      }

      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
        {/* Header - Clean and Professional */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Find a Lawyer</h1>
          <p className="text-sm text-gray-600">
            Connect with experienced legal professionals
          </p>
        </div>

        {/* Location Warning - Clean Design */}
        {!user?.latitude && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  Set your location to see distances
                </p>
                <p className="text-sm text-yellow-800">
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

        {/* Search and Filters - Professional Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search by name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lawyers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Specialization Filter */}
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <select
                id="specialization"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="rating">Rating (highest first)</option>
                <option value="distance">Distance (nearest first)</option>
                <option value="price">Price (lowest first)</option>
                <option value="experience">Experience (most first)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedSpecialization) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200">
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200">
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
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <LawyerCardSkeleton key={skeleton} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-900 mb-1">Error loading lawyers</h3>
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lawyers found</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
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
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600 font-medium">
                Showing{' '}
                <span className="text-blue-600 font-semibold">{filteredLawyers.length}</span>{' '}
                {filteredLawyers.length === 1 ? 'lawyer' : 'lawyers'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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