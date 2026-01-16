import React from 'react';
import { XCircle, Mail, Phone, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VerificationRejected = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const verificationNotes = user?.lawyer?.verification_notes || 'Your verification was rejected. Please contact support for more information.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Verification Rejected
        </h1>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          We're sorry, but your lawyer verification application was not approved.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Reason for Rejection
              </h3>
              <p className="text-xs text-gray-700">
                {verificationNotes}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">What can you do?</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold text-xs">1</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-700">
                  <strong>Review the rejection reason</strong> carefully and address any issues mentioned.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold text-xs">2</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-700">
                  <strong>Contact our support team</strong> if you have questions or need clarification about the rejection.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold text-xs">3</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-700">
                  <strong>Resubmit your application</strong> with corrected documents and information if applicable.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-700">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <a href="mailto:support@legalkonect.com" className="text-blue-600 hover:text-blue-700">
                support@legalkonect.com
              </a>
            </div>
            <div className="flex items-center text-xs text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <a href="tel:+639123456789" className="text-blue-600 hover:text-blue-700">
                +63 912 345 6789
              </a>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationRejected;
