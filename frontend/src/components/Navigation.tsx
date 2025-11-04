// src/components/Navigation.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Get lawyer status directly from user context - no async needed!
  const isLawyer = !!user?.lawyer;
  const isApprovedLawyer = user?.lawyer?.status === 'approved';

  const handleLogout = () => {
    logout();
  };

  const handleDashboardClick = () => {
    if (isApprovedLawyer) {
      navigate('/lawyer/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="LegalKonect" className="h-10 sm:h-12" />
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
            >
              {showMobileMenu ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Only show Dashboard for approved lawyers or regular users */}
                {!isLawyer || isApprovedLawyer ? (
                  <button
                    onClick={handleDashboardClick}
                    className="hover:bg-blue-700 px-3 py-2 rounded-md transition"
                  >
                    Dashboard
                  </button>
                ) : null}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded-md transition"
                  >
                    <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center overflow-hidden">
                      {(user.profile_picture || user.lawyer?.profile_photo) ? (
                        <img
                          src={
                            user.profile_picture
                              ? (user.profile_picture.startsWith('http')
                                  ? user.profile_picture
                                  : `http://localhost:8000/storage/${user.profile_picture}`)
                              : user.lawyer?.profile_photo?.startsWith('http')
                                ? user.lawyer.profile_photo
                                : `http://localhost:8000/storage/${user.lawyer?.profile_photo}`
                          }
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block">{user.name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-700">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>

                      {!isLawyer && (
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          Profile Settings
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:bg-blue-700 px-4 py-2 rounded-md transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md font-semibold transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-blue-500">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-blue-500 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center overflow-hidden">
                        {(user.profile_picture || user.lawyer?.profile_photo) ? (
                          <img
                            src={
                              user.profile_picture
                                ? (user.profile_picture.startsWith('http')
                                    ? user.profile_picture
                                    : `http://localhost:8000/storage/${user.profile_picture}`)
                                : user.lawyer?.profile_photo?.startsWith('http')
                                  ? user.lawyer.profile_photo
                                  : `http://localhost:8000/storage/${user.lawyer?.profile_photo}`
                            }
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-blue-200 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Link */}
                  {(!isLawyer || isApprovedLawyer) && (
                    <button
                      onClick={() => {
                        handleDashboardClick();
                        setShowMobileMenu(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                    >
                      Dashboard
                    </button>
                  )}

                  {/* Profile Link (for non-lawyers) */}
                  {!isLawyer && (
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                    >
                      Profile Settings
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-blue-700 hover:text-red-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Sign Up
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