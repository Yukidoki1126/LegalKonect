// FAQ Data Structure
export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  keywords: string[]; // For smart searching
}

export interface FAQCategory {
  name: string;
  icon: string;
  description: string;
}

// Categories
export const faqCategories: FAQCategory[] = [
  {
    name: 'Booking',
    icon: '📅',
    description: 'Questions about appointments and bookings'
  },
  {
    name: 'Payments',
    icon: '💳',
    description: 'Payment methods and billing'
  },
  {
    name: 'For Lawyers',
    icon: '⚖️',
    description: 'Information for legal professionals'
  },
  {
    name: 'Account',
    icon: '👤',
    description: 'Account management and profile'
  },
  {
    name: 'General',
    icon: 'ℹ️',
    description: 'General platform information'
  }
];

// FAQ Database
export const faqs: FAQ[] = [
  // BOOKING QUESTIONS
  {
    id: 1,
    question: 'How do I book an appointment with a lawyer?',
    answer: 'To book an appointment: 1) Search for lawyers in your area, 2) Click on a lawyer\'s profile, 3) Click "Book Appointment", 4) Select your preferred date and time, 5) Choose meeting type (in-person, video, or phone), 6) Add any notes, and 7) Complete the payment.',
    category: 'Booking',
    keywords: ['book', 'appointment', 'schedule', 'reservation', 'how to book']
  },
  {
    id: 2,
    question: 'Can I cancel or reschedule my appointment?',
    answer: 'Yes, you can cancel your appointment up to 24 hours before the scheduled time. Go to "My Appointments", find the appointment, and click "Cancel". For rescheduling, you\'ll need to cancel the current appointment and book a new one.',
    category: 'Booking',
    keywords: ['cancel', 'reschedule', 'change appointment', 'refund']
  },
  {
    id: 3,
    question: 'What meeting types are available?',
    answer: 'We offer three meeting types: In-Person (meet at the lawyer\'s office), Video Call (online consultation), and Phone Call (telephone consultation). You can choose your preferred method when booking.',
    category: 'Booking',
    keywords: ['meeting type', 'video', 'phone', 'in-person', 'online', 'consultation']
  },
  {
    id: 4,
    question: 'How far in advance can I book an appointment?',
    answer: 'You can book appointments based on the lawyer\'s availability. Most lawyers accept bookings up to 30 days in advance. Check the lawyer\'s calendar when booking to see available dates.',
    category: 'Booking',
    keywords: ['advance booking', 'how far', 'future', 'schedule ahead']
  },

  // PAYMENT QUESTIONS
  {
    id: 5,
    question: 'What payment methods do you accept?',
    answer: 'We accept Credit/Debit Cards (Visa, Mastercard), GCash, and PayMaya. All payments are processed securely through PayMongo.',
    category: 'Payments',
    keywords: ['payment', 'pay', 'gcash', 'paymaya', 'card', 'visa', 'mastercard', 'methods']
  },
  {
    id: 6,
    question: 'When do I need to pay for my appointment?',
    answer: 'Payment is required immediately after booking to confirm your appointment. Your appointment will remain pending until payment is completed.',
    category: 'Payments',
    keywords: ['when pay', 'payment timing', 'pay when', 'before appointment']
  },
  {
    id: 7,
    question: 'Is my payment information secure?',
    answer: 'Yes! We use PayMongo, a PCI-DSS compliant payment gateway. We never store your card details on our servers. All payment information is encrypted and securely processed.',
    category: 'Payments',
    keywords: ['secure', 'safety', 'safe', 'encryption', 'card details', 'security']
  },
  {
    id: 8,
    question: 'Can I get a refund if I cancel?',
    answer: 'Refunds are available if you cancel at least 24 hours before your appointment. Refunds are processed within 5-7 business days to your original payment method.',
    category: 'Payments',
    keywords: ['refund', 'money back', 'cancel refund', 'get money']
  },

  // FOR LAWYERS
  {
    id: 9,
    question: 'How can I register as a lawyer on the platform?',
    answer: 'Currently, lawyer registrations are managed by our admin team. Please contact us at admin@legalkonect.com with your bar license number, credentials, and professional information to start the registration process.',
    category: 'For Lawyers',
    keywords: ['register lawyer', 'become lawyer', 'join as lawyer', 'lawyer signup']
  },
  {
    id: 10,
    question: 'How do I get paid for appointments?',
    answer: 'Payments from clients go directly to your account. You can track your earnings in the Lawyer Dashboard under "Earnings". We process payouts on a weekly basis.',
    category: 'For Lawyers',
    keywords: ['lawyer payment', 'get paid', 'earnings', 'payout', 'lawyer money']
  },
  {
    id: 11,
    question: 'Can I set my own availability?',
    answer: 'Yes! In your Lawyer Dashboard, you can set your weekly availability, hourly rate, and mark specific dates as unavailable. You can also toggle your availability on/off.',
    category: 'For Lawyers',
    keywords: ['availability', 'schedule', 'working hours', 'lawyer hours', 'set times']
  },
  {
    id: 12,
    question: 'What happens if I need to decline an appointment?',
    answer: 'You can decline pending appointments from your dashboard. Please provide a reason for declining. The client will be notified and their payment will be refunded.',
    category: 'For Lawyers',
    keywords: ['decline', 'reject appointment', 'refuse booking', 'say no']
  },

  // ACCOUNT QUESTIONS
  {
    id: 13,
    question: 'How do I update my profile information?',
    answer: 'Go to your Profile page from the navigation menu. You can update your name, email, phone number, address, and location. Click "Save Changes" when done.',
    category: 'Account',
    keywords: ['update profile', 'edit profile', 'change information', 'modify account']
  },
  {
    id: 14,
    question: 'I forgot my password. How do I reset it?',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you instructions to reset your password.',
    category: 'Account',
    keywords: ['forgot password', 'reset password', 'password recovery', 'login issues']
  },
  {
    id: 15,
    question: 'How do I update my location?',
    answer: 'Your location is used to find nearby lawyers. You can update it in your Profile page by using the location picker or entering your address manually.',
    category: 'Account',
    keywords: ['location', 'address', 'update location', 'change address', 'gps']
  },

  // GENERAL QUESTIONS
  {
    id: 16,
    question: 'What is LegalKonect?',
    answer: 'LegalKonect is a platform that connects clients with qualified lawyers. We make it easy to find, book, and consult with legal professionals in your area.',
    category: 'General',
    keywords: ['what is', 'about', 'legalkonect', 'platform', 'service']
  },
  {
    id: 17,
    question: 'How do I find lawyers near me?',
    answer: 'Use the Lawyer Search page to browse lawyers. If you\'ve added your location to your profile, lawyers will be sorted by distance from you. You can also filter by specialization.',
    category: 'General',
    keywords: ['find lawyer', 'search lawyer', 'nearby', 'near me', 'location search']
  },
  {
    id: 18,
    question: 'Are the lawyers verified?',
    answer: 'Yes! All lawyers on our platform are verified by our admin team. We check their bar license numbers and credentials before approval.',
    category: 'General',
    keywords: ['verified', 'legitimate', 'real lawyers', 'licensed', 'credentials']
  },
  {
    id: 19,
    question: 'How long is a typical consultation?',
    answer: 'Standard consultations are 60 minutes (1 hour). The duration is set when booking the appointment.',
    category: 'General',
    keywords: ['duration', 'how long', 'consultation time', 'appointment length']
  },
  {
    id: 20,
    question: 'Can I contact customer support?',
    answer: 'Yes! For any issues or questions not covered in the FAQ, please email us at support@legalkonect.com or use the contact form on our website.',
    category: 'General',
    keywords: ['support', 'help', 'contact', 'customer service', 'assistance']
  }
];