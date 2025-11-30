// src/components/Navigation.tsx - REDESIGNED
// Professional, minimal design - clean white background, simple borders
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
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

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Clean and Professional */}
          <Link
            to="/"
            className="flex items-center space-x-3 group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">LK</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900">
                LegalKonect
              </span>
              <span className="text-sm text-gray-500 -mt-1">Legal Solutions</span>
            </div>
          </Link>

          {/* Desktop Navigation Links - Clean Icons */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {/* Quick Action Icons - Minimal Style */}
                {!isLawyer && (
                  <>
                    {/* Find Lawyers */}
                    <Link
                      to="/lawyers"
                      className={`
                        p-2.5 rounded-md transition-colors relative group
                        ${location.pathname === '/lawyers'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                      title="Find Lawyers"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {/* Tooltip - Simple */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Find Lawyers
                      </div>
                    </Link>

                    {/* My Appointments */}
                    <Link
                      to="/appointments"
                      className={`
                        p-2.5 rounded-md transition-colors relative group
                        ${location.pathname === '/appointments'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                      title="My Appointments"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        My Appointments
                      </div>
                    </Link>

                    {/* My Cases */}
                    <Link
                      to="/cases"
                      className={`
                        p-2.5 rounded-md transition-colors relative group
                        ${location.pathname === '/cases'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                      title="My Cases"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        My Cases
                      </div>
                    </Link>
                  </>
                )}

                {/* User Dropdown - Clean */}
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {isLawyer ? 'Lawyer' : 'Client'}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-md border border-gray-200 overflow-hidden bg-blue-50">
                      {getProfilePictureUrl() ? (
                        <img
                          src={getProfilePictureUrl()!}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-blue-50 flex items-center justify-center"><span class="text-blue-600 font-semibold text-sm">${user.name.charAt(0).toUpperCase()}</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-3 h-3 text-gray-600 transition-transform ${
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

                  {/* Dropdown Menu - Clean */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 py-1 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            isLawyer
                              ? isApprovedLawyer
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
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
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile Settings
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                  className="px-4 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition-colors text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button - Clean */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
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

        {/* Mobile Menu - Clean */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* User Info - Clean */}
                  <div className="px-3 py-3 border-b border-gray-200 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-md border border-gray-200 overflow-hidden bg-blue-50">
                        {getProfilePictureUrl() ? (
                          <img
                            src={getProfilePictureUrl()!}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-blue-50 flex items-center justify-center"><span class="text-blue-600 font-semibold text-base">${user.name.charAt(0).toUpperCase()}</span></div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-base">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium mt-1 ${
                          isLawyer
                            ? isApprovedLawyer
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {isLawyer
                            ? isApprovedLawyer ? 'Verified Lawyer' : 'Pending Approval'
                            : 'Client'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Quick Actions - Clean */}
                  {!isLawyer && (
                    <>
                      {/* Find Lawyers */}
                      <Link
                        to="/lawyers"
                        onClick={() => setShowMobileMenu(false)}
                        className={`
                          flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium
                          transition-colors mx-2
                          ${location.pathname === '/lawyers'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find Lawyers
                      </Link>

                      {/* My Appointments */}
                      <Link
                        to="/appointments"
                        onClick={() => setShowMobileMenu(false)}
                        className={`
                          flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium
                          transition-colors mx-2
                          ${location.pathname === '/appointments'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        My Appointments
                      </Link>

                      {/* My Cases */}
                      <Link
                        to="/cases"
                        onClick={() => setShowMobileMenu(false)}
                        className={`
                          flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium
                          transition-colors mx-2
                          ${location.pathname === '/cases'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        My Cases
                      </Link>
                    </>
                  )}

                  {/* Profile Link */}
                  {!isLawyer && (
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors mx-2"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mx-2"
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
                    className="block px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors mx-2 text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2.5 rounded-md text-sm font-medium bg-blue-600 text-white text-center hover:bg-blue-700 mx-2"
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
