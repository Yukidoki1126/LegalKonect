import React from 'react';
import { Clock, CheckCircle, Mail, Phone } from 'lucide-react';

const PendingApproval = () => {
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Application Under Review
        </h1>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          Thank you for registering as a legal professional with LegalKonect!
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Your Profile Status: Pending Verification
              </h3>
              <p className="text-xs text-gray-700 mb-2">
                Our admin team is currently reviewing your lawyer registration and verifying your submitted documents (IBP Card, Government ID, and credentials). This process typically takes 1-3 business days.
              </p>
              <p className="text-xs text-gray-700">
                You will receive an email notification at your registered email address once your account and credentials have been verified and approved.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">What happens next?</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-xs">1</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-700">
                  <strong>Document Verification:</strong> Our admin team reviews your submitted documents (IBP Card, Government ID, PRC License, etc.)
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-xs">2</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-700">
                  <strong>Credential Verification:</strong> Your IBP number, license number, and professional credentials are verified
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-xs">3</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-700">
                  <strong>Profile Review:</strong> Your profile information and specializations are reviewed for completeness
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-xs">4</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-700">
                  <strong>Approval & Access:</strong> Once verified and approved, you'll get full access to your lawyer dashboard and can start accepting clients
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-xs text-gray-700">support@legalkonect.com</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-xs text-gray-700">+63 912 345 6789</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition"
          >
            Logout
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;