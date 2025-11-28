// src/pages/Privacy.tsx - Privacy Policy page
import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: 25 Nov 2025</p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                LegalKonect ("Company," "we," "our," or "us") provides legal-service matching, case tracking, scheduling, and related tools for clients and legal professionals ("Services"). This Privacy Policy explains how we collect, use, disclose, and protect information when users ("you," "your") access our website, web application, or related digital interfaces.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Account Data</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Name, email, mobile number, address, firm information (for lawyers), specialization, profile image.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Client/Professional Data</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Case details, notes, uploaded documents, messages, appointment records, schedules, complaints, and resolutions entered through the Services.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Location Data</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Voluntarily provided coordinates or location needed for matching and distance calculations.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Usage Data</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Device and browser type, IP address, timestamps, pages visited, interaction logs, crash reports, and diagnostics.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Support Communications</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Support tickets, email inquiries, chat interactions, survey responses, and feedback.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Third-Party Integrations</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Data shared through third-party tools you authorize (e.g., calendars, cloud storage).
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We use collected information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide, operate, and maintain the Services</li>
                <li>Match clients and lawyers using algorithms and geolocation</li>
                <li>Manage appointments, communications, and case tracking</li>
                <li>Secure the platform and detect fraud, misuse, or suspicious activity</li>
                <li>Improve features, run analytics, and develop new functions</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send administrative notices and service updates</li>
                <li>Comply with legal obligations and enforce our rights</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We may share information with:</p>

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Service Providers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Hosting, cloud storage, analytics, communication, and support vendors under confidentiality obligations.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Authorized Users</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Lawyers, clients, or team members you grant access to.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Legal or Regulatory Authorities</h3>
                  <p className="text-gray-700 leading-relaxed">
                    As required by law, subpoena, or to enforce legal rights.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Business Transfers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    In case of merger, acquisition, restructuring, or asset sale, provided personal data remains protected.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4 font-semibold">
                We do not sell personal information.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain information while your account remains active or as needed to operate the Services, comply with legal requirements, or resolve disputes. You may request deletion of certain data, subject to mandatory retention periods.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement administrative, physical, and technical safeguards, including encryption, access controls, monitoring, and secure authentication. While we strive to protect your data, no system is fully secure. Report any suspected incidents to{' '}
                <a href="mailto:privacy@legalkonect.com" className="text-blue-600 hover:text-blue-700 font-medium">privacy@legalkonect.com</a>.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You may:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access, correct, or update your profile information</li>
                <li>Request export or deletion of case data where permitted</li>
                <li>Opt out of marketing communications</li>
                <li>Manage cookie and tracking preferences via your browser</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                For jurisdiction-specific rights, contact us at{' '}
                <a href="mailto:privacy@legalkonect.com" className="text-blue-600 hover:text-blue-700 font-medium">privacy@legalkonect.com</a>.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children</h2>
              <p className="text-gray-700 leading-relaxed">
                The Services are not intended for individuals under 18 years old. We do not knowingly collect information from minors.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your data may be processed in other countries where our providers operate. We use contractual and industry-standard safeguards for such transfers.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may modify this Privacy Policy from time to time. The "Last Updated" date indicates the current version. Continued use of the Services constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
              <p className="text-gray-700">
                Email: <a href="mailto:privacy@legalkonect.com" className="text-blue-600 hover:text-blue-700 font-medium">privacy@legalkonect.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
