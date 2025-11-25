// src/pages/legal/PrivacyPolicy.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600">Last Updated: November 24, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-3">
              LegalKonect ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p className="text-gray-700">
              By using LegalKonect, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold mb-2">2.1 Information You Provide</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                  <li><strong>Profile Information:</strong> Profile picture, bio, location</li>
                  <li><strong>Lawyer-Specific Information:</strong> Bar license number, specializations, experience, education, verification documents</li>
                  <li><strong>Payment Information:</strong> Processed securely through PayMongo (we do not store credit card details)</li>
                  <li><strong>Communication Data:</strong> Messages, consultations, reviews, ratings</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">2.2 Information Collected Automatically</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                  <li><strong>Location Data:</strong> Approximate location based on IP address or GPS (with permission)</li>
                  <li><strong>Cookies and Tracking:</strong> See our Cookie Policy for details</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">2.3 Information from Third Parties</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Google Sign-In:</strong> Name, email, profile picture (if you use Google authentication)</li>
                  <li><strong>Payment Processors:</strong> Transaction data from PayMongo</li>
                  <li><strong>Verification Services:</strong> Philippine Bar Association verification data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use collected information for:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
              <li><strong>Platform Operation:</strong> Creating accounts, facilitating connections between clients and lawyers</li>
              <li><strong>Service Delivery:</strong> Processing bookings, managing consultations, handling payments</li>
              <li><strong>Communication:</strong> Sending appointment confirmations, reminders, updates, support responses</li>
              <li><strong>Verification:</strong> Confirming lawyer credentials and maintaining platform integrity</li>
              <li><strong>Improvement:</strong> Analyzing usage patterns to enhance user experience</li>
              <li><strong>Security:</strong> Detecting fraud, preventing abuse, protecting user accounts</li>
              <li><strong>Legal Compliance:</strong> Meeting regulatory requirements and enforcing our terms</li>
              <li><strong>Marketing:</strong> Sending promotional materials (with your consent, opt-out available)</li>
            </ul>
          </section>

          {/* 4. Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold mb-2">4.1 With Lawyers and Clients</p>
                <p>When you book a consultation:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Clients share: Name, contact information, case details with the lawyer</li>
                  <li>Lawyers share: Profile information, credentials, availability with clients</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">4.2 With Service Providers</p>
                <p>We share data with trusted third parties:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>PayMongo:</strong> Payment processing (PCI-DSS compliant)</li>
                  <li><strong>Google:</strong> Authentication services (Google Sign-In)</li>
                  <li><strong>Cloud Hosting:</strong> Secure data storage and platform hosting</li>
                  <li><strong>Email Services:</strong> Transactional and notification emails</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">4.3 Legal Requirements</p>
                <p>We may disclose information when required by:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Philippine law enforcement or government agencies</li>
                  <li>Court orders or legal processes</li>
                  <li>Protection of our rights, safety, or property</li>
                  <li>Investigation of fraud or security issues</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-semibold mb-2">4.4 We DO NOT:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Sell your personal information to third parties</li>
                  <li>Share your data with advertisers</li>
                  <li>Disclose consultation details publicly</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <div className="space-y-3 text-gray-700">
              <p>We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
                <li><strong>Secure Storage:</strong> Encrypted database storage</li>
                <li><strong>Access Controls:</strong> Restricted employee access to user data</li>
                <li><strong>Payment Security:</strong> PCI-DSS compliant payment processing</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
              </ul>
              <p className="pt-3 text-sm">
                <strong>Note:</strong> While we strive to protect your data, no method of transmission over the internet
                is 100% secure. We cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* 6. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <div className="space-y-3 text-gray-700">
              <p>We retain your information for:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Active Accounts:</strong> As long as your account is active</li>
                <li><strong>Legal Requirements:</strong> Minimum 7 years for financial records (Philippine law)</li>
                <li><strong>Deleted Accounts:</strong> Up to 90 days after deletion for recovery purposes</li>
                <li><strong>Consultation Records:</strong> 10 years for legal and professional liability purposes</li>
              </ul>
              <p className="pt-3">
                After retention periods, we securely delete or anonymize your data.
              </p>
            </div>
          </section>

          {/* 7. Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
            <div className="space-y-3 text-gray-700">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal retention requirements)</li>
                <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
                <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
              </ul>
              <p className="pt-3">
                To exercise these rights, contact us at <strong>privacy@legalkonect.com</strong>
              </p>
            </div>
          </section>

          {/* 8. Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <div className="space-y-3 text-gray-700">
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for platform functionality (authentication, sessions)</li>
                <li><strong>Performance Cookies:</strong> Analyze platform usage and improve performance</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              </ul>
              <p className="pt-3">
                You can control cookies through your browser settings. See our <Link to="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link> for details.
              </p>
            </div>
          </section>

          {/* 9. Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700">
              Our platform may contain links to third-party websites (e.g., lawyer websites, social media).
              We are not responsible for the privacy practices of these sites. We encourage you to review
              their privacy policies before providing any information.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              LegalKonect is not intended for users under 18 years of age. We do not knowingly collect
              information from children. If you believe a child has provided us with personal information,
              please contact us immediately at <strong>privacy@legalkonect.com</strong>.
            </p>
          </section>

          {/* 11. Philippine Data Privacy Act */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Philippine Data Privacy Act Compliance</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                LegalKonect complies with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>
                and regulations issued by the National Privacy Commission (NPC).
              </p>
              <p>Your rights under the DPA include:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Right to be informed about data collection and processing</li>
                <li>Right to access your personal data</li>
                <li>Right to object to processing</li>
                <li>Right to erasure or blocking</li>
                <li>Right to damages for violations</li>
                <li>Right to file a complaint with the NPC</li>
              </ul>
              <p className="pt-3">
                For DPA-related concerns, contact our Data Protection Officer at <strong>dpo@legalkonect.com</strong>
              </p>
            </div>
          </section>

          {/* 12. International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. International Users</h2>
            <p className="text-gray-700">
              LegalKonect operates primarily in the Philippines. If you access our platform from outside
              the Philippines, your information may be transferred to and processed in the Philippines.
              By using our platform, you consent to such transfer and processing.
            </p>
          </section>

          {/* 13. Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy periodically. We will notify you of significant changes via:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700 mt-2">
              <li>Email notification to your registered email address</li>
              <li>Prominent notice on our platform</li>
              <li>Updated "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 14. Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Us</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-700">
              <p className="mb-3">For privacy-related questions or requests, contact us at:</p>
              <ul className="space-y-1">
                <li><strong>Privacy Email:</strong> privacy@legalkonect.com</li>
                <li><strong>Data Protection Officer:</strong> dpo@legalkonect.com</li>
                <li><strong>General Email:</strong> legal@legalkonect.com</li>
                <li><strong>Phone:</strong> +63 (2) 1234-5678</li>
                <li><strong>Address:</strong> [Your Business Address]</li>
              </ul>
              <p className="mt-3 text-sm">
                <strong>National Privacy Commission:</strong> If you have unresolved concerns, you may file
                a complaint with the NPC at <a href="https://www.privacy.gov.ph" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.privacy.gov.ph</a>
              </p>
            </div>
          </section>

          {/* Acceptance */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mt-8">
            <p className="text-gray-900 font-semibold mb-2">Acceptance of Privacy Policy</p>
            <p className="text-gray-700">
              By creating an account or using LegalKonect, you acknowledge that you have read,
              understood, and agree to this Privacy Policy and our data processing practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
