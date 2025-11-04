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
                        'question' => 'How do I book an appointment?',
                        'answer' => 'To book an appointment: 1) Browse lawyers using "Find Lawyers", 2) Select a lawyer and click "Book Appointment", 3) Choose a date and time, 4) Complete the payment.',
                        'order' => 1
                    ],
                    [
                        'question' => 'Can I cancel my appointment?',
                        'answer' => 'Yes, you can cancel appointments up to 24 hours before the scheduled time. Go to "My Appointments" and click "Cancel" on the appointment you wish to cancel.',
                        'order' => 2
                    ],
                    [
                        'question' => 'What happens after I book?',
                        'answer' => 'After booking, the lawyer will review your request. You\'ll receive an email notification once they accept or decline. Accepted appointments will show the meeting details.',
                        'order' => 3
                    ],
                    [
                        'question' => 'How do I reschedule an appointment?',
                        'answer' => 'Currently, you need to cancel the existing appointment and create a new one. Make sure to cancel at least 24 hours in advance to avoid charges.',
                        'order' => 4
                    ]
                ];
                break;

            case 'payments':
                $faqs = [
                    [
                        'question' => 'What payment methods do you accept?',
                        'answer' => 'We accept credit/debit cards, GCash, and PayMaya through our secure payment partner PayMongo.',
                        'order' => 1
                    ],
                    [
                        'question' => 'When do I get charged?',
                        'answer' => 'Payment is required at the time of booking. You will only be charged once the lawyer accepts your appointment request.',
                        'order' => 2
                    ],
                    [
                        'question' => 'Can I get a refund?',
                        'answer' => 'Refunds are available if you cancel at least 24 hours before the appointment or if the lawyer declines your request. Refunds are processed within 5-7 business days.',
                        'order' => 3
                    ],
                    [
                        'question' => 'Is my payment information secure?',
                        'answer' => 'Yes, all payments are processed through PayMongo, a PCI-DSS compliant payment gateway. We do not store your card information.',
                        'order' => 4
                    ]
                ];
                break;

            case 'for-lawyers':
                $faqs = [
                    [
                        'question' => 'How do I register as a lawyer?',
                        'answer' => 'Click "Are you a lawyer? Join us" on the homepage, fill out the registration form with your credentials and license information. Your profile will be reviewed within 1-3 business days.',
                        'order' => 1
                    ],
                    [
                        'question' => 'How do I set my availability?',
                        'answer' => 'Once approved, go to your Lawyer Dashboard and use the "Toggle Availability" feature. You can also set specific working hours in your profile settings.',
                        'order' => 2
                    ],
                    [
                        'question' => 'How do I receive payments?',
                        'answer' => 'Payments from completed appointments are tracked in your Earnings dashboard. Payouts are processed monthly to your registered bank account.',
                        'order' => 3
                    ],
                    [
                        'question' => 'What is the approval process?',
                        'answer' => 'Our admin team verifies your bar license number and professional credentials. You\'ll receive an email once approved, then you can start accepting appointments.',
                        'order' => 4
                    ]
                ];
                break;

            case 'account':
                $faqs = [
                    [
                        'question' => 'How do I update my profile?',
                        'answer' => 'Go to your Dashboard and click on "Profile Settings". You can update your name, email, phone number, and location information.',
                        'order' => 1
                    ],
                    [
                        'question' => 'How do I change my password?',
                        'answer' => 'Navigate to Profile Settings and use the "Change Password" section. You\'ll need to enter your current password and new password.',
                        'order' => 2
                    ],
                    [
                        'question' => 'I forgot my password, what should I do?',
                        'answer' => 'Click "Forgot Password" on the login page. Enter your email and we\'ll send you instructions to reset your password.',
                        'order' => 3
                    ]
                ];
                break;

            case 'general':
                $faqs = [
                    [
                        'question' => 'What is LegalKonect?',
                        'answer' => 'LegalKonect is a platform that connects clients with qualified lawyers. We make it easy to find, book, and consult with legal professionals based on your location and needs.',
                        'order' => 1
                    ],
                    [
                        'question' => 'How does LegalKonect work?',
                        'answer' => 'Simply create an account, browse lawyers by specialization or location, book an appointment, and pay securely online. Your lawyer will confirm the appointment and you can meet in-person, via video, or phone.',
                        'order' => 2
                    ],
                    [
                        'question' => 'Is LegalKonect free to use?',
                        'answer' => 'Creating an account is free. You only pay the consultation fee set by the lawyer when you book an appointment.',
                        'order' => 3
                    ],
                    [
                        'question' => 'How do I contact support?',
                        'answer' => 'You can reach us at support@legalkonect.com or call +63 912 345 6789 during business hours (9 AM - 6 PM, Monday-Friday).',
                        'order' => 4
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