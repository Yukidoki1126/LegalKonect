<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FaqSeeder extends Seeder
{
    public function run()
    {
        // First, seed categories (check if exists before inserting)
        $categoryNames = [
            'Booking' => ['slug' => 'booking', 'description' => 'Questions about appointments and bookings', 'order' => 1],
            'Payments' => ['slug' => 'payments', 'description' => 'Payment methods and billing', 'order' => 2],
            'For Lawyers' => ['slug' => 'for-lawyers', 'description' => 'Information for legal professionals', 'order' => 3],
            'Account' => ['slug' => 'account', 'description' => 'Account management and profile', 'order' => 4],
            'General' => ['slug' => 'general', 'description' => 'General platform information', 'order' => 5],
        ];

        $categoryIds = [];
        foreach ($categoryNames as $name => $data) {
            // Check if category already exists
            $existing = DB::table('faq_categories')->where('slug', $data['slug'])->first();
            
            if ($existing) {
                $categoryIds[$data['slug']] = $existing->id;
                $this->command->info("FAQ category '{$name}' already exists, skipping...");
            } else {
                $id = DB::table('faq_categories')->insertGetId([
                    'name' => $name,
                    'slug' => $data['slug'],
                    'description' => $data['description'],
                    'order' => $data['order'],
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                $categoryIds[$data['slug']] = $id;
                $this->command->info("FAQ category '{$name}' created successfully!");
            }
        }

        $this->command->info('FAQ categories seeded successfully!');

        // Now seed FAQs - use slug to map to category ID
        $faqs = [
            // Booking FAQs
            [
                'category' => 'booking',
                'question' => 'How do I book an appointment with a lawyer?',
                'answer' => 'To book an appointment: 1) Click "Find Lawyers" from the navigation menu, 2) Browse lawyers or use filters to find the right lawyer for your needs, 3) Click on a lawyer\'s profile to view their details, 4) Click "Book Appointment", 5) Select your preferred date and available time slot, 6) Choose meeting type (in-person, video call, or phone call), 7) Add any notes about your consultation, 8) Proceed to payment. Once payment is completed, your appointment will be automatically confirmed.',
                'type' => 'static',
                'order' => 1
            ],
            [
                'category' => 'booking',
                'question' => 'Can I cancel my appointment?',
                'answer' => 'Yes, you can cancel appointments any time before the appointment date. Go to "My Appointments" in your dashboard, find the appointment you wish to cancel, and click the "Cancel" button. You\'ll need to provide a cancellation reason. Please note: Cancellations on the same day as the appointment may not be eligible for refunds.',
                'type' => 'static',
                'order' => 2
            ],
            [
                'category' => 'booking',
                'question' => 'What meeting types are available?',
                'answer' => 'LegalKonect offers three consultation types: In-Person (meet at the lawyer\'s office address), Video Call (online consultation via video conference), and Phone Call (consultation by telephone). You can select your preferred meeting type when booking your appointment.',
                'type' => 'static',
                'order' => 3
            ],
            [
                'category' => 'booking',
                'question' => 'How far in advance can I book?',
                'answer' => 'You can book appointments based on the lawyer\'s available schedule. Most lawyers accept bookings up to 30 days in advance. When selecting a date, you\'ll only see time slots that are currently available.',
                'type' => 'static',
                'order' => 4
            ],

            // Payment FAQs (category_id: 2)
            [
                'category' => 'payments',
                'question' => 'What payment methods do you accept?',
                'answer' => 'We accept Credit/Debit Cards (Visa, Mastercard, American Express), GCash, and PayMaya. All payments are processed securely through PayMongo, our trusted payment gateway partner.',
                'type' => 'static',
                'order' => 5
            ],
            [
                'category' => 'payments',
                'question' => 'When do I need to pay for my appointment?',
                'answer' => 'Payment is required immediately after booking to confirm your appointment. Your appointment slot will be held pending payment completion. Once payment is successful, your appointment is automatically confirmed and the lawyer will be notified.',
                'type' => 'static',
                'order' => 6
            ],
            [
                'category' => 'payments',
                'question' => 'Is my payment information secure?',
                'answer' => 'Yes! We use PayMongo, a PCI-DSS Level 1 compliant payment gateway. This means your payment information is encrypted and processed with bank-level security. We never store your complete card details on our servers - all sensitive payment data is handled securely by PayMongo.',
                'type' => 'static',
                'order' => 7
            ],
            [
                'category' => 'payments',
                'question' => 'Will I receive a receipt?',
                'answer' => 'Yes, you will receive a payment receipt via email immediately after successful payment. You can also view and download your payment receipts from your "My Appointments" dashboard.',
                'type' => 'static',
                'order' => 8
            ],

            // For Lawyers FAQs (category_id: 3)
            [
                'category' => 'for-lawyers',
                'question' => 'How can I register as a lawyer on LegalKonect?',
                'answer' => 'To register as a lawyer: 1) Click "Are you a lawyer? Join us" on the homepage, 2) Fill out the registration form with your personal information, 3) Provide your bar credentials (IBP number, Roll of Attorneys number, PRC license number), 4) Upload required documents (ID, bar credentials), 5) Set your specializations and hourly rate, 6) Submit your application. Our admin team will review your credentials within 1-3 business days and notify you via email once approved.',
                'type' => 'static',
                'order' => 9
            ],
            [
                'category' => 'for-lawyers',
                'question' => 'How do I set my availability and schedule?',
                'answer' => 'Once approved, go to your Lawyer Dashboard and navigate to "Schedule Management". You can: 1) Set weekly working hours for each day (Monday-Sunday), 2) Mark specific dates as unavailable, 3) Toggle your availability on/off using the availability switch, 4) Connect your Google Calendar for automatic synchronization. When you set your schedule, these time slots will be available for clients to book.',
                'type' => 'static',
                'order' => 10
            ],
            [
                'category' => 'for-lawyers',
                'question' => 'How do I get paid for appointments?',
                'answer' => 'When clients book and pay for appointments, 80% of the consultation fee goes to you (20% platform fee). You can track all your earnings in the "Earnings" section of your Lawyer Dashboard. To withdraw funds: 1) Go to Earnings page, 2) Configure your payout method (GCash or Bank Transfer), 3) Request a payout (minimum ₱500), 4) Admin will approve and process your payout, 5) Funds are transferred to your account. Payouts are typically processed within 3-5 business days after approval.',
                'type' => 'static',
                'order' => 11
            ],
            [
                'category' => 'for-lawyers',
                'question' => 'What is the platform fee?',
                'answer' => 'LegalKonect charges a 20% platform fee on each completed consultation. This means if a client pays ₱1,000 for your consultation, you receive ₱800. The platform fee covers payment processing, platform maintenance, marketing, and customer support.',
                'type' => 'static',
                'order' => 12
            ],

            // Account FAQs (category_id: 4)
            [
                'category' => 'account',
                'question' => 'How do I create an account?',
                'answer' => 'Click "Sign Up" on the homepage, then fill out the registration form with your name, email, password, phone number, and location. After submitting, you\'ll receive a verification email. Verify your email to activate your account and start booking appointments.',
                'type' => 'static',
                'order' => 13
            ],
            [
                'category' => 'account',
                'question' => 'How do I update my profile information?',
                'answer' => 'Log in to your account and go to "Profile Settings" from your dashboard navigation. You can update your name, email, phone number, address, and location. Click "Save Changes" when done. Some changes may require email verification.',
                'type' => 'static',
                'order' => 14
            ],
            [
                'category' => 'account',
                'question' => 'I forgot my password. How do I reset it?',
                'answer' => 'On the login page, click "Forgot Password". Enter your registered email address and click "Send Reset Link". Check your email for password reset instructions. Click the link in the email and follow the steps to create a new password. The reset link expires after 1 hour for security.',
                'type' => 'static',
                'order' => 15
            ],

            // General FAQs (category_id: 5)
            [
                'category' => 'general',
                'question' => 'What is LegalKonect?',
                'answer' => 'LegalKonect is a platform that connects clients with qualified, verified lawyers in the Philippines. We make it easy to find legal professionals based on specialization, location, ratings, and availability. Book consultations online, pay securely, and meet with lawyers in-person, via video call, or by phone.',
                'type' => 'static',
                'order' => 16
            ],
            [
                'category' => 'general',
                'question' => 'How does LegalKonect work?',
                'answer' => 'It\'s simple: 1) Create a free account, 2) Browse lawyers by specialization, location, or search, 3) View lawyer profiles with ratings, reviews, and fees, 4) Select a date and time from available slots, 5) Choose your meeting type (in-person, video, or phone), 6) Pay securely online, 7) Your appointment is confirmed automatically, 8) Meet with your lawyer at the scheduled time. After the consultation, you can leave a review to help other clients.',
                'type' => 'static',
                'order' => 17
            ],
            [
                'category' => 'general',
                'question' => 'Is LegalKonect free to use?',
                'answer' => 'Creating an account and browsing lawyers is completely free. You only pay when you book an appointment, and the fee is set by the lawyer (typically ₱500-₱3,000 per hour). There are no hidden charges - the price you see is the price you pay.',
                'type' => 'static',
                'order' => 18
            ],
            [
                'category' => 'general',
                'question' => 'Are the lawyers on LegalKonect verified?',
                'answer' => 'Yes! All lawyers undergo a strict verification process. Our admin team verifies: 1) Bar license credentials (IBP number, Roll of Attorneys, PRC license), 2) Identity documents, 3) Professional standing. Only verified lawyers can accept appointments on our platform. You can see verification status on each lawyer\'s profile.',
                'type' => 'static',
                'order' => 19
            ],
            [
                'category' => 'general',
                'question' => 'How do I find lawyers near me?',
                'answer' => 'Use the "Find Lawyers" page to search for lawyers. If you\'ve set your location in your profile, lawyers will be automatically sorted by distance from you. You can also: 1) Use the location filter to search specific areas, 2) View distance on each lawyer\'s card, 3) See office address on lawyer profiles. The map view shows exact lawyer locations.',
                'type' => 'static',
                'order' => 20
            ],
            [
                'category' => 'general',
                'question' => 'Can I leave a review after my consultation?',
                'answer' => 'Yes! After your appointment is marked as completed, you can leave a review and rating (1-5 stars) for the lawyer. Go to "My Appointments", find the completed appointment, and click "Write Review". Reviews help other clients make informed decisions and help lawyers improve their services.',
                'type' => 'static',
                'order' => 21
            ],
            [
                'category' => 'general',
                'question' => 'Is my information kept confidential?',
                'answer' => 'Yes, we take privacy seriously. Your personal information is protected and never shared with third parties without your consent. Lawyer credentials are encrypted at rest for security. All communications between you and lawyers are private. Please refer to our Privacy Policy for complete details.',
                'type' => 'static',
                'order' => 22
            ]
        ];

        foreach ($faqs as $faq) {
            // Check if FAQ with this question already exists
            $existing = DB::table('faqs')
                ->where('category_id', $categoryIds[$faq['category']])
                ->where('question', $faq['question'])
                ->exists();
            
            if (!$existing) {
                DB::table('faqs')->insert([
                    'category_id' => $categoryIds[$faq['category']],
                    'question' => $faq['question'],
                    'answer' => $faq['answer'],
                    'type' => $faq['type'],
                    'dynamic_endpoint' => null,
                    'order' => $faq['order'],
                    'is_active' => true,
                    'views' => 0,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }

        $this->command->info('FAQs seeded successfully!');
    }
}
