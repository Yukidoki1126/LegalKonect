// src/components/Navigation.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLawyer = !!user?.lawyer;
  const isApprovedLawyer = user?.lawyer?.status === 'approved';

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  const handleDashboardClick = () => {
    if (isApprovedLawyer) {
      navigate('/lawyer/dashboard');
    } else {
      navigate('/dashboard');
    }
    setShowMobileMenu(false);
  };

  const getProfilePictureUrl = () => {
    if (user?.profile_picture) {
      return user.profile_picture.startsWith('http') 
        ? user.profile_picture 
        : `http://localhost:8000/storage/${user.profile_picture}`;
    }
    if (user?.lawyer?.profile_photo) {
      return user.lawyer.profile_photo.startsWith('http')
        ? user.lawyer.profile_photo
        : `http://localhost:8000/storage/${user.lawyer.profile_photo}`;
    }
    return null;
  };

  // Check if current path is dashboard
  const isDashboardActive = location.pathname.includes('dashboard');

  return (
    <nav className="bg-blue-600 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <span className="text-white font-bold text-lg">LK</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">
                LegalKonect
              </span>
              <span className="text-xs text-blue-100 -mt-1">Legal Solutions</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Enhanced Dashboard Button - Cleaner Design */}
                {(!isLawyer || isApprovedLawyer) && (
                  <button
                    onClick={handleDashboardClick}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
                      transition-all duration-200 text-sm
                      ${isDashboardActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-white hover:bg-blue-700'
                      }
                    `}
                  >
                    <svg
                      className={`w-4 h-4 ${isDashboardActive ? 'text-blue-600' : 'text-white'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                      />
                    </svg>
                    <span>Dashboard</span>
                  </button>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-white">
                        {user.name}
                      </span>
                      <span className="text-xs text-blue-100">
                        {isLawyer ? 'Lawyer' : 'Client'}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg border border-blue-400 shadow-sm overflow-hidden bg-blue-800">
                      {getProfilePictureUrl() ? (
                        <img
                          src={getProfilePictureUrl()!}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-800 flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-3 h-3 text-white transition-transform duration-200 ${
                        showDropdown ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-md border border-blue-200 py-1 z-50 animate-in fade-in-0 zoom-in-95">
                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-blue-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="flex items-center mt-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isLawyer 
                              ? isApprovedLawyer
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isLawyer 
                              ? isApprovedLawyer ? 'Verified Lawyer' : 'Pending Approval'
                              : 'Client'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        {!isLawyer && (
                          <Link
                            to="/profile"
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-150"
                            onClick={() => setShowDropdown(false)}
                          >
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile Settings
                          </Link>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg shadow-sm hover:bg-gray-100 transition-all duration-200 text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-blue-700 transition-all duration-200"
          >
            {showMobileMenu ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-blue-500">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="px-3 py-3 border-b border-blue-500 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg border border-blue-400 shadow-sm overflow-hidden bg-blue-800">
                        {getProfilePictureUrl() ? (
                          <img
                            src={getProfilePictureUrl()!}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-800 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-blue-100 truncate">
                          {user.email}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          isLawyer 
                            ? isApprovedLawyer
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isLawyer 
                            ? isApprovedLawyer ? 'Verified Lawyer' : 'Pending Approval'
                            : 'Client'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Mobile Dashboard Link */}
                  {(!isLawyer || isApprovedLawyer) && (
                    <button
                      onClick={handleDashboardClick}
                      className={`
                        flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-colors duration-150 mx-2
                        ${isDashboardActive
                          ? 'bg-white text-blue-700'
                          : 'text-white hover:bg-blue-700'
                        }
                      `}
                    >
                      <svg
                        className={`w-4 h-4 mr-3 ${isDashboardActive ? 'text-blue-600' : 'text-white'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                        />
                      </svg>
                      Dashboard
                    </button>
                  )}

                  {/* Profile Link */}
                  {!isLawyer && (
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-150 mx-2"
                    >
                      <svg className="w-4 h-4 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-blue-700 hover:text-red-200 transition-colors duration-150 mx-2"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-150 mx-2 text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-blue-600 text-center shadow-sm hover:bg-gray-100 mx-2"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;