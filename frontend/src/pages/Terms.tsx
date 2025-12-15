// src/pages/Terms.tsx - Terms and Conditions page
import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/legalkonect-logo.png" 
                alt="LegalKonect Logo" 
                className="w-10 h-10 rounded-lg shadow-sm"
              />
              <span className="text-xl font-bold text-gray-900">LegalKonect</span>
            </Link>
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: 25 Nov 2025</p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using LegalKonect ("Services"), you agree to these Terms, our Privacy Policy, and any additional agreements. If you are using the Services on behalf of an organization, you confirm you have authority to bind it. Do not use the Services if you disagree with any part of these Terms.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Account Registration</h2>
              <p className="text-gray-700 leading-relaxed">
                You must provide accurate, current information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of unauthorized access.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. License and Access</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We grant a limited, revocable, non-exclusive, non-transferable license to access and use the Services. You must not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Copy, modify, or reverse engineer the platform</li>
                <li>Attempt to bypass security features</li>
                <li>Use the Services for unlawful, harmful, or misleading purposes</li>
                <li>Upload malware, malicious scripts, or overload the system</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Content</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You retain ownership of your uploaded documents, messages, case information, and other materials ("User Content").
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                You grant us a worldwide, royalty-free license to store, process, and transmit User Content solely for operating the Services.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">You warrant that:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You have the right to submit the content</li>
                <li>Your submissions comply with law and confidentiality obligations</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Service Features</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may enhance, modify, or discontinue functionalities such as:
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                Matching algorithms, scheduling tools, notifications, messaging, document uploads, and analytics.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Certain features may require paid plans or third-party accounts.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Fees and Payment</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Subscription or usage fees are billed according to your chosen plan. Payments are non-refundable unless required by law.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                Non-payment may result in account suspension.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for applicable taxes.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Confidentiality</h2>
              <p className="text-gray-700 leading-relaxed">
                Each party agrees to keep the other party's confidential information secure and to use it only for fulfilling these Terms. This obligation excludes information that is public, independently developed, or lawfully obtained from a third party.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The Services may integrate with external platforms (e.g., cloud storage, messaging, payment services).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Your use of these integrations is governed by their own terms. We are not responsible for third-party content or actions.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                All software, trademarks, logos, and content provided by LegalKonect remain the property of the Company or its licensors.
              </p>
              <p className="text-gray-700 leading-relaxed">
                No rights are granted beyond the limited license stated in Section 3.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You may terminate your account at any time.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may suspend or terminate access for violations, security risks, or unpaid fees.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">Upon termination:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Your access to the Services ends</li>
                <li>We may retain or delete your data after the applicable retention period</li>
                <li>Outstanding payments remain due</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Disclaimers</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The Services are provided "as is" and "as available," without warranties of any kind, including fitness for a particular purpose, merchantability, accuracy, or non-infringement.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We do not guarantee uninterrupted availability or error-free operation.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                To the maximum extent permitted by law, LegalKonect and its affiliates are not liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business</li>
                <li>Damages exceeding the fees paid during the previous 12-month period</li>
              </ul>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to defend and indemnify LegalKonect from claims arising out of your use of the Services, User Content, or violation of these Terms.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                These Terms are governed by the laws of Republic of the Philippines.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Disputes must first be resolved through good-faith negotiation. If unresolved, they will be submitted to the courts or arbitration located in Republic of the Philippines, unless prohibited by law.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may revise these Terms. Notice may be provided through email or in-app notifications. Continued use of the Services means you accept the updated Terms.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Miscellaneous</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                These Terms, together with the Privacy Policy and any order forms, constitute the entire agreement between you and LegalKonect.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                If any part of these Terms is unenforceable, the rest remains in effect.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                You may not assign your rights without our consent. We may assign our rights as part of a merger, reorganization, or sale.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Official notices will be sent to the contact information associated with your account.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
              <p className="text-gray-700">
                Email: <a href="mailto:support@legalkonect.com" className="text-blue-600 hover:text-blue-700 font-medium">support@legalkonect.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
