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
  <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse shadow-soft">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/4 mb-2"></div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-100 rounded-full w-20"></div>
          <div className="h-5 bg-gray-100 rounded-full w-24"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="h-3 bg-gray-100 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="h-3 bg-gray-100 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-100 rounded-lg w-full mb-4"></div>
    <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl"></div>
  </div>
);

// Cache configuration
const CACHE_KEY = 'lawyers_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const LawyerSearch: React.FC = () => {
  const { user } = useAuth();
  
  // Get cache from context
  const { 
    lawyers: cachedLawyers, 
    specializations: cachedSpecializations,
    setLawyers: setCachedLawyers,
    setSpecializations: setCachedSpecializations,
    isCached,
    invalidateCache,
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

  // LocalStorage cache helpers
  const getLocalCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      // Check if cache is still valid
      if (age > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      console.log(`✅ Using localStorage cache (${Math.round(age / 1000)}s old)`);
      return data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const setLocalCache = (data: any) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
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
      
      totalScore =
        (distanceScore * 0.40) +    // 40% - Distance is very important
        (ratingScore * 0.30) +       // 30% - Quality matters
        (experienceScore * 0.15) +   // 15% - Experience
        (reviewScore * 0.08) +       // 8%  - Review count
        (availabilityScore * 0.05) + // 5%  - Availability
        (priceScore * 0.02);         // 2%  - Price (least important)
    } else {
      
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
  // Fetch data function (extracted for reuse)
  const fetchData = async (isBackgroundRefresh = false) => {
    // Check localStorage cache first (persists across page refreshes)
    if (!isBackgroundRefresh) {
      const localCache = getLocalCache();
      if (localCache) {
        let lawyersData = localCache.lawyers;
        
        // Recalculate distances if user has location
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
        
        setLawyers(lawyersData);
        setSpecializations(localCache.specializations);
        setCachedLawyers(lawyersData);
        setCachedSpecializations(localCache.specializations);
        setLoading(false);
        return; // Exit - using cached data
      }
    }

    // Check context cache (in-memory)
    if (!isBackgroundRefresh && isCached && cachedLawyers.length > 0) {
      console.log('✅ Using context cached lawyers data');

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

    // Fetch from API
    console.log(isBackgroundRefresh ? '🔄 Auto-refreshing lawyers...' : '📡 Fetching lawyers from API...');
    if (!isBackgroundRefresh) setLoading(true);
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

      // Save to localStorage for persistence across page refreshes
      setLocalCache({
        lawyers: lawyersData,
        specializations: specsArray
      });

      console.log('✅ Data fetched and cached (memory + localStorage)');

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load lawyers');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [user?.latitude, user?.longitude]); // Only re-run if user location changes

  // Refetch immediately if cache is invalidated elsewhere (e.g., after profile/location save)
  useEffect(() => {
    if (!isCached) {
      fetchData(true);
    }
  }, [isCached]);

  // Optional: expose a manual refresh request for other pages via a custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === 'lawyers:refresh') {
        fetchData(true);
      }
    };
    window.addEventListener('lawyers:event', handler as EventListener);
    return () => window.removeEventListener('lawyers:event', handler as EventListener);
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchData(true); // Background refresh (doesn't show loading state)
    }, 60000); // 60 seconds

    // Cleanup on unmount
    return () => clearInterval(refreshInterval);
  }, [user?.latitude, user?.longitude]);

  // Refresh immediately when the tab regains focus or becomes visible
  useEffect(() => {
    const onFocus = () => fetchData(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 animate-fadeIn pt-16">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-6">
        {/* Header - Clean and Professional */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Find a Lawyer</h1>
          </div>
          <p className="text-sm text-gray-600 ml-13">
            Connect with experienced legal professionals
          </p>
        </div>

        {/* Location Warning - Clean Design */}
        {!user?.latitude && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Set your location to see distances
                </p>
                <p className="text-sm text-amber-800">
                  Go to{' '}
                  <a href="/profile" className="underline font-semibold hover:text-amber-900 transition-colors">
                    Profile Settings
                  </a>{' '}
                  to add your location for better recommendations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters - Professional Card */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 mb-8 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Search */}
            <div className="group">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                Search by name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lawyers..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 transition-all duration-200 hover:border-gray-300"
                />
              </div>
            </div>

            {/* Specialization Filter */}
            <div className="group">
              <label htmlFor="specialization" className="block text-sm font-semibold text-gray-700 mb-2">
                Specialization
              </label>
              <select
                id="specialization"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 transition-all duration-200 hover:border-gray-300 bg-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
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
            <div className="group">
              <label htmlFor="sortBy" className="block text-sm font-semibold text-gray-700 mb-2">
                Sort by
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 transition-all duration-200 hover:border-gray-300 bg-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
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
            <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200 shadow-sm">
                  <Search className="w-3.5 h-3.5" />
                  "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-blue-900 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {selectedSpecialization && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200 shadow-sm">
                  {specializations.find(s => s.id === parseInt(selectedSpecialization))?.name}
                  <button
                    onClick={() => setSelectedSpecialization('')}
                    className="ml-1 hover:text-purple-900 hover:bg-purple-100 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialization('');
                }}
                className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-red-900 mb-2">Error loading lawyers</h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-soft">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No lawyers found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery || selectedSpecialization
                ? 'Try adjusting your search criteria or clearing the filters.'
                : 'No lawyers are currently available on the platform.'}
            </p>
            {(searchQuery || selectedSpecialization) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialization('');
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-button hover:shadow-button-hover"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600 font-medium">
                  Showing{' '}
                  <span className="text-lg font-bold text-blue-600">{filteredLawyers.length}</span>{' '}
                  {filteredLawyers.length === 1 ? 'lawyer' : 'lawyers'}
                </p>
                <div className="h-4 w-px bg-gray-300"></div>
                <p className="text-sm text-gray-500">Sorted by {sortBy}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
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