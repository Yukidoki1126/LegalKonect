// src/pages/legal/TermsOfService.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-50/30 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600">Last Updated: November 24, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-3">
              Welcome to LegalKonect ("Platform", "Service", "we", "us", or "our"). By accessing or using our platform,
              you agree to be bound by these Terms of Service ("Terms").
            </p>
            <p className="text-gray-700">
              LegalKonect is an online platform that connects clients seeking legal services with qualified lawyers.
              We facilitate the connection but do not provide legal services ourselves.
            </p>
          </section>

          {/* 2. Definitions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>"Client"</strong> - Any individual or entity seeking legal services through our platform</li>
              <li><strong>"Lawyer"</strong> - Licensed legal professional providing services through our platform</li>
              <li><strong>"Consultation"</strong> - Legal advice session between Client and Lawyer</li>
              <li><strong>"Platform"</strong> - LegalKonect website and all associated services</li>
              <li><strong>"User"</strong> - Any person using our platform (Clients and Lawyers)</li>
            </ul>
          </section>

          {/* 3. Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility</h2>
            <p className="text-gray-700 mb-3">To use LegalKonect, you must:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>For Lawyers: Hold a valid license to practice law in the Philippines</li>
            </ul>
          </section>

          {/* 4. Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Registration</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>4.1 Account Creation</strong></p>
              <p>You must create an account to use most features of our platform. You agree to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Provide truthful, accurate, and current information</li>
                <li>Maintain and update your information as necessary</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <p className="pt-3"><strong>4.2 Lawyer Verification</strong></p>
              <p>Lawyers must submit verification documents including:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Valid Philippine Bar license</li>
                <li>Professional identification</li>
                <li>Proof of good standing with the Philippine Bar Association</li>
              </ul>
            </div>
          </section>

          {/* 5. Platform Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Platform Services</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>5.1 Services Provided</strong></p>
              <p>LegalKonect provides:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Connection between Clients and Lawyers</li>
                <li>Appointment scheduling system</li>
                <li>Secure payment processing</li>
                <li>Communication facilitation</li>
                <li>Review and rating system</li>
              </ul>

              <p className="pt-3"><strong>5.2 Not Legal Service Provider</strong></p>
              <p>
                LegalKonect is NOT a law firm and does NOT provide legal advice or services.
                All legal services are provided directly by independent lawyers.
              </p>
            </div>
          </section>

          {/* 6. Booking and Payments */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Booking and Payments</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>6.1 Consultation Fees</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Lawyers set their own consultation fees</li>
                <li>Fees are clearly displayed before booking</li>
                <li>All fees are in Philippine Pesos (₱)</li>
                <li>Platform commission: 15% of consultation fee</li>
              </ul>

              <p className="pt-3"><strong>6.2 Payment Processing</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Payments are processed through PayMongo (secure third-party processor)</li>
                <li>Payment is required at time of booking</li>
                <li>Funds are held until consultation is completed</li>
                <li>Accepted payment methods: Credit/Debit cards, GCash, GrabPay</li>
              </ul>

              <p className="pt-3"><strong>6.3 Refund Policy</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cancellations 24+ hours before: Full refund minus processing fee (3%)</li>
                <li>Cancellations 12-24 hours before: 50% refund</li>
                <li>Cancellations less than 12 hours: No refund</li>
                <li>Lawyer cancellations: Full refund to client</li>
              </ul>
            </div>
          </section>

          {/* 7. User Conduct */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Conduct</h2>
            <div className="space-y-3 text-gray-700">
              <p>Users agree NOT to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post false or misleading information</li>
                <li>Attempt to bypass platform fees</li>
                <li>Share login credentials with others</li>
                <li>Use automated systems (bots, scrapers) without permission</li>
                <li>Interfere with platform operation or security</li>
              </ul>
            </div>
          </section>

          {/* 8. Lawyer Obligations */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Lawyer Obligations</h2>
            <div className="space-y-3 text-gray-700">
              <p>Lawyers using our platform must:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Maintain valid Philippine Bar license</li>
                <li>Comply with Philippine Bar Association Code of Professional Responsibility</li>
                <li>Provide professional and ethical legal services</li>
                <li>Honor scheduled appointments or provide adequate notice</li>
                <li>Maintain client confidentiality</li>
                <li>Respond to client inquiries within 24 hours</li>
                <li>Accurately represent qualifications and experience</li>
              </ul>
            </div>
          </section>

          {/* 9. Client Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Client Responsibilities</h2>
            <div className="space-y-3 text-gray-700">
              <p>Clients agree to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Provide accurate information about their legal matter</li>
                <li>Attend scheduled consultations on time</li>
                <li>Pay all fees promptly</li>
                <li>Follow lawyer's professional advice at their own discretion</li>
                <li>Respect lawyer's professional judgment</li>
                <li>Provide honest reviews based on actual experience</li>
              </ul>
            </div>
          </section>

          {/* 10. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Intellectual Property</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                All platform content (design, code, logos, text) is owned by LegalKonect or our licensors
                and protected by intellectual property laws.
              </p>
              <p>You may not:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Copy, modify, or distribute platform content</li>
                <li>Use our trademarks without permission</li>
                <li>Create derivative works from our platform</li>
                <li>Reverse engineer our technology</li>
              </ul>
            </div>
          </section>

          {/* 11. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
            <div className="space-y-3 text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p><strong>IMPORTANT DISCLAIMER:</strong></p>
              <p>
                LegalKonect is a platform service ONLY. We are NOT responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Quality of legal services provided by lawyers</li>
                <li>Accuracy of legal advice given</li>
                <li>Outcomes of legal matters</li>
                <li>Lawyer-client disputes</li>
                <li>Missed appointments or scheduling conflicts</li>
                <li>Third-party payment processor errors</li>
              </ul>
              <p className="pt-2">
                Our maximum liability is limited to the fees paid for the specific transaction in question.
              </p>
            </div>
          </section>

          {/* 12. Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Dispute Resolution</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>12.1 Between Users</strong></p>
              <p>
                Disputes between Clients and Lawyers should be resolved directly. We may provide
                mediation assistance but are not obligated to do so.
              </p>

              <p className="pt-3"><strong>12.2 With LegalKonect</strong></p>
              <p>
                Any disputes with LegalKonect will be governed by Philippine law and subject to
                the jurisdiction of courts in the Philippines.
              </p>
            </div>
          </section>

          {/* 13. Account Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Account Termination</h2>
            <div className="space-y-3 text-gray-700">
              <p>We reserve the right to suspend or terminate accounts for:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Violation of these Terms</li>
                <li>Fraudulent activity</li>
                <li>Abusive behavior toward other users</li>
                <li>Extended period of inactivity</li>
                <li>Non-payment of fees</li>
                <li>For lawyers: Loss of license or professional misconduct</li>
              </ul>
            </div>
          </section>

          {/* 14. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. We will notify users of significant changes
              via email or platform notification. Continued use of the platform after changes constitutes
              acceptance of new terms.
            </p>
          </section>

          {/* 15. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-700">
              <p className="mb-2">For questions about these Terms, contact us at:</p>
              <ul className="space-y-1">
                <li><strong>Email:</strong> legal@legalkonect.com</li>
                <li><strong>Phone:</strong> +63 (2) 1234-5678</li>
                <li><strong>Address:</strong> [Your Business Address]</li>
              </ul>
            </div>
          </section>

          {/* Acceptance */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mt-8">
            <p className="text-gray-900 font-semibold mb-2">Acceptance of Terms</p>
            <p className="text-gray-700">
              By creating an account or using LegalKonect, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
