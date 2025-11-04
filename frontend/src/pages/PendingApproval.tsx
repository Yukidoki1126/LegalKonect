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
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Application Under Review
        </h1>
        
        <p className="text-lg text-gray-600 text-center mb-8">
          Thank you for registering as a legal professional with LegalKonect!
        </p>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-yellow-600 mt-1" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Profile Status: Pending
              </h3>
              <p className="text-gray-700 mb-4">
                Our admin team is currently reviewing your lawyer registration. This process typically takes 1-3 business days.
              </p>
              <p className="text-gray-700">
                You will receive an email notification at your registered email address once your account has been approved.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-700">
                  <strong>Verification:</strong> Our team verifies your license number and professional credentials
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-700">
                  <strong>Review:</strong> Your profile information and specializations are reviewed
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-700">
                  <strong>Approval:</strong> Once approved, you'll get full access to your lawyer dashboard
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-gray-700">support@legalkonect.com</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-gray-700">+63 912 345 6789</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Logout
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;