import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/legalkonect-logo.png" 
                alt="LegalKonect Logo" 
                className="w-10 h-10 rounded-xl shadow-md group-hover:shadow-lg transition-all group-hover:scale-105"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                LegalKonect
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            <Link 
              to="/" 
              className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-all hover:bg-blue-50 rounded-lg"
            >
              Find Lawyers
            </Link>
            <Link 
              to="/login" 
              className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-all hover:bg-blue-50 rounded-lg"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
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