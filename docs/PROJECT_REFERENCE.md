# LegalKonect - System Reference Documentation

> Complete reference guide for the LegalKonect legal services platform

**Last Updated:** 2025-10-22
**Project Type:** Full-stack web application
**Status:** Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Key Workflows](#key-workflows)
9. [Authentication & Security](#authentication--security)
10. [Payment Integration](#payment-integration)
11. [Email System](#email-system)
12. [Development Guide](#development-guide)
13. [Deployment Notes](#deployment-notes)

---

## Project Overview

**LegalKonect** is a comprehensive legal services platform connecting clients with lawyers. The platform enables:
- Client registration and profile management with location tracking
- Lawyer discovery with distance-based search
- Appointment booking with time slot availability
- Integrated payment processing (PayMongo)
- Lawyer dashboard for managing appointments and earnings
- Admin panel for system management and analytics

### Core Features
- **For Clients:** Search lawyers by specialization, distance, and price; book appointments; manage profile; access FAQ system
- **For Lawyers:** Manage availability, accept/decline appointments, track earnings
- **For Admins:** User management, lawyer approval, payment tracking, analytics, FAQ management

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **PHP** | 8.2+ | Server-side language |
| **Laravel** | 12.x | PHP framework |
| **Laravel Sanctum** | Latest | API authentication |
| **Eloquent ORM** | Built-in | Database abstraction |
| **SQLite/MySQL** | - | Database |
| **PayMongo API** | Latest | Payment processing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI framework |
| **TypeScript** | Latest | Type safety |
| **React Router** | 7.9.3 | Routing |
| **Axios** | 1.12.2 | HTTP client |
| **Tailwind CSS** | 3.4.1 | Styling |
| **Lucide React** | Latest | Icons |
| **Recharts** | 3.3.0 | Charts/Analytics |
| **Google Maps API** | Latest | Location services |

### Development Tools
- Composer (PHP dependencies)
- NPM (JavaScript dependencies)
- Vite (Frontend build)
- PHPUnit (Backend testing)
- React Testing Library (Frontend testing)

---

## Directory Structure

```
legalkonect/
│
├── backend/                          # Laravel REST API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/         # API controllers
│   │   │   └── Middleware/          # Auth & authorization
│   │   ├── Models/                  # Eloquent models
│   │   ├── Mail/                    # Email templates
│   │   └── Services/                # Business logic
│   ├── config/                      # Configuration files
│   ├── database/
│   │   ├── migrations/              # Database schema
│   │   └── seeders/                 # Test data
│   ├── routes/
│   │   └── api.php                  # API routes
│   ├── resources/
│   │   └── views/emails/            # Email views
│   ├── storage/                     # File storage
│   ├── tests/                       # Backend tests
│   ├── .env.example                 # Environment template
│   ├── artisan                      # CLI tool
│   ├── composer.json                # PHP dependencies
│   └── README.md                    # Backend docs
│
├── frontend/                         # React SPA
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── context/                 # Global state
│   │   ├── pages/                   # Page components
│   │   │   ├── admin/               # Admin pages
│   │   │   └── lawyer/              # Lawyer pages
│   │   ├── services/                # API services
│   │   ├── App.tsx                  # Root component
│   │   └── index.tsx                # Entry point
│   ├── .env                         # Environment config
│   ├── package.json                 # NPM dependencies
│   ├── tailwind.config.js           # Tailwind config
│   └── README.md                    # Frontend docs
│
└── PROJECT_REFERENCE.md             # This file
```

---

## Backend Architecture

### Models (`backend/app/Models/`)

#### User Model
**File:** `User.php`
**Purpose:** Platform clients who book appointments

**Key Fields:**
- `id` - Primary key
- `name` - Full name
- `email` - Unique email
- `password` - Hashed password
- `phone` - Contact number
- `latitude`, `longitude` - Geolocation
- `address`, `city`, `province` - Location details
- `status` - active/suspended
- `location_updated_at` - Last location update

**Key Relationships:**
- `lawyer()` - One-to-one with Lawyer
- `appointments()` - Has many appointments

**Key Methods:**
- `isLawyer()` - Check if user has lawyer profile

#### Lawyer Model
**File:** `Lawyer.php`
**Purpose:** Legal professionals offering services

**Key Fields:**
- `id` - Primary key
- `user_id` - Foreign key to User
- `first_name`, `last_name` - Name
- `bio` - Profile description
- `license_number` - Bar license
- `years_experience` - Years of practice
- `hourly_rate` - Consultation fee
- `office_address`, `office_latitude`, `office_longitude` - Office location
- `office_phone` - Office contact
- `status` - pending/approved
- `is_available` - Availability toggle
- `rating` - Average rating
- `total_reviews` - Review count

**Key Relationships:**
- `user()` - Belongs to User
- `appointments()` - Has many appointments
- `specializations()` - Belongs to many Specializations
- `availability()` - Has many LawyerAvailability

**Key Methods:**
- `pendingAppointments()` - Get pending appointments
- `upcomingAppointments()` - Get confirmed upcoming
- `totalEarnings()` - Calculate total income
- `scopeApproved($query)` - Filter approved lawyers
- `scopeAvailable($query)` - Filter available lawyers

#### Appointment Model
**File:** `Appointment.php`
**Purpose:** Booking records

**Key Fields:**
- `id` - Primary key
- `user_id` - Client
- `lawyer_id` - Lawyer
- `appointment_date` - Date
- `appointment_time` - Time
- `duration_minutes` - Duration (default 60)
- `status` - pending/confirmed/completed/cancelled
- `consultation_fee` - Amount
- `payment_status` - paid/unpaid
- `payment_method` - card/gcash/paymaya
- `payment_reference` - PayMongo reference
- `client_notes` - Client notes
- `lawyer_notes` - Lawyer notes
- `meeting_type` - in-person/video/phone
- `cancelled_by` - user_id who cancelled
- `cancellation_reason` - Reason for cancellation

**Key Relationships:**
- `user()` - Belongs to User
- `lawyer()` - Belongs to Lawyer

**Key Methods:**
- `canBeCancelled()` - Check if cancellable
- `scopeUpcoming($query)` - Filter upcoming appointments
- `scopePast($query)` - Filter past appointments

#### Admin Model
**File:** `Admin.php`
**Purpose:** System administrators

**Key Fields:**
- `id` - Primary key
- `name` - Admin name
- `email` - Unique email
- `password` - Hashed password
- `is_active` - Active status
- `last_login_at` - Last login timestamp

#### LawyerAvailability Model
**File:** `LawyerAvailability.php`
**Purpose:** Weekly schedule for lawyers

**Key Fields:**
- `lawyer_id` - Foreign key
- `day_of_week` - 0 (Sunday) to 6 (Saturday)
- `start_time` - Time (HH:MM:SS)
- `end_time` - Time (HH:MM:SS)
- `is_available` - Boolean

#### Specialization Model
**File:** `Specialization.php`
**Purpose:** Practice areas

**Key Fields:**
- `name` - Specialization name
- `description` - Description
- `icon` - Icon identifier
- `is_active` - Active status

**Key Relationships:**
- `lawyers()` - Belongs to many Lawyers

#### FAQ Model
**File:** `Faq.php`
**Purpose:** Frequently asked questions

**Key Fields:**
- `id` - Primary key
- `category_id` - Foreign key to FaqCategory
- `question` - Question text
- `answer` - Answer text
- `type` - static/dynamic
- `order` - Display order
- `views` - View count
- `is_active` - Active status

**Key Relationships:**
- `category()` - Belongs to FaqCategory

#### FaqCategory Model
**File:** `FaqCategory.php`
**Purpose:** FAQ categorization

**Key Fields:**
- `id` - Primary key
- `name` - Category name
- `slug` - URL slug
- `description` - Description
- `icon` - Icon identifier
- `order` - Display order
- `is_active` - Active status

**Key Relationships:**
- `faqs()` - Has many Faqs

---

### Controllers (`backend/app/Http/Controllers/`)

#### AuthController
**File:** `AuthController.php`
**Purpose:** User authentication and profile management

**Endpoints:**
- `POST /auth/register` - Create user account
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - Revoke token
- `POST /auth/update-location` - Update user coordinates
- `PUT /auth/profile` - Update profile details

**Key Logic:**
- Password hashing with bcrypt
- Token creation with Sanctum
- Location validation

#### LawyerController
**File:** `LawyerController.php`
**Purpose:** Public lawyer information

**Endpoints:**
- `GET /lawyers` - List all approved lawyers
- `GET /lawyers/{id}` - Get lawyer profile
- `GET /specializations` - List all specializations

**Key Logic:**
- Eager loads specializations
- Filters approved lawyers only
- Returns public profile data

#### AppointmentController
**File:** `AppointmentController.php`
**Purpose:** Appointment booking and management

**Endpoints:**
- `GET /lawyers/{lawyer}/available-slots` - Get available time slots
- `POST /appointments` - Create appointment
- `GET /appointments` - Get user's appointments
- `GET /appointments/{id}` - Get appointment details
- `POST /appointments/{id}/cancel` - Cancel appointment

**Key Logic:**
- Slot availability validation:
  - Check day of week availability
  - Check unavailable dates
  - Check existing bookings
- Appointment ownership validation
- Cancellation rules (24 hours before)

#### PaymentController
**File:** `PaymentController.php`
**Purpose:** Payment processing with PayMongo

**Endpoints:**
- `POST /appointments/{id}/payment-intent` - Create payment intent
- `POST /payments/method` - Create payment method
- `POST /payments/attach` - Attach method to intent
- `POST /payments/source` - Create GCash/PayMaya source
- `POST /auth/webhooks/paymongo` - Webhook handler
- `GET /payment/source-callback` - Payment redirect callback

**Key Logic:**
- Amount conversion to centavos
- Payment method creation (card/gcash/paymaya)
- Payment confirmation and status update
- Email receipt on success
- Webhook signature verification

#### LawyerDashboardController
**File:** `LawyerDashboardController.php`
**Purpose:** Lawyer dashboard and appointment management

**Endpoints:**
- `GET /lawyer/dashboard` - Dashboard stats
- `GET /lawyer/appointments` - All appointments
- `POST /lawyer/appointments/{id}/accept` - Accept appointment
- `POST /lawyer/appointments/{id}/decline` - Decline appointment
- `POST /lawyer/appointments/{id}/complete` - Mark complete
- `POST /lawyer/appointments/{id}/notes` - Add notes
- `GET /lawyer/earnings` - Earnings data
- `POST /lawyer/toggle-availability` - Toggle availability

**Key Logic:**
- Pending/upcoming appointment counts
- Total earnings calculation
- Appointment state transitions
- Monthly earnings breakdown

#### Admin Controllers
**Files:** `AdminAuthController.php`, `AdminDashboardController.php`, `AdminFaqController.php`
**Purpose:** Admin authentication and system management

**Endpoints:**
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/lawyers` - Lawyer management
- `GET /admin/users` - User management
- `GET /admin/payments` - Payment records
- `GET /admin/analytics` - Analytics data
- `GET /admin/faqs` - Get all FAQs
- `POST /admin/faqs` - Create FAQ
- `PUT /admin/faqs/{id}` - Update FAQ
- `DELETE /admin/faqs/{id}` - Delete FAQ
- `GET /admin/faq-categories` - Get all FAQ categories
- `POST /admin/faq-categories` - Create FAQ category
- `PUT /admin/faq-categories/{id}` - Update FAQ category
- `DELETE /admin/faq-categories/{id}` - Delete FAQ category
- Various POST/PUT/DELETE endpoints for CRUD operations

**Key Logic:**
- Admin-only authentication
- Caching for performance (30-60s TTL)
- Lawyer approval workflow
- User suspension
- Payment filtering
- FAQ and category management

#### FAQ Controller
**File:** `FaqController.php`
**Purpose:** Public FAQ access

**Endpoints:**
- `GET /faqs` - List all active FAQs
- `GET /faqs/{id}` - Get FAQ details and increment view count
- `GET /faqs/categories` - List all active FAQ categories
- `GET /faqs/category/{slug}` - Get FAQs by category

**Key Logic:**
- Only returns active FAQs and categories
- View tracking
- Ordered by category and FAQ order fields
- Filters by type (static/dynamic)

---

### Middleware (`backend/app/Http/Middleware/`)

#### EnsureLawyer
**File:** `EnsureLawyer.php`
**Purpose:** Verify user has lawyer profile

**Logic:**
- Checks if authenticated user has associated lawyer record
- Returns 403 if not a lawyer

#### EnsureAdmin
**File:** `EnsureAdmin.php`
**Purpose:** Verify admin authentication

**Logic:**
- Validates Admin instance (not User)
- Checks is_active flag
- Returns 403 if not admin or inactive

#### Authenticate
**File:** `Authenticate.php` (Sanctum)
**Purpose:** Token validation

**Logic:**
- Validates Bearer token
- Returns 401 if unauthenticated

---

### Services (`backend/app/Services/`)

#### PaymongoService
**File:** `PaymongoService.php`
**Purpose:** PayMongo API integration

**Methods:**
- `createPaymentIntent($amount, $metadata)` - Create intent
- `createPaymentMethod($type, $details)` - Create method
- `attachPaymentMethod($intentId, $methodId)` - Attach method
- `createSource($type, $amount, $metadata)` - Create source
- `retrieveSource($sourceId)` - Get source status

**Key Logic:**
- Converts amounts to centavos (multiply by 100)
- Converts all metadata values to strings
- Uses Guzzle HTTP client
- Error handling and logging

---

### Mail Templates (`backend/app/Mail/`)

#### AppointmentBooked
**File:** `AppointmentBooked.php`
**Purpose:** Booking confirmation email

**Data:**
- Appointment details
- Lawyer information
- Date and time

#### AppointmentReminder
**File:** `AppointmentReminder.php`
**Purpose:** 24-hour reminder before appointment

**Data:**
- Appointment details
- Reminder text

#### PaymentReceipt
**File:** `PaymentReceipt.php`
**Purpose:** Payment confirmation

**Data:**
- Amount paid
- Payment method
- Payment reference

---

### Database Migrations (`backend/database/migrations/`)

**Key Migrations:**
1. `create_users_table` - User accounts with location fields
2. `create_lawyers_table` - Lawyer profiles
3. `create_specializations_table` - Practice areas
4. `create_lawyer_specializations_table` - Many-to-many pivot
5. `create_appointments_table` - Booking records
6. `create_lawyer_availability_table` - Weekly schedules
7. `create_lawyer_unavailable_dates_table` - Blocked dates
8. `create_admins_table` - Admin accounts
9. `create_personal_access_tokens_table` - Sanctum tokens
10. `create_faq_categories_table` - FAQ categories
11. `create_faqs_table` - FAQ entries

---

### Seeders (`backend/database/seeders/`)

**Available Seeders:**
- `DatabaseSeeder` - Main seeder (calls all others)
- `AdminSeeder` - Default admin account
- `SpecializationsTableSeeder` - Legal specializations
- `LawyersTableSeeder` - Sample lawyers
- `LawyerAvailabilitySeeder` - Sample schedules
- `FaqCategorySeeder` - FAQ categories
- `FaqSeeder` - Sample FAQs

**Run:** `php artisan migrate:fresh --seed`

---

## Frontend Architecture

### Context (`frontend/src/context/`)

#### AuthContext
**File:** `AuthContext.tsx`
**Purpose:** Global authentication state

**State:**
- `user` - Current user object or null
- `token` - Authentication token
- `loading` - Loading state

**Methods:**
- `login(email, password)` - Authenticate user
- `register(data)` - Create account
- `logout()` - Clear session
- `updateUser(data)` - Update user data

**Storage:**
- Token and user stored in localStorage
- Auto-restore on page load
- Request interceptor adds Bearer token

---

### Services (`frontend/src/services/`)

#### api.ts
**Purpose:** Axios instance configuration

**Features:**
- Base URL from environment
- Request interceptor (adds auth token)
- Response interceptor (handles 401)
- Error handling

#### lawyerApi.ts
**Purpose:** Lawyer-specific API calls

**Methods:**
- `getDashboard()` - Get dashboard stats
- `getAppointments()` - Get all appointments
- `acceptAppointment(id)` - Accept appointment
- `declineAppointment(id, reason)` - Decline appointment
- `completeAppointment(id)` - Mark complete
- `addNotes(id, notes)` - Add consultation notes
- `getEarnings()` - Get earnings data
- `toggleAvailability()` - Toggle availability

#### adminApi.ts
**Purpose:** Admin API calls

**Methods:**
- `login(email, password)` - Admin login
- `getDashboard()` - Dashboard stats
- `getLawyers()` - Lawyer list
- `approveLawyer(id)` - Approve lawyer
- `deleteLawyer(id)` - Delete lawyer
- `getUsers()` - User list
- `suspendUser(id)` - Suspend user
- `getPayments()` - Payment records
- `getAnalytics(startDate, endDate)` - Analytics data

#### locationService.ts
**Purpose:** Google Maps integration

**Methods:**
- `geocodeAddress(address)` - Address to coordinates
- `reverseGeocode(lat, lng)` - Coordinates to address
- `calculateDistance(lat1, lng1, lat2, lng2)` - Haversine distance

---

### Components (`frontend/src/components/`)

#### Navigation
**File:** `Navigation.tsx`
**Purpose:** Top navigation bar

**Features:**
- Logo and site name
- User menu
- Role-based links (client/lawyer/admin)
- Logout functionality

#### ProtectedRoute
**File:** `ProtectedRoute.tsx`
**Purpose:** Authentication guard

**Logic:**
- Checks if user is authenticated
- Redirects to login if not
- Shows loading state

#### ClientOnlyRoute
**File:** `ClientOnlyRoute.tsx`
**Purpose:** Prevent lawyer access to client pages

**Logic:**
- Checks if user has lawyer profile
- Redirects lawyers to their dashboard

#### LawyerCard
**File:** `LawyerCard.tsx`
**Purpose:** Lawyer preview card

**Features:**
- Profile photo
- Name and bio
- Hourly rate
- Experience years
- Specializations
- Distance (if available)
- Click to view details

#### BookingModal
**File:** `BookingModal.tsx`
**Purpose:** Appointment booking interface

**Features:**
- Date picker
- Time slot selection
- Meeting type selection
- Client notes
- Real-time availability checking

#### CustomCalendar
**File:** `CustomCalendar.tsx`
**Purpose:** Date selection component

**Features:**
- Month/year navigation
- Disable past dates
- Highlight selected date
- Custom styling

#### LocationPicker
**File:** `LocationPicker.tsx`
**Purpose:** Google Maps location selector

**Features:**
- Interactive map
- Marker placement
- Address autocomplete
- Reverse geocoding

#### Toast
**File:** `Toast.tsx`
**Purpose:** Notification system

**Features:**
- Success/error/info types
- Auto-dismiss
- Custom duration

#### ConfirmModal
**File:** `ConfirmModal.tsx`
**Purpose:** Confirmation dialogs

**Features:**
- Custom title and message
- Confirm/cancel buttons
- Callback functions

---

### Pages (`frontend/src/pages/`)

#### Client Pages

**Home** (`Home.tsx`)
- Landing page
- Platform overview
- Call-to-action

**Login** (`Login.tsx`)
- Email/password form
- Link to register
- Error handling

**Register** (`Register.tsx`)
- Registration form
- Location picker
- Form validation

**Dashboard** (`Dashboard.tsx`)
- Welcome message
- Quick action cards
- Recent appointments

**Profile** (`Profile.tsx`)
- Edit profile details
- Update location
- Change password

**LawyerSearch** (`LawyerSearch.tsx`)
- Lawyer list with cards
- Filter by specialization
- Sort by distance/price/experience
- Pagination

**LawyerDetail** (`LawyerDetail.tsx`)
- Full lawyer profile
- Specializations
- Office location map
- Booking button

**Appointments** (`Appointments.tsx`)
- Upcoming/past tabs
- Appointment cards
- Cancel functionality
- Payment links

**PaymentPage** (`PaymentPage.tsx`)
- Payment method selection
- Card payment form
- GCash/PayMaya checkout
- Success/error handling

---

#### Lawyer Pages (`frontend/src/pages/lawyer/`)

**LawyerLayout** (`LawyerLayout.tsx`)
- Dashboard container
- Sidebar navigation
- Lawyer-only guard

**LawyerDashboard** (`LawyerDashboard.tsx`)
- Stats cards (pending, upcoming, earnings)
- Recent appointments
- Quick actions

**LawyerAppointments** (`LawyerAppointments.tsx`)
- Appointment list
- Accept/decline buttons
- Complete appointment
- Add notes

**LawyerEarnings** (`LawyerEarnings.tsx`)
- Total earnings
- Monthly breakdown
- Earnings chart (Recharts)
- Filter by date range

---

#### Admin Pages (`frontend/src/pages/admin/`)

**AdminLogin** (`AdminLogin.tsx`)
- Separate admin login
- Email/password form

**AdminDashboard** (`AdminDashboard.tsx`)
- Layout container
- Sidebar navigation
- Admin-only guard

**AdminOverview** (`AdminOverview.tsx`)
- KPI cards (users, lawyers, revenue)
- Recent activity
- Quick stats

**AdminLawyers** (`AdminLawyers.tsx`)
- Lawyer management table
- Approve/reject lawyers
- Toggle availability
- Delete lawyers

**AdminAppointments** (`AdminAppointments.tsx`)
- Appointment overview
- Filter by status
- View details

**AdminUsers** (`AdminUsers.tsx`)
- User management table
- Suspend/activate users
- Delete users
- Search functionality

**AdminPayments** (`AdminPayments.tsx`)
- Payment records table
- Filter by status/method
- Export functionality

**AdminAnalytics** (`AdminAnalytics.tsx`)
- Revenue charts
- User growth
- Booking trends
- Date range selector

**AdminFaqs** (`AdminFaqs.tsx`)
- FAQ management table
- Create/edit/delete FAQs
- Category assignment
- Search and filter functionality
- View count tracking
- FAQ status toggle (active/inactive)
- Type selection (static/dynamic)
- Order management

---

### Routing (`frontend/src/App.tsx`)

**Route Structure:**

```typescript
// Public Routes
/ - Home
/login - Login
/register - Register
/admin/login - Admin Login

// Protected Client Routes (requires auth, not lawyer)
/dashboard - Client Dashboard
/profile - Profile
/lawyers - Lawyer Search
/lawyers/:id - Lawyer Detail
/appointments - Appointments List
/appointments/:appointmentId/payment - Payment

// Protected Lawyer Routes (requires auth + lawyer profile)
/lawyer/dashboard - Lawyer Dashboard
/lawyer/appointments - Lawyer Appointments
/lawyer/earnings - Lawyer Earnings

// Protected Admin Routes (requires admin auth)
/admin/dashboard - Admin Overview
/admin/lawyers - Lawyer Management
/admin/appointments - Appointment Management
/admin/users - User Management
/admin/payments - Payment Management
/admin/analytics - Analytics
/admin/faqs - FAQ Management

// Public FAQ Routes
/faqs - FAQ List
/faqs/:id - FAQ Detail
/faqs/category/:slug - FAQs by Category
```

---

### TypeScript Interfaces

**User Interface:**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  status?: 'active' | 'suspended';
  lawyer?: Lawyer;
}
```

**Lawyer Interface:**
```typescript
interface Lawyer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  bio: string;
  license_number: string;
  years_experience: number;
  hourly_rate: number;
  office_address?: string;
  office_latitude?: string;
  office_longitude?: string;
  office_phone?: string;
  status: 'pending' | 'approved';
  is_available: boolean;
  rating?: number;
  total_reviews?: number;
  specializations: Specialization[];
  distance?: number;
}
```

**Appointment Interface:**
```typescript
interface Appointment {
  id: number;
  user_id: number;
  lawyer_id: number;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  consultation_fee: number;
  payment_status: 'paid' | 'unpaid';
  payment_method?: 'card' | 'gcash' | 'paymaya';
  payment_reference?: string;
  client_notes?: string;
  lawyer_notes?: string;
  meeting_type: 'in-person' | 'video' | 'phone';
  user?: User;
  lawyer?: Lawyer;
}
```

**Specialization Interface:**
```typescript
interface Specialization {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}
```

**FAQ Interface:**
```typescript
interface FAQ {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  type: 'static' | 'dynamic';
  order: number;
  views: number;
  is_active: boolean;
  category?: FaqCategory;
}
```

**FaqCategory Interface:**
```typescript
interface FaqCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  is_active: boolean;
  faqs_count?: number;
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  location_updated_at TIMESTAMP,
  status ENUM('active', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Lawyers Table
```sql
CREATE TABLE lawyers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  bio TEXT,
  license_number VARCHAR(100),
  years_experience INT DEFAULT 0,
  hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
  office_address TEXT,
  office_latitude DECIMAL(10, 8),
  office_longitude DECIMAL(11, 8),
  office_phone VARCHAR(20),
  office_hours JSON,
  profile_photo VARCHAR(255),
  status ENUM('pending', 'approved') DEFAULT 'pending',
  is_available BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  lawyer_id BIGINT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INT DEFAULT 60,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  consultation_fee DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  client_notes TEXT,
  lawyer_notes TEXT,
  meeting_type ENUM('in-person', 'video', 'phone') DEFAULT 'in-person',
  meeting_link VARCHAR(255),
  cancelled_by BIGINT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
);
```

### LawyerAvailability Table
```sql
CREATE TABLE lawyer_availability (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id BIGINT NOT NULL,
  day_of_week TINYINT NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
);
```

### Specializations Table
```sql
CREATE TABLE specializations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### LawyerSpecializations Table (Pivot)
```sql
CREATE TABLE lawyer_specializations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id BIGINT NOT NULL,
  specialization_id BIGINT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE,
  FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE CASCADE
);
```

### Admins Table
```sql
CREATE TABLE admins (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### FaqCategories Table
```sql
CREATE TABLE faq_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Faqs Table
```sql
CREATE TABLE faqs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  type ENUM('static', 'dynamic') DEFAULT 'static',
  order INT DEFAULT 0,
  views INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE
);
```

---

## API Reference

### Authentication Endpoints

#### POST `/auth/register`
**Purpose:** Create user account
**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "password_confirmation": "string",
  "phone": "string (optional)",
  "latitude": "number (optional)",
  "longitude": "number (optional)",
  "address": "string (optional)",
  "city": "string (optional)",
  "province": "string (optional)"
}
```
**Response:** User object + token

#### POST `/auth/login`
**Purpose:** Authenticate user
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:** User object + token

#### POST `/auth/logout`
**Auth:** Required
**Purpose:** Revoke current token

#### POST `/auth/update-location`
**Auth:** Required
**Body:**
```json
{
  "latitude": "number",
  "longitude": "number"
}
```

#### PUT `/auth/profile`
**Auth:** Required
**Body:** User fields to update

---

### Lawyer Endpoints

#### GET `/lawyers`
**Purpose:** List all approved lawyers
**Response:** Array of Lawyer objects with specializations

#### GET `/lawyers/{id}`
**Purpose:** Get lawyer profile
**Response:** Lawyer object with specializations

#### GET `/specializations`
**Purpose:** List all active specializations
**Response:** Array of Specialization objects

#### GET `/lawyers/{lawyer}/available-slots`
**Purpose:** Get available time slots
**Query Params:** `date` (YYYY-MM-DD)
**Response:** Array of available time strings

---

### Appointment Endpoints

#### POST `/appointments`
**Auth:** Required
**Purpose:** Create appointment
**Body:**
```json
{
  "lawyer_id": "number",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM",
  "meeting_type": "in-person|video|phone",
  "client_notes": "string (optional)"
}
```

#### GET `/appointments`
**Auth:** Required
**Purpose:** Get user's appointments
**Query Params:** `status` (optional)

#### GET `/appointments/{id}`
**Auth:** Required
**Purpose:** Get appointment details

#### POST `/appointments/{id}/cancel`
**Auth:** Required
**Purpose:** Cancel appointment
**Body:**
```json
{
  "cancellation_reason": "string"
}
```

---

### Payment Endpoints

#### POST `/appointments/{id}/payment-intent`
**Auth:** Required
**Purpose:** Create PayMongo payment intent
**Response:** Payment intent object

#### POST `/payments/method`
**Auth:** Required
**Purpose:** Create payment method
**Body:**
```json
{
  "type": "card",
  "details": {
    "card_number": "string",
    "exp_month": "number",
    "exp_year": "number",
    "cvc": "string"
  }
}
```

#### POST `/payments/attach`
**Auth:** Required
**Purpose:** Attach payment method to intent
**Body:**
```json
{
  "intent_id": "string",
  "method_id": "string",
  "appointment_id": "number"
}
```

#### POST `/payments/source`
**Auth:** Required
**Purpose:** Create GCash/PayMaya source
**Body:**
```json
{
  "type": "gcash|paymaya",
  "amount": "number",
  "appointment_id": "number"
}
```

#### GET `/payment/source-callback`
**Purpose:** Handle payment redirect
**Query Params:** `source_id`, `appointment_id`

#### POST `/auth/webhooks/paymongo`
**Purpose:** PayMongo webhook handler
**Headers:** `paymongo-signature`

---

### Lawyer Dashboard Endpoints

#### GET `/lawyer/dashboard`
**Auth:** Required (Lawyer)
**Purpose:** Dashboard statistics
**Response:**
```json
{
  "pending_count": "number",
  "upcoming_count": "number",
  "total_earnings": "number"
}
```

#### GET `/lawyer/appointments`
**Auth:** Required (Lawyer)
**Purpose:** Get all appointments
**Query Params:** `status` (optional)

#### POST `/lawyer/appointments/{id}/accept`
**Auth:** Required (Lawyer)
**Purpose:** Accept pending appointment

#### POST `/lawyer/appointments/{id}/decline`
**Auth:** Required (Lawyer)
**Body:**
```json
{
  "reason": "string"
}
```

#### POST `/lawyer/appointments/{id}/complete`
**Auth:** Required (Lawyer)
**Purpose:** Mark appointment complete

#### POST `/lawyer/appointments/{id}/notes`
**Auth:** Required (Lawyer)
**Body:**
```json
{
  "lawyer_notes": "string"
}
```

#### GET `/lawyer/earnings`
**Auth:** Required (Lawyer)
**Purpose:** Earnings breakdown
**Response:**
```json
{
  "total": "number",
  "this_month": "number",
  "by_month": [
    {"month": "string", "total": "number"}
  ]
}
```

#### POST `/lawyer/toggle-availability`
**Auth:** Required (Lawyer)
**Purpose:** Toggle is_available flag

---

### Admin Endpoints

#### POST `/admin/login`
**Purpose:** Admin authentication
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

#### GET `/admin/dashboard`
**Auth:** Required (Admin)
**Purpose:** Dashboard KPIs
**Response:**
```json
{
  "total_users": "number",
  "total_lawyers": "number",
  "pending_lawyers": "number",
  "total_appointments": "number",
  "total_revenue": "number"
}
```

#### GET `/admin/lawyers`
**Auth:** Required (Admin)
**Purpose:** Lawyer management list

#### PUT `/admin/lawyers/{id}/approve`
**Auth:** Required (Admin)
**Purpose:** Approve lawyer

#### DELETE `/admin/lawyers/{id}`
**Auth:** Required (Admin)
**Purpose:** Delete lawyer

#### GET `/admin/users`
**Auth:** Required (Admin)
**Purpose:** User list

#### PUT `/admin/users/{id}/suspend`
**Auth:** Required (Admin)
**Purpose:** Suspend user

#### GET `/admin/payments`
**Auth:** Required (Admin)
**Purpose:** Payment records
**Query Params:** `status`, `method`, `page`

#### GET `/admin/analytics`
**Auth:** Required (Admin)
**Purpose:** Analytics data
**Query Params:** `start_date`, `end_date`

---

### FAQ Endpoints

#### GET `/faqs`
**Purpose:** List all active FAQs
**Response:** Array of FAQ objects with categories

#### GET `/faqs/{id}`
**Purpose:** Get FAQ details and increment view count
**Response:** FAQ object with category

#### GET `/faqs/categories`
**Purpose:** List all active FAQ categories
**Response:** Array of FaqCategory objects with FAQ counts

#### GET `/faqs/category/{slug}`
**Purpose:** Get FAQs by category slug
**Response:** Category object with FAQs array

#### GET `/admin/faqs`
**Auth:** Required (Admin)
**Purpose:** Get all FAQs (including inactive)
**Response:** Array of FAQ objects with categories

#### POST `/admin/faqs`
**Auth:** Required (Admin)
**Purpose:** Create new FAQ
**Body:**
```json
{
  "category_id": "number",
  "question": "string",
  "answer": "string",
  "type": "static|dynamic",
  "order": "number",
  "is_active": "boolean"
}
```

#### PUT `/admin/faqs/{id}`
**Auth:** Required (Admin)
**Purpose:** Update FAQ
**Body:** Same as POST

#### DELETE `/admin/faqs/{id}`
**Auth:** Required (Admin)
**Purpose:** Delete FAQ

#### GET `/admin/faq-categories`
**Auth:** Required (Admin)
**Purpose:** Get all FAQ categories
**Response:** Array of FaqCategory objects

#### POST `/admin/faq-categories`
**Auth:** Required (Admin)
**Purpose:** Create new FAQ category
**Body:**
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "icon": "string",
  "order": "number",
  "is_active": "boolean"
}
```

#### PUT `/admin/faq-categories/{id}`
**Auth:** Required (Admin)
**Purpose:** Update FAQ category
**Body:** Same as POST

#### DELETE `/admin/faq-categories/{id}`
**Auth:** Required (Admin)
**Purpose:** Delete FAQ category

---

## Key Workflows

### 1. User Registration Flow

```
User → Register Form
  ↓
Frontend POST /auth/register
  ↓
Backend validates data
  ↓
Create User record
  ↓
Generate Sanctum token
  ↓
Return user + token
  ↓
Frontend stores in localStorage
  ↓
Redirect to Dashboard
```

### 2. Lawyer Search Flow

```
User → Navigate to /lawyers
  ↓
Frontend GET /lawyers
  ↓
Backend returns approved lawyers
  ↓
Frontend calculates distance (if user location available)
  ↓
Apply filters (specialization)
  ↓
Sort (distance/price/experience)
  ↓
Display LawyerCard components
  ↓
User clicks card → /lawyers/:id
```

### 3. Appointment Booking Flow

```
User → Select Lawyer
  ↓
Click "Book Appointment"
  ↓
BookingModal opens
  ↓
User selects date
  ↓
Frontend GET /lawyers/{id}/available-slots?date=YYYY-MM-DD
  ↓
Backend checks:
  - Day of week availability
  - Unavailable dates
  - Existing bookings
  ↓
Return available 1-hour slots
  ↓
User selects time + meeting type
  ↓
Frontend POST /appointments
  ↓
Backend creates appointment (status=pending, payment_status=unpaid)
  ↓
Send confirmation email
  ↓
Return appointment
  ↓
Redirect to /appointments
```

### 4. Payment Processing Flow

#### Card Payment:
```
User → Unpaid Appointment
  ↓
Click "Pay Now"
  ↓
Navigate to /appointments/:id/payment
  ↓
Frontend POST /appointments/{id}/payment-intent
  ↓
Backend creates PayMongo intent
  ↓
Return intent (client_key)
  ↓
User enters card details
  ↓
Frontend POST /payments/method (creates card method)
  ↓
Frontend POST /payments/attach (attaches method to intent)
  ↓
PayMongo processes payment
  ↓
Backend updates:
  - appointment.payment_status = paid
  - appointment.status = confirmed
  ↓
Send payment receipt email
  ↓
Redirect to success page
```

#### GCash/PayMaya Payment:
```
User → Select GCash/PayMaya
  ↓
Frontend POST /payments/source
  ↓
Backend creates PayMongo source
  ↓
Return checkout_url
  ↓
Redirect to PayMongo checkout
  ↓
User completes payment
  ↓
PayMongo redirects to /payment/source-callback?source_id=xxx&appointment_id=yyy
  ↓
Backend retrieves source
  ↓
If status=chargeable → create charge
  ↓
Update appointment status
  ↓
Send receipt email
  ↓
Redirect to success page
```

### 5. Lawyer Dashboard Flow

```
Lawyer → Login
  ↓
Navigate to /lawyer/dashboard
  ↓
Frontend GET /lawyer/dashboard
  ↓
Backend calculates:
  - Pending appointments count
  - Upcoming appointments count
  - Total earnings
  ↓
Display stats cards
  ↓
Lawyer views pending appointment
  ↓
Click "Accept" → POST /lawyer/appointments/{id}/accept
  ↓
Update appointment.status = confirmed
  ↓
Send notification to client
  ↓
OR
  ↓
Click "Decline" → POST /lawyer/appointments/{id}/decline
  ↓
Update appointment.status = cancelled
  ↓
After meeting:
  ↓
Click "Complete" → POST /lawyer/appointments/{id}/complete
  ↓
Add notes → POST /lawyer/appointments/{id}/notes
  ↓
Update appointment.status = completed
```

### 6. Admin Management Flow

```
Admin → Login at /admin/login
  ↓
Navigate to /admin/dashboard
  ↓
Frontend GET /admin/dashboard
  ↓
Backend returns cached stats:
  - Total users
  - Total lawyers
  - Pending lawyer approvals
  - Total revenue
  ↓
View pending lawyers
  ↓
Click "Approve" → PUT /admin/lawyers/{id}/approve
  ↓
Update lawyer.status = approved
  ↓
Clear cache
  ↓
Lawyer can now accept appointments
```

### 7. FAQ Management Flow

```
Admin → Navigate to /admin/faqs
  ↓
Frontend GET /admin/faqs
  ↓
Display FAQ table with search/filter
  ↓
Admin clicks "Add FAQ"
  ↓
Modal opens
  ↓
Admin fills form:
  - Select category
  - Enter question
  - Enter answer
  - Set type (static/dynamic)
  - Set order
  - Toggle active status
  ↓
Frontend POST /admin/faqs
  ↓
Backend creates FAQ record
  ↓
Return to FAQ list
  ↓
Public users can now view FAQ
```

### 8. Public FAQ Access Flow

```
User → Navigate to /faqs
  ↓
Frontend GET /faqs
  ↓
Backend returns active FAQs grouped by category
  ↓
Display FAQ list with categories
  ↓
User clicks FAQ
  ↓
Frontend GET /faqs/{id}
  ↓
Backend:
  - Increments view count
  - Returns FAQ with full answer
  ↓
Display FAQ detail
  ↓
OR
  ↓
User filters by category
  ↓
Frontend GET /faqs/category/{slug}
  ↓
Display FAQs for that category only
```

---

## Authentication & Security

### Token-Based Authentication (Laravel Sanctum)

**Token Creation:**
- Generated on login/registration
- Stored in `personal_access_tokens` table
- Plain text token returned to client once
- Hashed version stored in database

**Token Storage:**
- Client stores in localStorage
- Key: `token`
- Also stores user object

**Token Usage:**
- Added to Authorization header: `Bearer {token}`
- Axios interceptor handles automatically
- Validated by Sanctum middleware

**Token Revocation:**
- On logout, token deleted from database
- Client clears localStorage

### Authorization Layers

**User Authorization:**
- `auth:sanctum` middleware validates token
- `$request->user()` returns authenticated user
- Ownership checks (e.g., appointments belong to user)

**Lawyer Authorization:**
- `EnsureLawyer` middleware
- Checks if user has lawyer profile
- Verifies lawyer.status = approved

**Admin Authorization:**
- `EnsureAdmin` middleware
- Validates Admin model (not User)
- Checks is_active = true

### Security Best Practices

**Password Security:**
- Bcrypt hashing
- Minimum 8 characters
- Confirmation required on registration

**Data Protection:**
- Hidden fields in models (password, remember_token)
- Only return necessary data
- Validate all inputs

**API Security:**
- CORS configuration
- CSRF protection (for web routes)
- Rate limiting
- SQL injection prevention (Eloquent)

**Payment Security:**
- PayMongo handles card data (PCI compliant)
- Webhook signature verification
- Amount validation

---

## Payment Integration (PayMongo)

### Supported Payment Methods
1. **Credit/Debit Cards** - Direct card payment
2. **GCash** - E-wallet redirect
3. **PayMaya** - E-wallet redirect

### Payment Flow Architecture

**Card Payment:**
1. Create payment intent
2. Create payment method (card details)
3. Attach method to intent
4. Payment processed immediately
5. Webhook confirms payment

**GCash/PayMaya:**
1. Create source
2. Redirect to PayMongo checkout
3. User completes payment
4. Redirect back to callback
5. Retrieve source status
6. Create charge if chargeable

### PayMongo API Integration

**Base URL:** `https://api.paymongo.com/v1`

**Authentication:** Basic Auth with secret key

**Key Endpoints:**
- `POST /payment_intents` - Create intent
- `POST /payment_methods` - Create method
- `POST /payment_intents/{id}/attach` - Attach method
- `POST /sources` - Create source
- `GET /sources/{id}` - Retrieve source
- `POST /sources/{id}/charges` - Create charge

**Amount Format:**
- All amounts in centavos (multiply by 100)
- Example: 1000.00 PHP → 100000 centavos

**Metadata:**
- All values must be strings
- Used for appointment tracking
- Returned in webhooks

### Webhook Handling

**Endpoint:** `POST /auth/webhooks/paymongo`

**Events:**
- `payment.paid` - Payment successful
- `payment.failed` - Payment failed
- `source.chargeable` - E-wallet payment ready

**Verification:**
- Check `paymongo-signature` header
- Validate against secret key

**Processing:**
1. Parse event data
2. Extract appointment_id from metadata
3. Update appointment status
4. Send receipt email
5. Return 200 OK

---

## Email System

### Mail Configuration

**Driver:** SMTP (configurable)
**Templates:** Blade views in `resources/views/emails/`

### Email Types

#### 1. Appointment Booked
**Trigger:** Appointment created
**Recipients:** Client + Lawyer
**Content:**
- Appointment details
- Date and time
- Meeting type
- Client notes

#### 2. Appointment Reminder
**Trigger:** Scheduled command (24 hours before)
**Recipients:** Client + Lawyer
**Content:**
- Reminder message
- Appointment details
- Meeting information

#### 3. Payment Receipt
**Trigger:** Payment confirmation
**Recipients:** Client
**Content:**
- Amount paid
- Payment method
- Payment reference
- Appointment details

### Scheduled Commands

**Command:** `SendAppointmentReminders`
**Schedule:** Daily at 9:00 AM
**Logic:**
- Find appointments 24 hours from now
- Send reminder emails
- Mark as reminded

**Run Scheduler:**
```bash
php artisan schedule:work
```

---

## Development Guide

### Backend Setup

#### Requirements
- PHP 8.2+
- Composer
- SQLite or MySQL

#### Installation
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

#### Environment Variables (.env)
```env
APP_NAME=LegalKonect
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

FRONTEND_URL=http://localhost:3000

DB_CONNECTION=sqlite
# OR for MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=legalkonect
# DB_USERNAME=root
# DB_PASSWORD=

MAIL_MAILER=resend
RESEND_KEY=your_resend_api_key
MAIL_FROM_ADDRESS="onboarding@resend.dev"
MAIL_FROM_NAME="LegalKonect"

SANCTUM_STATEFUL_DOMAINS=localhost:3000

PAYMONGO_SECRET_KEY=sk_test_xxxxx
```

#### Development Commands
```bash
# Start development server
php artisan serve

# Run migrations
php artisan migrate

# Reset database with seed data
php artisan migrate:fresh --seed

# Run tests
php artisan test

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Run queue worker
php artisan queue:work

# Run scheduler
php artisan schedule:work

# Interactive shell
php artisan tinker
```

#### Composer Scripts (composer.json)
```bash
# Start all services
composer run dev

# Individual services
composer run serve    # API server
composer run queue    # Queue worker
composer run logs     # Tail logs
composer run vite     # Frontend assets
```

---

### Frontend Setup

#### Requirements
- Node.js 16+
- NPM

#### Installation
```bash
cd frontend
npm install
npm start
```

#### Environment Variables (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

#### Development Commands
```bash
# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

#### Project Structure
```
frontend/src/
├── components/       # Reusable components
├── context/          # React context providers
├── pages/            # Page components
│   ├── admin/        # Admin pages
│   └── lawyer/       # Lawyer pages
├── services/         # API services
├── App.tsx           # Root component
├── index.tsx         # Entry point
└── index.css         # Global styles
```

---

### Testing

#### Backend Tests
```bash
cd backend
php artisan test
```

**Test Structure:**
- Feature tests in `tests/Feature/`
- Unit tests in `tests/Unit/`

**Example Test:**
```php
public function test_user_can_login()
{
    $user = User::factory()->create([
        'password' => bcrypt('password123')
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password123'
    ]);

    $response->assertStatus(200)
             ->assertJsonStructure(['user', 'token']);
}
```

#### Frontend Tests
```bash
cd frontend
npm test
```

**Test Structure:**
- Component tests alongside components
- Use React Testing Library

**Example Test:**
```typescript
test('renders login form', () => {
  render(<Login />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

---

### Database Management

#### Migrations
```bash
# Create migration
php artisan make:migration create_table_name

# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Reset database
php artisan migrate:fresh

# Reset and seed
php artisan migrate:fresh --seed
```

#### Seeders
```bash
# Create seeder
php artisan make:seeder TableNameSeeder

# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=LawyersTableSeeder
```

#### Database Console
```bash
# SQLite
sqlite3 database/database.sqlite

# Tinker (Laravel shell)
php artisan tinker
>>> User::count()
>>> Appointment::where('status', 'pending')->get()
```

---

## Deployment Notes

### Production Checklist

#### Backend
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Generate new `APP_KEY`
- [ ] Configure production database (MySQL)
- [ ] Set up mail service (Mailgun, SendGrid, etc.)
- [ ] Configure CORS for production domain
- [ ] Set up HTTPS
- [ ] Configure queue worker (Supervisor)
- [ ] Set up cron for scheduler
- [ ] Enable cache (Redis)
- [ ] Change default admin password
- [ ] Set production PayMongo keys

#### Frontend
- [ ] Update `REACT_APP_API_URL` to production API
- [ ] Update Google Maps API key (with domain restrictions)
- [ ] Build production bundle (`npm run build`)
- [ ] Configure CDN (optional)
- [ ] Set up HTTPS
- [ ] Configure environment variables in hosting service

#### Security
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Configure backup system
- [ ] Enable SSL/TLS
- [ ] Secure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure error reporting

---

### Hosting Recommendations

#### Backend
- **VPS:** DigitalOcean, AWS EC2, Linode
- **Platform:** Laravel Forge, Vapor
- **Shared:** SiteGround, A2 Hosting

#### Frontend
- **Static Hosting:** Vercel, Netlify, Cloudflare Pages
- **CDN:** Cloudflare, AWS CloudFront

#### Database
- **Managed:** AWS RDS, DigitalOcean Managed Databases
- **Self-hosted:** MySQL on VPS

---

### Environment Variables Reference

#### Backend (.env)
```env
# Application
APP_NAME=LegalKonect
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=legalkonect_prod
DB_USERNAME=db_user
DB_PASSWORD=strong_password

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=your_mailgun_username
MAIL_PASSWORD=your_mailgun_password
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=LegalKonect

# Sanctum
SANCTUM_STATEFUL_DOMAINS=yourdomain.com

# PayMongo
PAYMONGO_SECRET_KEY=sk_live_xxxxx

# Cache
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Queue
QUEUE_CONNECTION=redis
```

#### Frontend (.env)
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_GOOGLE_MAPS_KEY=your_production_google_maps_key
```

---

## File Location Quick Reference

### Backend Files

**Models:**
- [backend/app/Models/User.php](backend/app/Models/User.php)
- [backend/app/Models/Lawyer.php](backend/app/Models/Lawyer.php)
- [backend/app/Models/Appointment.php](backend/app/Models/Appointment.php)
- [backend/app/Models/Admin.php](backend/app/Models/Admin.php)
- [backend/app/Models/LawyerAvailability.php](backend/app/Models/LawyerAvailability.php)
- [backend/app/Models/Specialization.php](backend/app/Models/Specialization.php)

**Controllers:**
- [backend/app/Http/Controllers/AuthController.php](backend/app/Http/Controllers/AuthController.php)
- [backend/app/Http/Controllers/LawyerController.php](backend/app/Http/Controllers/LawyerController.php)
- [backend/app/Http/Controllers/AppointmentController.php](backend/app/Http/Controllers/AppointmentController.php)
- [backend/app/Http/Controllers/PaymentController.php](backend/app/Http/Controllers/PaymentController.php)
- [backend/app/Http/Controllers/LawyerDashboardController.php](backend/app/Http/Controllers/LawyerDashboardController.php)
- [backend/app/Http/Controllers/AdminAuthController.php](backend/app/Http/Controllers/AdminAuthController.php)
- [backend/app/Http/Controllers/AdminDashboardController.php](backend/app/Http/Controllers/AdminDashboardController.php)

**Middleware:**
- [backend/app/Http/Middleware/EnsureLawyer.php](backend/app/Http/Middleware/EnsureLawyer.php)
- [backend/app/Http/Middleware/EnsureAdmin.php](backend/app/Http/Middleware/EnsureAdmin.php)

**Services:**
- [backend/app/Services/PaymongoService.php](backend/app/Services/PaymongoService.php)

**Routes:**
- [backend/routes/api.php](backend/routes/api.php)

**Configuration:**
- [backend/config/app.php](backend/config/app.php)
- [backend/config/database.php](backend/config/database.php)
- [backend/config/mail.php](backend/config/mail.php)
- [backend/config/sanctum.php](backend/config/sanctum.php)
- [backend/config/services.php](backend/config/services.php)

### Frontend Files

**Pages:**
- [frontend/src/pages/Home.tsx](frontend/src/pages/Home.tsx)
- [frontend/src/pages/Login.tsx](frontend/src/pages/Login.tsx)
- [frontend/src/pages/Register.tsx](frontend/src/pages/Register.tsx)
- [frontend/src/pages/Dashboard.tsx](frontend/src/pages/Dashboard.tsx)
- [frontend/src/pages/Profile.tsx](frontend/src/pages/Profile.tsx)
- [frontend/src/pages/LawyerSearch.tsx](frontend/src/pages/LawyerSearch.tsx)
- [frontend/src/pages/LawyerDetail.tsx](frontend/src/pages/LawyerDetail.tsx)
- [frontend/src/pages/Appointments.tsx](frontend/src/pages/Appointments.tsx)
- [frontend/src/pages/PaymentPage.tsx](frontend/src/pages/PaymentPage.tsx)

**Lawyer Pages:**
- [frontend/src/pages/lawyer/LawyerLayout.tsx](frontend/src/pages/lawyer/LawyerLayout.tsx)
- [frontend/src/pages/lawyer/LawyerDashboard.tsx](frontend/src/pages/lawyer/LawyerDashboard.tsx)
- [frontend/src/pages/lawyer/LawyerAppointments.tsx](frontend/src/pages/lawyer/LawyerAppointments.tsx)
- [frontend/src/pages/lawyer/LawyerEarnings.tsx](frontend/src/pages/lawyer/LawyerEarnings.tsx)

**Admin Pages:**
- [frontend/src/pages/admin/AdminLogin.tsx](frontend/src/pages/admin/AdminLogin.tsx)
- [frontend/src/pages/admin/AdminDashboard.tsx](frontend/src/pages/admin/AdminDashboard.tsx)
- [frontend/src/pages/admin/AdminOverview.tsx](frontend/src/pages/admin/AdminOverview.tsx)
- [frontend/src/pages/admin/AdminLawyers.tsx](frontend/src/pages/admin/AdminLawyers.tsx)
- [frontend/src/pages/admin/AdminUsers.tsx](frontend/src/pages/admin/AdminUsers.tsx)
- [frontend/src/pages/admin/AdminPayments.tsx](frontend/src/pages/admin/AdminPayments.tsx)
- [frontend/src/pages/admin/AdminAnalytics.tsx](frontend/src/pages/admin/AdminAnalytics.tsx)
- [frontend/src/pages/admin/AdminFaqs.tsx](frontend/src/pages/admin/AdminFaqs.tsx)

**Components:**
- [frontend/src/components/Navigation.tsx](frontend/src/components/Navigation.tsx)
- [frontend/src/components/ProtectedRoute.tsx](frontend/src/components/ProtectedRoute.tsx)
- [frontend/src/components/LawyerCard.tsx](frontend/src/components/LawyerCard.tsx)
- [frontend/src/components/BookingModal.tsx](frontend/src/components/BookingModal.tsx)
- [frontend/src/components/LocationPicker.tsx](frontend/src/components/LocationPicker.tsx)

**Services:**
- [frontend/src/services/api.ts](frontend/src/services/api.ts)
- [frontend/src/services/lawyerApi.ts](frontend/src/services/lawyerApi.ts)
- [frontend/src/services/adminApi.ts](frontend/src/services/adminApi.ts)
- [frontend/src/services/locationService.ts](frontend/src/services/locationService.ts)

**Context:**
- [frontend/src/context/AuthContext.tsx](frontend/src/context/AuthContext.tsx)

**Root:**
- [frontend/src/App.tsx](frontend/src/App.tsx)
- [frontend/src/index.tsx](frontend/src/index.tsx)

---

## Additional Notes

### Default Credentials

**Admin Account:**
- Email: `admin@legalkonect.com`
- Password: `admin123`
- **IMPORTANT:** Change in production!

### Common Issues & Solutions

**Issue:** CORS errors
**Solution:** Add frontend URL to `SANCTUM_STATEFUL_DOMAINS` in backend .env

**Issue:** Payment webhook not receiving events
**Solution:** Use ngrok for local testing, configure webhook URL in PayMongo dashboard

**Issue:** Email not sending
**Solution:** Check MAIL_* environment variables (RESEND_KEY), verify API key is valid at resend.com

**Issue:** Google Maps not loading
**Solution:** Verify API key, enable Maps JavaScript API and Places API

**Issue:** Token expired
**Solution:** Tokens don't expire by default in Sanctum, check if token was manually deleted

### Performance Optimization

**Backend:**
- Enable query caching for static data
- Use eager loading to prevent N+1 queries
- Index database columns (lawyer_id, user_id, appointment_date)
- Use queue for email sending

**Frontend:**
- Code splitting with React.lazy()
- Image optimization
- Debounce search inputs
- Pagination for large lists

### Future Enhancements

**Potential Features:**
- Video consultation integration (Zoom, Google Meet)
- Document upload and sharing
- Review and rating system
- Multi-language support
- Mobile app (React Native)
- Chat messaging system
- Calendar integration
- SMS notifications
- Lawyer portfolio/case studies
- Referral system
- AI-powered FAQ search and suggestions
- FAQ voting system (helpful/not helpful)
- Related FAQs suggestions
- FAQ analytics and insights

---

## Support & Resources

### Documentation
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Sanctum Documentation](https://laravel.com/docs/sanctum)
- [PayMongo API Documentation](https://developers.paymongo.com)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

### Useful Commands

**Backend:**
```bash
php artisan route:list          # List all routes
php artisan migrate:status      # Check migration status
php artisan queue:failed        # Show failed jobs
php artisan cache:clear         # Clear application cache
php artisan config:cache        # Cache configuration
php artisan view:clear          # Clear compiled views
```

**Frontend:**
```bash
npm run build                   # Production build
npm run eject                   # Eject from Create React App
npm run analyze                 # Analyze bundle size
```

---

**Document Version:** 1.1
**Last Updated:** 2025-10-22
**Maintainer:** Development Team

**Recent Changes:**
- Added FAQ Management system
- Added FAQ Categories
- Added Admin FAQ management interface
- Added public FAQ access endpoints
- Updated database schema with FAQ tables
- Added FAQ TypeScript interfaces

---

*This reference document is a living document and should be updated as the project evolves.*
