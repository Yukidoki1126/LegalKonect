import React from 'react';
import { XCircle, Mail, ArrowLeft, FileText } from 'lucide-react';

interface LawyerRejectedProps {
  lawyerName?: string;
  rejectionNotes?: string;
}

const LawyerRejected: React.FC<LawyerRejectedProps> = ({ lawyerName, rejectionNotes }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleGoHome = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Rejected</h1>
            <p className="text-red-100 text-sm">
              Your lawyer account application has been reviewed
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {lawyerName && (
              <p className="text-gray-600 text-center mb-6">
                Dear <span className="font-semibold text-gray-900">{lawyerName}</span>,
              </p>
            )}

            <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Application Status</h3>
                  <p className="text-red-700 text-sm">
                    We regret to inform you that your lawyer verification application has been rejected by our admin team.
                  </p>
                </div>
              </div>
            </div>

            {rejectionNotes && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Reason for Rejection
                </h4>
                <p className="text-gray-600 text-sm">{rejectionNotes}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">What can you do?</h4>
              <ul className="text-blue-700 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  Review the rejection reason and ensure all documents are valid
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  Contact our support team for clarification
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  Re-apply with correct and complete documentation
                </li>
              </ul>
            </div>

            {/* Contact Support */}
            <div className="text-center mb-6">
              <a
                href="mailto:support@legalkonect.com"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact Support: support@legalkonect.com
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Homepage
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © {new Date().getFullYear()} LegalKonect. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LawyerRejected;
