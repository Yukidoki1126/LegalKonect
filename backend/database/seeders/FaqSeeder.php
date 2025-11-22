<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FaqCategory;
use App\Models\Faq;

class FaqSeeder extends Seeder
{
    public function run()
    {
        // Create Categories
        $categories = [
            [
                'name' => 'Booking',
                'slug' => 'booking',
                'description' => 'Questions about appointments and bookings',
                'icon' => '📅',
                'order' => 1
            ],
            [
                'name' => 'Payments',
                'slug' => 'payments',
                'description' => 'Payment methods and billing',
                'icon' => '💳',
                'order' => 2
            ],
            [
                'name' => 'For Lawyers',
                'slug' => 'for-lawyers',
                'description' => 'Information for legal professionals',
                'icon' => '⚖️',
                'order' => 3
            ],
            [
                'name' => 'Account',
                'slug' => 'account',
                'description' => 'Account management and profile',
                'icon' => '👤',
                'order' => 4
            ],
            [
                'name' => 'General',
                'slug' => 'general',
                'description' => 'General platform information',
                'icon' => 'ℹ️',
                'order' => 5
            ]
        ];

        foreach ($categories as $categoryData) {
            $category = FaqCategory::create($categoryData);

            // Add FAQs for each category
            $this->seedFaqsForCategory($category);
        }
    }

    private function seedFaqsForCategory($category)
    {
        $faqs = [];

        switch ($category->slug) {
            case 'booking':
                $faqs = [
                    [
                        'question' => 'How do I book an appointment with a lawyer?',
                        'answer' => 'To book an appointment: 1) Click "Find Lawyers" from the navigation menu, 2) Browse lawyers or use filters to find the right lawyer for your needs, 3) Click on a lawyer\'s profile to view their details, 4) Click "Book Appointment", 5) Select your preferred date and available time slot, 6) Choose meeting type (in-person, video call, or phone call), 7) Add any notes about your consultation, 8) Proceed to payment. Once payment is completed, your appointment will be automatically confirmed.',
                        'order' => 1
                    ],
                    [
                        'question' => 'Can I cancel my appointment?',
                        'answer' => 'Yes, you can cancel appointments any time before the appointment date. Go to "My Appointments" in your dashboard, find the appointment you wish to cancel, and click the "Cancel" button. You\'ll need to provide a cancellation reason. Please note: Cancellations on the same day as the appointment may not be eligible for refunds.',
                        'order' => 2
                    ],
                    [
                        'question' => 'What meeting types are available?',
                        'answer' => 'LegalKonect offers three consultation types: In-Person (meet at the lawyer\'s office address), Video Call (online consultation via video conference), and Phone Call (consultation by telephone). You can select your preferred meeting type when booking your appointment.',
                        'order' => 3
                    ],
                    [
                        'question' => 'How far in advance can I book?',
                        'answer' => 'You can book appointments based on the lawyer\'s available schedule. Most lawyers accept bookings up to 30 days in advance. When selecting a date, you\'ll only see time slots that are currently available.',
                        'order' => 4
                    ],
                    [
                        'question' => 'What happens after I book an appointment?',
                        'answer' => 'After booking and payment, your appointment is automatically confirmed (status: Confirmed). You\'ll receive a confirmation email with appointment details. The appointment will appear in your "My Appointments" dashboard where you can view meeting information, add it to your calendar, or cancel if needed.',
                        'order' => 5
                    ],
                    [
                        'question' => 'Can I reschedule my appointment?',
                        'answer' => 'To reschedule an appointment, you need to cancel the existing appointment first and then book a new one with your preferred date and time. Make sure to check the cancellation policy regarding refunds.',
                        'order' => 6
                    ]
                ];
                break;

            case 'payments':
                $faqs = [
                    [
                        'question' => 'What payment methods do you accept?',
                        'answer' => 'We accept Credit/Debit Cards (Visa, Mastercard, American Express), GCash, and PayMaya. All payments are processed securely through PayMongo, our trusted payment gateway partner.',
                        'order' => 1
                    ],
                    [
                        'question' => 'When do I need to pay for my appointment?',
                        'answer' => 'Payment is required immediately after booking to confirm your appointment. Your appointment slot will be held pending payment completion. Once payment is successful, your appointment is automatically confirmed and the lawyer will be notified.',
                        'order' => 2
                    ],
                    [
                        'question' => 'Is my payment information secure?',
                        'answer' => 'Yes! We use PayMongo, a PCI-DSS Level 1 compliant payment gateway. This means your payment information is encrypted and processed with bank-level security. We never store your complete card details on our servers - all sensitive payment data is handled securely by PayMongo.',
                        'order' => 3
                    ],
                    [
                        'question' => 'Can I get a refund if I cancel?',
                        'answer' => 'Refund eligibility depends on when you cancel. If you cancel before the appointment date, you may be eligible for a refund. Same-day cancellations may not be eligible. Refunds are processed within 5-7 business days to your original payment method. If the lawyer cancels, you will receive a full refund automatically.',
                        'order' => 4
                    ],
                    [
                        'question' => 'How much does a consultation cost?',
                        'answer' => 'Consultation fees vary by lawyer and are displayed on each lawyer\'s profile. Fees typically range from ₱500 to ₱3,000 per hour depending on the lawyer\'s experience and specialization. The exact fee will be shown before you complete your booking.',
                        'order' => 5
                    ],
                    [
                        'question' => 'Will I receive a receipt?',
                        'answer' => 'Yes, you will receive a payment receipt via email immediately after successful payment. You can also view and download your payment receipts from your "My Appointments" dashboard.',
                        'order' => 6
                    ]
                ];
                break;

            case 'for-lawyers':
                $faqs = [
                    [
                        'question' => 'How can I register as a lawyer on LegalKonect?',
                        'answer' => 'To register as a lawyer: 1) Click "Are you a lawyer? Join us" on the homepage, 2) Fill out the registration form with your personal information, 3) Provide your bar credentials (IBP number, Roll of Attorneys number, PRC license number), 4) Upload required documents (ID, bar credentials), 5) Set your specializations and hourly rate, 6) Submit your application. Our admin team will review your credentials within 1-3 business days and notify you via email once approved.',
                        'order' => 1
                    ],
                    [
                        'question' => 'How do I set my availability and schedule?',
                        'answer' => 'Once approved, go to your Lawyer Dashboard and navigate to "Schedule Management". You can: 1) Set weekly working hours for each day (Monday-Sunday), 2) Mark specific dates as unavailable, 3) Toggle your availability on/off using the availability switch, 4) Connect your Google Calendar for automatic synchronization. When you set your schedule, these time slots will be available for clients to book.',
                        'order' => 2
                    ],
                    [
                        'question' => 'How do I get paid for appointments?',
                        'answer' => 'When clients book and pay for appointments, 80% of the consultation fee goes to you (20% platform fee). You can track all your earnings in the "Earnings" section of your Lawyer Dashboard. To withdraw funds: 1) Go to Earnings page, 2) Configure your payout method (GCash or Bank Transfer), 3) Request a payout (minimum ₱500), 4) Admin will approve and process your payout, 5) Funds are transferred to your account. Payouts are typically processed within 3-5 business days after approval.',
                        'order' => 3
                    ],
                    [
                        'question' => 'What is the platform fee?',
                        'answer' => 'LegalKonect charges a 20% platform fee on each completed consultation. This means if a client pays ₱1,000 for your consultation, you receive ₱800. The platform fee covers payment processing, platform maintenance, marketing, and customer support.',
                        'order' => 4
                    ],
                    [
                        'question' => 'What documents do I need to provide for verification?',
                        'answer' => 'You need to provide: 1) Valid Government ID, 2) Integrated Bar of the Philippines (IBP) Number, 3) Roll of Attorneys Number, 4) PRC License Number. These credentials are encrypted and stored securely. Our admin team verifies all documents before approving your profile.',
                        'order' => 5
                    ],
                    [
                        'question' => 'Can I connect my Google Calendar?',
                        'answer' => 'Yes! You can connect your Google Calendar in the "Google Calendar" section of your dashboard. This allows you to: 1) Sync confirmed appointments to your Google Calendar automatically, 2) View all your consultations in one place, 3) Get calendar reminders for upcoming appointments. Note: Your availability schedule is still managed through LegalKonect - Google Calendar is used for displaying confirmed appointments only.',
                        'order' => 6
                    ],
                    [
                        'question' => 'How do I update my profile and rates?',
                        'answer' => 'Go to "Profile Settings" in your Lawyer Dashboard. You can update: 1) Personal information (bio, contact details), 2) Office address and location, 3) Hourly consultation rate, 4) Specializations, 5) Profile photo. Changes to your hourly rate will apply to new bookings only - existing appointments keep their original rate.',
                        'order' => 7
                    ]
                ];
                break;

            case 'account':
                $faqs = [
                    [
                        'question' => 'How do I create an account?',
                        'answer' => 'Click "Sign Up" on the homepage, then fill out the registration form with your name, email, password, phone number, and location. After submitting, you\'ll receive a verification email. Verify your email to activate your account and start booking appointments.',
                        'order' => 1
                    ],
                    [
                        'question' => 'How do I update my profile information?',
                        'answer' => 'Log in to your account and go to "Profile Settings" from your dashboard navigation. You can update your name, email, phone number, address, and location. Click "Save Changes" when done. Some changes may require email verification.',
                        'order' => 2
                    ],
                    [
                        'question' => 'How do I change my password?',
                        'answer' => 'Navigate to Profile Settings and find the "Change Password" section. Enter your current password, then your new password twice to confirm. Click "Update Password" to save changes. Make sure your new password is at least 8 characters long.',
                        'order' => 3
                    ],
                    [
                        'question' => 'I forgot my password. How do I reset it?',
                        'answer' => 'On the login page, click "Forgot Password". Enter your registered email address and click "Send Reset Link". Check your email for password reset instructions. Click the link in the email and follow the steps to create a new password. The reset link expires after 1 hour for security.',
                        'order' => 4
                    ],
                    [
                        'question' => 'How do I update my location?',
                        'answer' => 'Your location is used to find nearby lawyers and show distance-based results. To update it, go to Profile Settings and use the location picker. You can: 1) Use the map to select your location, 2) Enter your address manually, 3) Use "Use My Location" to auto-detect. Your location is kept private and only used for search matching.',
                        'order' => 5
                    ],
                    [
                        'question' => 'Can I delete my account?',
                        'answer' => 'To delete your account, please contact our support team at support@legalkonect.com. Note that deleting your account will remove all your data including appointment history, reviews, and profile information. This action cannot be undone.',
                        'order' => 6
                    ]
                ];
                break;

            case 'general':
                $faqs = [
                    [
                        'question' => 'What is LegalKonect?',
                        'answer' => 'LegalKonect is a platform that connects clients with qualified, verified lawyers in the Philippines. We make it easy to find legal professionals based on specialization, location, ratings, and availability. Book consultations online, pay securely, and meet with lawyers in-person, via video call, or by phone.',
                        'order' => 1
                    ],
                    [
                        'question' => 'How does LegalKonect work?',
                        'answer' => 'It\'s simple: 1) Create a free account, 2) Browse lawyers by specialization, location, or search, 3) View lawyer profiles with ratings, reviews, and fees, 4) Select a date and time from available slots, 5) Choose your meeting type (in-person, video, or phone), 6) Pay securely online, 7) Your appointment is confirmed automatically, 8) Meet with your lawyer at the scheduled time. After the consultation, you can leave a review to help other clients.',
                        'order' => 2
                    ],
                    [
                        'question' => 'Is LegalKonect free to use?',
                        'answer' => 'Creating an account and browsing lawyers is completely free. You only pay when you book an appointment, and the fee is set by the lawyer (typically ₱500-₱3,000 per hour). There are no hidden charges - the price you see is the price you pay.',
                        'order' => 3
                    ],
                    [
                        'question' => 'Are the lawyers on LegalKonect verified?',
                        'answer' => 'Yes! All lawyers undergo a strict verification process. Our admin team verifies: 1) Bar license credentials (IBP number, Roll of Attorneys, PRC license), 2) Identity documents, 3) Professional standing. Only verified lawyers can accept appointments on our platform. You can see verification status on each lawyer\'s profile.',
                        'order' => 4
                    ],
                    [
                        'question' => 'How do I find lawyers near me?',
                        'answer' => 'Use the "Find Lawyers" page to search for lawyers. If you\'ve set your location in your profile, lawyers will be automatically sorted by distance from you. You can also: 1) Use the location filter to search specific areas, 2) View distance on each lawyer\'s card, 3) See office address on lawyer profiles. The map view shows exact lawyer locations.',
                        'order' => 5
                    ],
                    [
                        'question' => 'How long is a typical consultation?',
                        'answer' => 'Standard consultations are 60 minutes (1 hour). The duration is set when you book the appointment. Lawyers charge their hourly rate for the consultation. If you need more time, you can book additional appointments.',
                        'order' => 6
                    ],
                    [
                        'question' => 'Can I leave a review after my consultation?',
                        'answer' => 'Yes! After your appointment is marked as completed, you can leave a review and rating (1-5 stars) for the lawyer. Go to "My Appointments", find the completed appointment, and click "Write Review". Reviews help other clients make informed decisions and help lawyers improve their services. Reviews are moderated by our admin team before being published.',
                        'order' => 7
                    ],
                    [
                        'question' => 'How do I contact customer support?',
                        'answer' => 'You can reach our support team at support@legalkonect.com. We typically respond within 24 hours during business days (Monday-Friday, 9 AM - 6 PM Philippine Time). For urgent issues, please mention "URGENT" in your email subject line.',
                        'order' => 8
                    ],
                    [
                        'question' => 'Is my information kept confidential?',
                        'answer' => 'Yes, we take privacy seriously. Your personal information is protected and never shared with third parties without your consent. Lawyer credentials are encrypted at rest for security. All communications between you and lawyers are private. Please refer to our Privacy Policy for complete details.',
                        'order' => 9
                    ]
                ];
                break;
        }

        foreach ($faqs as $faqData) {
            $faqData['category_id'] = $category->id;
            $faqData['type'] = 'static';
            Faq::create($faqData);
        }
    }
}
