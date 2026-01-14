import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo - Responsive */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                LegalKonect
              </span>
            </Link>
          </div>

          {/* Navigation Links - Responsive */}
          <div className="flex items-center gap-2 sm:gap-6">
            <Link 
              to="/" 
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 hover:text-blue-600 font-medium transition-all hover:bg-blue-50 rounded-lg whitespace-nowrap"
            >
              Find Lawyers
            </Link>
            <Link 
              to="/login" 
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 hover:text-blue-600 font-medium transition-all hover:bg-blue-50 rounded-lg"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;