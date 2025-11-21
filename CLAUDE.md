# CLAUDE.md - AI Assistant Guide for LegalKonect

## Table of Contents
1. [Project Overview](#project-overview)
2. [Quick Reference](#quick-reference)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Directory Structure](#directory-structure)
5. [Development Workflows](#development-workflows)
6. [Database Schema](#database-schema)
7. [API Conventions](#api-conventions)
8. [Key Features Implementation](#key-features-implementation)
9. [Code Patterns & Conventions](#code-patterns--conventions)
10. [Testing Guidelines](#testing-guidelines)
11. [Common Tasks](#common-tasks)
12. [Security Considerations](#security-considerations)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

**LegalKonect** is a full-stack legal consultation platform connecting clients with lawyers. It's built as a monorepo with separated backend (Laravel REST API) and frontend (React SPA).

### Core Functionality
- Client registration with geolocation
- Lawyer discovery with distance-based search
- Appointment booking with multiple meeting types
- Payment processing (PayMongo - card, GCash, PayMaya)
- Case management with todo tracking
- Google Calendar integration
- Review and rating system
- FAQ system with AI chatbot interface
- Admin panel for platform management

### Key Metrics
- **Backend:** Laravel 12.x, PHP 8.2+, 16 controllers (~4,247 LOC), 12 models, 100+ API endpoints
- **Frontend:** React 19.1.1, TypeScript, 28 pages (~12,356 LOC), 17 components
- **Database:** 22 migrations, SQLite (dev), MySQL-compatible

---

## Quick Reference

### Essential Files
- **Backend entry:** `/backend/routes/api.php` - All API routes (228 lines)
- **Frontend entry:** `/frontend/src/App.tsx` - Main routing and app structure
- **Auth:** `/backend/app/Http/Middleware/` - Authentication middleware
- **Services:** `/backend/app/Services/` - PayMongo, Google Calendar, Google Auth
- **Models:** `/backend/app/Models/` - 12 Eloquent models
- **API client:** `/frontend/src/services/api.ts` - Axios instance with interceptors

### Default Credentials
```bash
# Admin
Email: admin@legalkonect.com
Password: admin123

# Lawyers (see LAWYER_CREDENTIALS.md for all 15)
Password: Password123!
```

### Quick Start
```bash
# Install all dependencies
npm run install:all

# Start both servers (from root)
npm start

# Or individually
cd backend && php artisan serve    # Backend: http://localhost:8000
cd frontend && npm start            # Frontend: http://localhost:3000
```

### Environment Setup
```bash
# Backend
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed

# Frontend (create .env in /frontend/)
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_GOOGLE_MAPS_KEY=your_key_here
```

---

## Architecture & Tech Stack

### Architecture Pattern
```
┌─────────────────────────────────────────────────┐
│                   Client Browser                │
│              (React 19.1.1 + TypeScript)        │
└────────────────────┬────────────────────────────┘
                     │ HTTP/JSON
                     │ Bearer Token Auth
┌────────────────────▼────────────────────────────┐
│              Laravel 12 REST API                │
│           (MVC + Service Layer Pattern)         │
├─────────────────────────────────────────────────┤
│  Controllers → Services → Models → Database     │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼────┐ ┌─────▼─────────┐
│   SQLite/    │ │Google │ │   PayMongo    │
│    MySQL     │ │ APIs  │ │   Payment     │
└──────────────┘ └───────┘ └───────────────┘
```

### Technology Stack

#### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | 8.2+ | Server language |
| Laravel | 12.x | API framework |
| Laravel Sanctum | 4.2 | Token authentication |
| Eloquent ORM | Built-in | Database abstraction |
| Guzzle HTTP | 7.10 | HTTP client |
| Google API Client | 2.18 | Calendar integration |
| PayMongo PHP | Latest | Payment processing |
| PHPUnit | 11.5.3 | Testing |

#### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI framework |
| TypeScript | 4.9.5 | Type safety |
| React Router | 7.9.3 | Client-side routing |
| Axios | 1.12.2 | HTTP client |
| Tailwind CSS | 3.4.1 | Styling framework |
| Lucide React | Latest | Icon library |
| Recharts | 3.3.0 | Analytics charts |

#### External Services
- **Google Maps API** - Location services, distance calculation
- **Google Calendar API** - Appointment synchronization
- **Google OAuth 2.0** - Third-party authentication
- **PayMongo API** - Payment processing (PH-specific)

---

## Directory Structure

### Root Structure
```
/home/user/LegalKonect/
├── backend/              # Laravel REST API
├── frontend/             # React SPA
├── vendor/               # PHP dependencies (Composer)
├── node_modules/         # JS dependencies (root-level)
├── .git/                 # Git repository
├── .gitignore           # Git ignore rules
├── package.json         # Root NPM (concurrently)
├── composer.json        # Root Composer (CORS)
└── *.md                 # Documentation files
```

### Backend Structure (`/backend/`)
```
backend/
├── app/
│   ├── Console/                    # Artisan commands
│   ├── Http/
│   │   ├── Controllers/           # 16 controllers (4,247 LOC)
│   │   │   ├── Admin/            # AdminController, AdminFaqController
│   │   │   ├── AppointmentController.php
│   │   │   ├── AuthController.php
│   │   │   ├── CaseController.php
│   │   │   ├── FaqController.php
│   │   │   ├── GoogleAuthController.php
│   │   │   ├── GoogleCalendarController.php
│   │   │   ├── LawyerAvailabilityController.php
│   │   │   ├── LawyerCaseController.php
│   │   │   ├── LawyerController.php
│   │   │   ├── PaymentController.php
│   │   │   ├── ReviewController.php
│   │   │   ├── SpecializationController.php
│   │   │   └── UserController.php
│   │   └── Middleware/            # Auth middleware
│   │       ├── LawyerMiddleware.php
│   │       └── AdminMiddleware.php
│   ├── Mail/                      # Email templates
│   ├── Models/                    # 12 Eloquent models
│   │   ├── Admin.php
│   │   ├── Appointment.php
│   │   ├── CaseModel.php
│   │   ├── CaseTodo.php
│   │   ├── Faq.php
│   │   ├── FaqCategory.php
│   │   ├── Lawyer.php
│   │   ├── LawyerAvailability.php
│   │   ├── LawyerUnavailableDate.php
│   │   ├── Review.php
│   │   ├── Specialization.php
│   │   └── User.php
│   ├── Providers/                 # Service providers
│   └── Services/                  # Business logic
│       ├── PaymongoService.php   # Payment processing
│       ├── GoogleCalendarService.php
│       └── GoogleAuthService.php
├── config/                        # Configuration files
│   ├── app.php
│   ├── database.php
│   ├── sanctum.php
│   ├── services.php              # Google, PayMongo keys
│   └── cors.php
├── database/
│   ├── migrations/               # 22 migration files
│   └── seeders/                  # 7 seeders
│       ├── AdminSeeder.php
│       ├── DatabaseSeeder.php
│       ├── FaqCategorySeeder.php
│       ├── FaqSeeder.php
│       ├── LawyerSeeder.php
│       ├── SpecializationSeeder.php
│       └── UserSeeder.php
├── routes/
│   └── api.php                   # All API routes (228 lines)
├── storage/                      # Logs, cache, uploads
├── tests/                        # PHPUnit tests
│   ├── Feature/
│   └── Unit/
├── .env.example                  # Environment template
├── artisan                       # CLI tool
└── composer.json                 # PHP dependencies
```

### Frontend Structure (`/frontend/`)
```
frontend/
├── public/                       # Static assets
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/              # 17 reusable components
│   │   ├── Navigation.tsx       # Main navigation
│   │   ├── ProtectedRoute.tsx   # Auth wrapper
│   │   ├── LawyerCard.tsx
│   │   ├── BookingModal.tsx
│   │   ├── FAQChatbot.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── CaseStatusTracker.tsx
│   │   └── ...
│   ├── context/                 # State management
│   │   ├── AuthContext.tsx     # Global auth state
│   │   ├── LawyersContext.tsx  # Cached lawyer data
│   │   └── LoadingContext.tsx  # Global loading
│   ├── data/
│   │   └── faqData.ts          # Static FAQ data
│   ├── hooks/
│   │   └── useOptimizedFetch.ts # Performance hook
│   ├── pages/                   # 28 page components (12,356 LOC)
│   │   ├── admin/              # 7 admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminLawyers.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   ├── AdminAppointments.tsx
│   │   │   ├── AdminPayments.tsx
│   │   │   ├── AdminAnalytics.tsx
│   │   │   └── AdminFAQs.tsx
│   │   ├── lawyer/             # 8 lawyer pages
│   │   │   ├── LawyerDashboard.tsx
│   │   │   ├── LawyerAppointments.tsx
│   │   │   ├── LawyerEarnings.tsx
│   │   │   ├── LawyerCalendar.tsx
│   │   │   ├── LawyerCases.tsx
│   │   │   ├── LawyerProfile.tsx
│   │   │   ├── LawyerSchedule.tsx
│   │   │   └── PendingApproval.tsx
│   │   └── *.tsx               # Public/client pages
│   │       ├── Home.tsx
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── ClientDashboard.tsx
│   │       ├── LawyerSearch.tsx
│   │       ├── LawyerProfile.tsx
│   │       ├── Appointments.tsx
│   │       ├── Cases.tsx
│   │       └── ...
│   ├── services/                # API services
│   │   ├── api.ts              # Axios instance + interceptors
│   │   ├── adminApi.ts         # Admin API calls
│   │   ├── lawyerApi.ts        # Lawyer API calls
│   │   ├── locationService.ts  # Geolocation
│   │   └── cacheService.ts     # Frontend caching
│   ├── types/
│   │   └── lawyer.ts           # TypeScript interfaces
│   ├── App.tsx                 # Main app component (175 LOC)
│   ├── index.tsx               # Entry point
│   └── index.css               # Global styles + Tailwind
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## Development Workflows

### Starting Development

#### Option 1: Run Everything (Recommended)
```bash
# From project root
npm start
# Starts: Backend (8000) + Frontend (3000) concurrently
```

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
cd backend
php artisan serve                 # http://localhost:8000

# Terminal 2 - Frontend
cd frontend
npm start                         # http://localhost:3000

# Terminal 3 - Queue Worker (optional, for emails/jobs)
cd backend
php artisan queue:work

# Terminal 4 - Scheduler (optional, for reminders)
cd backend
php artisan schedule:work
```

#### Option 3: Backend Development Suite
```bash
cd backend
composer run dev
# Runs concurrently:
# - php artisan serve
# - php artisan queue:listen
# - php artisan pail (log viewer)
# - npm run dev (if frontend assets)
```

### Database Operations

```bash
cd backend

# Fresh migration + seed (reset all data)
php artisan migrate:fresh --seed

# Run migrations only
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Seed specific seeder
php artisan db:seed --class=LawyerSeeder

# Interactive database shell
php artisan tinker
```

### Cache Management

```bash
cd backend

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Cache config (production)
php artisan config:cache
php artisan route:cache
```

### Testing

```bash
# Backend tests
cd backend
php artisan test
# or
vendor/bin/phpunit

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend (Laravel Pint - code styling)
cd backend
./vendor/bin/pint

# Check without fixing
./vendor/bin/pint --test
```

---

## Database Schema

### Core Models & Relationships

#### User Model
```php
// /backend/app/Models/User.php
- id, name, email, password, phone
- latitude, longitude, address (geolocation)
- google_id, google_token, google_refresh_token (OAuth)
- profile_picture, status (active/suspended)
- created_at, updated_at

Relationships:
- hasOne(Lawyer)
- hasMany(Appointment)
- hasMany(Review)
- hasMany(CaseModel)
```

#### Lawyer Model
```php
// /backend/app/Models/Lawyer.php
- id, user_id
- first_name, last_name, bio, license_number
- years_experience, hourly_rate
- office_address, office_latitude, office_longitude
- rating, total_reviews, is_available
- is_approved (pending/approved/rejected)
- google_calendar_access_token, google_calendar_refresh_token
- profile_photo, created_at, updated_at

Relationships:
- belongsTo(User)
- belongsToMany(Specialization) via lawyer_specializations
- hasMany(Appointment)
- hasMany(LawyerAvailability)
- hasMany(LawyerUnavailableDate)
- hasMany(Review)
- hasMany(CaseModel)

Scopes:
- approved() - Only approved lawyers
- available() - Only available lawyers

Helper Methods:
- pendingAppointments()
- upcomingAppointments()
- totalEarnings()
```

#### Appointment Model
```php
// /backend/app/Models/Appointment.php
- id, user_id, lawyer_id
- appointment_date, appointment_time, duration_minutes
- status (pending/confirmed/completed/cancelled)
- meeting_type (in-person/video/phone)
- notes, reason_for_visit
- consultation_fee, payment_status (pending/paid/refunded)
- payment_method (card/gcash/paymaya)
- payment_intent_id, paymongo_payment_id
- google_event_id
- cancelled_at, cancellation_reason
- created_at, updated_at

Relationships:
- belongsTo(User)
- belongsTo(Lawyer)

Scopes:
- upcoming() - Future appointments
- past() - Past appointments
```

#### CaseModel
```php
// /backend/app/Models/CaseModel.php
- id, appointment_id, user_id, lawyer_id
- title, description, case_type
- status (pending/ongoing/closed)
- lawyer_updates (JSON)
- resolution_summary
- started_at, closed_at
- created_at, updated_at

Relationships:
- belongsTo(Appointment)
- belongsTo(User) - client
- belongsTo(Lawyer)
- hasMany(CaseTodo)

Attributes:
- status_label (formatted status)
- progress_percentage (0-100)

Scopes:
- pending(), ongoing(), closed()
- handledBy($lawyerId)
```

#### Specialization Model
```php
// /backend/app/Models/Specialization.php
- id, name, description, icon, is_active
- created_at, updated_at

Relationships:
- belongsToMany(Lawyer) via lawyer_specializations

Default Specializations (see database/seeders/SpecializationSeeder.php):
1. Family Law
2. Criminal Defense
3. Corporate Law
4. Real Estate Law
5. Labor and Employment Law
6. Intellectual Property Law
7. Tax Law
8. Immigration Law
9. Personal Injury Law
10. Civil Litigation
```

#### Review Model
```php
// /backend/app/Models/Review.php
- id, user_id, lawyer_id, appointment_id
- rating (1-5), comment
- created_at, updated_at

Relationships:
- belongsTo(User)
- belongsTo(Lawyer)
- belongsTo(Appointment)

Rules:
- One review per appointment
- Only for completed appointments
- Rating must be 1-5
```

#### Additional Models
- **Admin** - Platform administrators
- **Faq** - FAQ entries with categories
- **FaqCategory** - FAQ categorization
- **LawyerAvailability** - Weekly schedules (day_of_week, start_time, end_time)
- **LawyerUnavailableDate** - Blocked dates
- **CaseTodo** - Case task items

### Database Migrations

Key migrations in `/backend/database/migrations/`:
```
2024_01_01_000000_create_users_table.php
2024_01_01_000001_create_lawyers_table.php
2024_01_01_000002_create_specializations_table.php
2024_01_01_000003_create_lawyer_specializations_table.php
2024_01_01_000004_create_appointments_table.php
2024_01_01_000005_create_reviews_table.php
2024_01_01_000006_create_lawyer_availability_table.php
2024_01_01_000007_create_lawyer_unavailable_dates_table.php
2024_01_01_000008_create_case_models_table.php
2024_01_01_000009_create_case_todos_table.php
2024_01_01_000010_create_faqs_table.php
2024_01_01_000011_create_faq_categories_table.php
2024_01_01_000012_create_admins_table.php
... (22 total)
```

---

## API Conventions

### Request/Response Format

#### Success Response
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

#### Error Response
```json
{
  "message": "Error description",
  "errors": {
    "field": ["Validation error 1", "Validation error 2"]
  }
}
```

### Authentication

All protected routes require Sanctum token:

```http
GET /api/appointments
Authorization: Bearer {token}
```

**Frontend Implementation:**
```typescript
// /frontend/src/services/api.ts
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

// Request interceptor adds token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Route Patterns

```php
// /backend/routes/api.php

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/lawyers', [LawyerController::class, 'index']);

// Protected routes (auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'show']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
});

// Lawyer-only routes (auth:sanctum + lawyer middleware)
Route::middleware(['auth:sanctum', 'lawyer'])->prefix('lawyer')->group(function () {
    Route::get('/dashboard', [LawyerController::class, 'dashboard']);
});

// Admin routes (auth:sanctum + admin middleware)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard/stats', [AdminController::class, 'stats']);
});
```

### Middleware

**LawyerMiddleware** (`/backend/app/Http/Middleware/LawyerMiddleware.php`):
```php
// Ensures authenticated user has an approved lawyer profile
public function handle($request, Closure $next)
{
    if (!$request->user()->lawyer || !$request->user()->lawyer->is_approved) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    return $next($request);
}
```

**AdminMiddleware** (`/backend/app/Http/Middleware/AdminMiddleware.php`):
```php
// Validates admin authentication token
public function handle($request, Closure $next)
{
    $token = $request->bearerToken();
    $admin = Admin::where('api_token', $token)->first();

    if (!$admin) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $request->merge(['admin' => $admin]);
    return $next($request);
}
```

### Validation Examples

```php
// In controller methods
$validated = $request->validate([
    'appointment_date' => 'required|date|after:today',
    'appointment_time' => 'required|date_format:H:i',
    'lawyer_id' => 'required|exists:lawyers,id',
    'meeting_type' => 'required|in:in-person,video,phone',
]);
```

### Resource Loading Patterns

```php
// Prevent N+1 queries with eager loading
$lawyer = Lawyer::with('specializations', 'reviews.user')
    ->findOrFail($id);

// Load relationships conditionally
$appointments = Appointment::query()
    ->with('user', 'lawyer.specializations')
    ->where('lawyer_id', $lawyerId)
    ->orderBy('appointment_date', 'desc')
    ->paginate(20);
```

---

## Key Features Implementation

### 1. User Authentication & Google OAuth

**Registration Flow:**
```
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "09123456789",
  "latitude": 14.5995,
  "longitude": 120.9842,
  "address": "Manila, Philippines"
}

Response:
{
  "user": { ... },
  "token": "1|abc123..."
}
```

**Google OAuth Flow:**
```
1. GET /api/auth/google/url
   → Returns Google OAuth URL

2. User authorizes → Google redirects to callback

3. GET /api/auth/google/callback?code=...
   → Backend exchanges code for user info
   → Creates/updates user
   → Returns token

4. POST /api/auth/google/login
   { "google_id": "..." }
   → Returns token for existing user
```

**Implementation:** `/backend/app/Http/Controllers/AuthController.php`

### 2. Lawyer Discovery & Search

**Search API:**
```
GET /api/lawyers?specialization=family-law&latitude=14.5995&longitude=120.9842&max_distance=10

Query Parameters:
- specialization (string) - Filter by specialization
- latitude (float) - User's latitude
- longitude (float) - User's longitude
- max_distance (int) - Max distance in km
- min_rating (float) - Minimum rating
- max_rate (int) - Maximum hourly rate
- available (boolean) - Only available lawyers
```

**Distance Calculation:**
```php
// Uses Haversine formula
$distance = DB::raw("
    (6371 * acos(cos(radians(?))
    * cos(radians(office_latitude))
    * cos(radians(office_longitude) - radians(?))
    + sin(radians(?))
    * sin(radians(office_latitude))))
");
```

**Implementation:** `/backend/app/Http/Controllers/LawyerController.php:index()`

### 3. Appointment Booking

**Booking Flow:**
```
1. Check available slots:
   GET /api/lawyers/{id}/available-slots?date=2024-01-15

2. Create appointment:
   POST /api/appointments
   {
     "lawyer_id": 1,
     "appointment_date": "2024-01-15",
     "appointment_time": "14:00",
     "duration_minutes": 60,
     "meeting_type": "video",
     "reason_for_visit": "Contract review"
   }

3. Pay for appointment:
   POST /api/appointments/{id}/payment-intent

4. Complete payment (triggers webhook)

5. Lawyer confirms:
   POST /api/lawyer/appointments/{id}/accept
```

**Availability Logic:**
```php
// /backend/app/Http/Controllers/LawyerController.php:availableSlots()

1. Get lawyer's weekly schedule (LawyerAvailability)
2. Get unavailable dates (LawyerUnavailableDate)
3. Get existing appointments for the date
4. Calculate open time slots (30-min intervals)
5. Return available slots
```

**Implementation:**
- Controller: `/backend/app/Http/Controllers/AppointmentController.php`
- Frontend: `/frontend/src/components/BookingModal.tsx`

### 4. Payment Processing (PayMongo)

**Payment Flow:**
```
1. Create Payment Intent:
   POST /api/appointments/{id}/payment-intent
   → Returns client_key for PayMongo

2A. Card Payment:
    POST /api/payment-methods
    {
      "type": "card",
      "details": { ... }
    }

    POST /api/payments/attach
    {
      "payment_method_id": "pm_...",
      "payment_intent_id": "pi_..."
    }

2B. E-wallet (GCash/PayMaya):
    POST /api/payment-sources
    {
      "type": "gcash",
      "amount": 1000
    }
    → Returns checkout_url
    → User completes payment
    → Redirects to callback

3. Webhook confirms payment:
   POST /api/auth/webhooks/paymongo
   → Updates payment_status to 'paid'
   → Sends email receipt
```

**Service:** `/backend/app/Services/PaymongoService.php`

**Key Methods:**
```php
PaymongoService::createPaymentIntent($amount, $metadata)
PaymongoService::createPaymentMethod($type, $details, $billingDetails)
PaymongoService::attachPaymentMethod($intentId, $methodId, $clientKey)
PaymongoService::createSource($type, $amount, $metadata)
```

### 5. Google Calendar Integration

**OAuth Flow:**
```
1. Lawyer initiates:
   GET /api/lawyer/google/auth-url
   → Returns Google OAuth URL

2. User authorizes → Google redirects

3. GET /api/google/callback?code=...&state=...
   → Exchanges code for tokens
   → Stores access_token + refresh_token (encrypted)

4. Sync appointments:
   POST /api/lawyer/google/sync-appointments
   → Creates events for all upcoming appointments
```

**Calendar Operations:**
```php
// /backend/app/Services/GoogleCalendarService.php

createEvent($appointment)
updateEvent($eventId, $appointment)
deleteEvent($eventId)
listEvents($startDate, $endDate)
syncAppointments($lawyer) // Bulk sync
```

**Token Refresh:**
```php
// Automatic refresh if token expires
if (token is expired) {
    $newToken = refreshAccessToken($refreshToken);
    $lawyer->update(['google_calendar_access_token' => $newToken]);
}
```

### 6. Case Management

**Case Creation:**
```
POST /api/lawyer/cases
{
  "appointment_id": 1,
  "title": "Contract Dispute Resolution",
  "description": "...",
  "case_type": "contract"
}
```

**Case Status Workflow:**
```
pending → ongoing → closed
```

**Case Updates:**
```php
// Lawyer adds updates (stored as JSON array)
PUT /api/lawyer/cases/{id}
{
  "lawyer_updates": [
    {
      "date": "2024-01-15",
      "update": "Initial consultation completed",
      "type": "progress"
    }
  ],
  "status": "ongoing"
}
```

**Todo Management:**
```
POST /api/lawyer/cases/{id}/todos
{
  "task": "File motion with court",
  "due_date": "2024-02-01"
}

PUT /api/cases/{caseId}/todos/{todoId}
{
  "is_completed": true
}
```

**Implementation:**
- Backend: `/backend/app/Http/Controllers/CaseController.php`
- Frontend: `/frontend/src/pages/Cases.tsx`, `/frontend/src/pages/lawyer/LawyerCases.tsx`

### 7. Review System

**Create Review:**
```
POST /api/reviews
{
  "appointment_id": 1,
  "lawyer_id": 1,
  "rating": 5,
  "comment": "Excellent service!"
}

Rules:
- Appointment must be completed
- User must be appointment owner
- One review per appointment
```

**Update Lawyer Rating:**
```php
// Triggered after review creation/update/deletion
$averageRating = $lawyer->reviews()->avg('rating');
$totalReviews = $lawyer->reviews()->count();

$lawyer->update([
    'rating' => round($averageRating, 2),
    'total_reviews' => $totalReviews
]);
```

**Implementation:** `/backend/app/Http/Controllers/ReviewController.php`

### 8. Admin Panel

**Dashboard Statistics:**
```
GET /api/admin/dashboard/stats

Response:
{
  "total_users": 150,
  "total_lawyers": 15,
  "pending_lawyers": 3,
  "total_appointments": 200,
  "total_revenue": 50000,
  "active_cases": 25
}
```

**Analytics:**
```
GET /api/admin/analytics?period=month

Response:
{
  "appointments_trend": [...],
  "revenue_trend": [...],
  "user_growth": [...],
  "popular_specializations": [...]
}
```

**User Management:**
```
PATCH /api/admin/users/{id}/suspend
PATCH /api/admin/users/{id}/activate
DELETE /api/admin/users/{id}
```

**Lawyer Approval:**
```
PATCH /api/admin/lawyers/{id}/status
{
  "is_approved": true
}
```

---

## Code Patterns & Conventions

### Backend (Laravel)

#### Naming Conventions
```php
// Models: Singular PascalCase
User, Lawyer, Appointment, CaseModel

// Controllers: Singular + Controller
UserController, AppointmentController

// Tables: Plural snake_case
users, lawyers, appointments, case_models

// Methods: camelCase
getUserAppointments(), createPaymentIntent()

// Routes: kebab-case
/api/lawyers, /api/appointments/{id}/payment-intent
```

#### Controller Pattern
```php
public function index(Request $request)
{
    // 1. Validation (if needed)
    $validated = $request->validate([...]);

    // 2. Authorization (if needed)
    if (!Gate::allows('view', $resource)) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // 3. Business logic (delegate to service if complex)
    $data = SomeService::process($validated);

    // 4. Return response
    return response()->json(['data' => $data], 200);
}
```

#### Service Layer Pattern
```php
// /backend/app/Services/PaymongoService.php

class PaymongoService
{
    private $client;
    private $secretKey;

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
        $this->client = new \GuzzleHttp\Client([
            'base_uri' => 'https://api.paymongo.com/v1/',
            'auth' => [$this->secretKey, ''],
        ]);
    }

    public function createPaymentIntent($amount, $metadata = [])
    {
        $response = $this->client->post('payment_intents', [
            'json' => [
                'data' => [
                    'attributes' => [
                        'amount' => $amount * 100,
                        'currency' => 'PHP',
                        'metadata' => $metadata,
                    ],
                ],
            ],
        ]);

        return json_decode($response->getBody(), true);
    }
}
```

#### Eloquent Patterns

**Query Scopes:**
```php
// In Model
public function scopeApproved($query)
{
    return $query->where('is_approved', true);
}

// Usage
$lawyers = Lawyer::approved()->get();
```

**Accessors (Computed Attributes):**
```php
// In Model
public function getFullNameAttribute()
{
    return "{$this->first_name} {$this->last_name}";
}

// Usage
echo $lawyer->full_name; // Calls accessor
```

**Eager Loading:**
```php
// Prevent N+1 queries
$lawyers = Lawyer::with('specializations', 'reviews')->get();

// Load conditionally
$lawyers = Lawyer::query()
    ->when($request->specialization, function($q) use ($request) {
        $q->whereHas('specializations', function($q2) use ($request) {
            $q2->where('slug', $request->specialization);
        });
    })
    ->get();
```

#### Error Handling
```php
try {
    $appointment = Appointment::findOrFail($id);
    // ... process
    return response()->json(['data' => $appointment], 200);
} catch (ModelNotFoundException $e) {
    return response()->json(['message' => 'Appointment not found'], 404);
} catch (\Exception $e) {
    Log::error('Error in AppointmentController@show', [
        'error' => $e->getMessage(),
        'appointment_id' => $id
    ]);
    return response()->json(['message' => 'Server error'], 500);
}
```

### Frontend (React + TypeScript)

#### Naming Conventions
```typescript
// Components: PascalCase
LawyerCard.tsx, BookingModal.tsx

// Hooks: camelCase with 'use' prefix
useOptimizedFetch.ts, useAuth.ts

// Utilities: camelCase
locationService.ts, cacheService.ts

// Types/Interfaces: PascalCase
interface LawyerCardProps { ... }
interface Appointment { ... }

// API functions: camelCase
getLawyers(), createAppointment()
```

#### Component Pattern
```typescript
// Functional component with TypeScript
interface LawyerCardProps {
  lawyer: Lawyer;
  onBook?: (lawyer: Lawyer) => void;
}

const LawyerCard: React.FC<LawyerCardProps> = ({ lawyer, onBook }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBookClick = () => {
    if (onBook) {
      onBook(lawyer);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Component JSX */}
    </div>
  );
};

export default LawyerCard;
```

#### Context Pattern
```typescript
// /frontend/src/context/AuthContext.tsx

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

#### API Service Pattern
```typescript
// /frontend/src/services/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Specific API functions
export const getLawyers = (params?: any) =>
  api.get('/lawyers', { params });

export const createAppointment = (data: AppointmentData) =>
  api.post('/appointments', data);
```

#### Protected Route Pattern
```typescript
// /frontend/src/components/ProtectedRoute.tsx

const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Usage in App.tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <ClientDashboard />
    </ProtectedRoute>
  }
/>
```

#### State Management Pattern
```typescript
// Use Context for global state
- AuthContext: user, login, logout
- LawyersContext: lawyers list (cached)
- LoadingContext: global loading state

// Use local state for component-specific data
const [formData, setFormData] = useState({ ... });

// Use custom hooks for reusable logic
const { data, loading, error } = useOptimizedFetch('/lawyers');
```

#### Error Handling
```typescript
try {
  const response = await api.post('/appointments', data);
  toast.success('Appointment created successfully!');
  navigate('/appointments');
} catch (error: any) {
  const message = error.response?.data?.message || 'Failed to create appointment';
  toast.error(message);
  console.error('Appointment creation error:', error);
}
```

---

## Testing Guidelines

### Backend Testing (PHPUnit)

**Test Structure:**
```
/backend/tests/
├── Feature/           # Integration tests
│   └── ExampleTest.php
└── Unit/             # Unit tests
    └── ExampleTest.php
```

**Writing Feature Tests:**
```php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_appointment()
    {
        $user = User::factory()->create();
        $lawyer = Lawyer::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/appointments', [
                'lawyer_id' => $lawyer->id,
                'appointment_date' => '2024-02-01',
                'appointment_time' => '14:00',
                'meeting_type' => 'video',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'status']]);

        $this->assertDatabaseHas('appointments', [
            'user_id' => $user->id,
            'lawyer_id' => $lawyer->id,
        ]);
    }
}
```

**Running Tests:**
```bash
cd backend

# Run all tests
php artisan test

# Run specific test
php artisan test --filter=AppointmentTest

# Run with coverage
php artisan test --coverage
```

### Frontend Testing (Jest + React Testing Library)

**Writing Component Tests:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import LawyerCard from './LawyerCard';

describe('LawyerCard', () => {
  const mockLawyer = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    rating: 4.5,
    specializations: [{ name: 'Family Law' }],
  };

  it('renders lawyer information', () => {
    render(<LawyerCard lawyer={mockLawyer} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Family Law')).toBeInTheDocument();
  });

  it('calls onBook when button clicked', () => {
    const mockOnBook = jest.fn();
    render(<LawyerCard lawyer={mockLawyer} onBook={mockOnBook} />);

    fireEvent.click(screen.getByText('Book Appointment'));
    expect(mockOnBook).toHaveBeenCalledWith(mockLawyer);
  });
});
```

**Running Tests:**
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- LawyerCard.test.tsx
```

---

## Common Tasks

### 1. Add a New Model

```bash
# Create migration + model
cd backend
php artisan make:model Document -m

# Edit migration
# database/migrations/xxxx_create_documents_table.php
Schema::create('documents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('case_id')->constrained()->onDelete('cascade');
    $table->string('filename');
    $table->string('path');
    $table->timestamps();
});

# Run migration
php artisan migrate

# Update model relationships
// app/Models/CaseModel.php
public function documents()
{
    return $this->hasMany(Document::class, 'case_id');
}
```

### 2. Add a New API Endpoint

```php
// 1. Add route (routes/api.php)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
});

// 2. Create controller
php artisan make:controller DocumentController

// 3. Implement methods
public function store(Request $request)
{
    $validated = $request->validate([
        'case_id' => 'required|exists:case_models,id',
        'file' => 'required|file|max:10240', // 10MB
    ]);

    $path = $request->file('file')->store('documents');

    $document = Document::create([
        'case_id' => $validated['case_id'],
        'filename' => $request->file('file')->getClientOriginalName(),
        'path' => $path,
    ]);

    return response()->json(['data' => $document], 201);
}
```

### 3. Add a New Frontend Page

```typescript
// 1. Create page component
// frontend/src/pages/Documents.tsx
import React from 'react';

const Documents: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Documents</h1>
      {/* Page content */}
    </div>
  );
};

export default Documents;

// 2. Add route in App.tsx
import Documents from './pages/Documents';

<Route
  path="/documents"
  element={
    <ProtectedRoute>
      <Documents />
    </ProtectedRoute>
  }
/>

// 3. Add navigation link
// frontend/src/components/Navigation.tsx
<Link to="/documents" className="nav-link">Documents</Link>
```

### 4. Add a New Seeder

```bash
# Create seeder
cd backend
php artisan make:seeder DocumentSeeder

# Edit seeder
// database/seeders/DocumentSeeder.php
public function run()
{
    Document::create([
        'case_id' => 1,
        'filename' => 'contract.pdf',
        'path' => 'documents/contract.pdf',
    ]);
}

# Add to DatabaseSeeder
// database/seeders/DatabaseSeeder.php
public function run()
{
    $this->call([
        // ... existing seeders
        DocumentSeeder::class,
    ]);
}

# Run seeder
php artisan db:seed --class=DocumentSeeder
# or refresh all
php artisan migrate:fresh --seed
```

### 5. Add Email Notification

```bash
# Create mail class
cd backend
php artisan make:mail AppointmentConfirmed

# Edit mail class
// app/Mail/AppointmentConfirmed.php
use App\Models\Appointment;

class AppointmentConfirmed extends Mailable
{
    public function __construct(public Appointment $appointment) {}

    public function build()
    {
        return $this->subject('Appointment Confirmed')
            ->view('emails.appointment-confirmed');
    }
}

# Create blade template
// resources/views/emails/appointment-confirmed.blade.php
<h1>Your appointment is confirmed!</h1>
<p>Date: {{ $appointment->appointment_date }}</p>
<p>Time: {{ $appointment->appointment_time }}</p>

# Send email
use App\Mail\AppointmentConfirmed;
use Illuminate\Support\Facades\Mail;

Mail::to($user->email)->send(new AppointmentConfirmed($appointment));
```

### 6. Add Environment Variable

```bash
# 1. Add to .env.example
NEW_API_KEY=your_key_here

# 2. Add to .env
NEW_API_KEY=actual_key_value

# 3. Add to config (if needed)
// config/services.php
'new_service' => [
    'api_key' => env('NEW_API_KEY'),
],

# 4. Clear config cache
php artisan config:clear

# 5. Access in code
$apiKey = config('services.new_service.api_key');
```

### 7. Debug API Issues

```bash
# View logs
cd backend
tail -f storage/logs/laravel.log

# Or use Laravel Pail (prettier)
php artisan pail

# Test API with curl
curl -X POST http://localhost:8000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lawyer_id":1,"appointment_date":"2024-02-01"}'

# Use Tinker to test models
php artisan tinker
>>> $user = User::find(1);
>>> $user->appointments;
```

### 8. Handle Database Issues

```bash
# Reset database
cd backend
php artisan migrate:fresh --seed

# Rollback last migration
php artisan migrate:rollback

# Check migration status
php artisan migrate:status

# Fix SQLite permission issues (Linux)
chmod 664 database/database.sqlite
chmod 775 database

# Switch to MySQL (production)
# Update .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=legalkonect
DB_USERNAME=root
DB_PASSWORD=

# Create database
mysql -u root -p
CREATE DATABASE legalkonect;
```

---

## Security Considerations

### Authentication & Authorization

**Token Security:**
```php
// Sanctum tokens are hashed in database
// Never expose tokens in logs or responses
// Frontend stores token in localStorage

// Validate ownership before actions
public function update(Request $request, $id)
{
    $appointment = Appointment::findOrFail($id);

    // Check if user owns this appointment
    if ($appointment->user_id !== $request->user()->id) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // ... update logic
}
```

**Middleware Usage:**
```php
// Always use middleware for protected routes
Route::middleware('auth:sanctum')->group(...);

// Add custom authorization
if (!Gate::allows('update', $appointment)) {
    abort(403);
}
```

### Input Validation

**Always validate user input:**
```php
$validated = $request->validate([
    'email' => 'required|email|unique:users',
    'password' => 'required|min:8|confirmed',
    'appointment_date' => 'required|date|after:today',
    'rating' => 'required|integer|min:1|max:5',
]);
```

**Sanitize file uploads:**
```php
$request->validate([
    'profile_picture' => 'required|image|mimes:jpeg,png,jpg|max:2048',
]);

$path = $request->file('profile_picture')->store('profiles', 'public');
```

### SQL Injection Prevention

**Use Eloquent ORM (parameterized queries):**
```php
// GOOD
$users = User::where('email', $email)->get();

// BAD - Never do this
$users = DB::select("SELECT * FROM users WHERE email = '$email'");
```

### XSS Prevention

**React automatically escapes output:**
```typescript
// Safe - React escapes by default
<div>{lawyer.name}</div>

// Unsafe - avoid dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: lawyer.bio }} />

// If needed, sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lawyer.bio) }} />
```

### CORS Configuration

**Backend CORS settings:**
```php
// config/cors.php
'paths' => ['api/*'],
'allowed_origins' => [
    'http://localhost:3000',
    'https://yourdomain.com'
],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### Sensitive Data

**Never commit sensitive data:**
```bash
# .gitignore includes:
.env
database/database.sqlite
storage/*.key
```

**Encrypt sensitive fields:**
```php
// Laravel automatically encrypts these fields
protected $casts = [
    'google_calendar_access_token' => 'encrypted',
    'google_calendar_refresh_token' => 'encrypted',
];
```

### Rate Limiting

**Add to routes if needed:**
```php
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // 60 requests per minute
});
```

### Payment Security

**Never store card details:**
```php
// Use PayMongo tokenization
// Only store payment_intent_id and paymongo_payment_id
// Never log full card numbers or CVV
```

---

## Troubleshooting

### Backend Issues

#### Migration Errors
```bash
# Error: "Database file not found"
touch database/database.sqlite
chmod 664 database/database.sqlite

# Error: "Foreign key constraint failed"
# Ensure migrations run in correct order
# Parents before children (users → lawyers → appointments)
php artisan migrate:fresh
```

#### CORS Errors
```bash
# Error: "No 'Access-Control-Allow-Origin' header"
# Check config/cors.php
# Ensure frontend URL is in allowed_origins

# Clear config cache
php artisan config:clear
php artisan config:cache
```

#### Token Authentication Errors
```bash
# Error: "Unauthenticated"
# Check token is being sent in header
# Verify token exists in personal_access_tokens table

# In Tinker:
php artisan tinker
>>> PersonalAccessToken::where('tokenable_id', 1)->first()
```

#### Google Calendar Errors
```bash
# Error: "Invalid credentials"
# Check .env has correct GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# Verify redirect URI matches Google Console

# Error: "Token expired"
# Service auto-refreshes tokens
# Check google_calendar_refresh_token is stored
```

#### PayMongo Errors
```bash
# Error: "Invalid API key"
# Check .env has PAYMONGO_SECRET_KEY
# Ensure using correct environment (test vs live)

# Error: "Webhook verification failed"
# PayMongo sends signed webhooks
# Verify signature using PayMongo secret
```

### Frontend Issues

#### API Connection Errors
```bash
# Error: "Network Error" or "ERR_CONNECTION_REFUSED"
# Check backend is running: http://localhost:8000
# Verify REACT_APP_API_URL in .env

# Check API URL
console.log(process.env.REACT_APP_API_URL)
```

#### Build Errors
```bash
# Error: "Module not found"
npm install

# Error: "TypeScript errors"
# Check tsconfig.json
# Ensure all types are defined

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

#### Google Maps Errors
```bash
# Error: "Google Maps JavaScript API error: RefererNotAllowedMapError"
# Add http://localhost:3000 to Google Console API restrictions

# Error: "InvalidKeyMapError"
# Check REACT_APP_GOOGLE_MAPS_KEY in .env
# Ensure Maps JavaScript API is enabled
```

#### Authentication Errors
```bash
# User logged out unexpectedly
# Check token expiration
# Verify interceptor redirects correctly

# Token not persisting
# Check localStorage.setItem('token', ...) is called
# Verify token is loaded on app mount
```

### Database Issues

#### Query Performance
```php
// Enable query logging
DB::enableQueryLog();
// ... execute queries
dd(DB::getQueryLog());

// Look for N+1 queries
// Solution: Use eager loading
$lawyers = Lawyer::with('specializations', 'reviews')->get();
```

#### Data Seeding Issues
```bash
# Seeder not running
php artisan db:seed --class=LawyerSeeder

# Duplicate key errors
# Use updateOrCreate or truncate first
DB::table('lawyers')->truncate();
```

### Common Error Messages

**"SQLSTATE[HY000]: General error: 1 no such table"**
- Run migrations: `php artisan migrate`

**"Class 'App\Models\Lawyer' not found"**
- Check namespace and file location
- Run `composer dump-autoload`

**"419 Page Expired"**
- CSRF token issue (shouldn't happen with API)
- Ensure using api.php routes, not web.php

**"401 Unauthorized"**
- Token missing or invalid
- Check Authorization header
- Verify user is authenticated

**"403 Forbidden"**
- User doesn't have permission
- Check middleware (lawyer, admin)
- Verify ownership of resource

**"500 Internal Server Error"**
- Check `storage/logs/laravel.log`
- Enable debug: `APP_DEBUG=true` in .env

---

## Additional Resources

### Documentation Files
- **PROJECT_REFERENCE.md** - Comprehensive system reference (2,516 lines)
- **GOOGLE_CALENDAR_SETUP.md** - Google Calendar integration setup
- **GOOGLE_MAPS_SETUP.md** - Google Maps API configuration
- **LAWYER_CREDENTIALS.md** - Default lawyer login credentials
- **PERFORMANCE_OPTIMIZATIONS.md** - Performance improvement guide
- **SYSTEM_REPORT.md** - System analysis and statistics

### External Documentation
- [Laravel 12 Documentation](https://laravel.com/docs/12.x)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PayMongo API](https://developers.paymongo.com/docs)
- [Google Calendar API](https://developers.google.com/calendar)

### Quick Commands Reference

```bash
# Backend
php artisan serve              # Start server
php artisan migrate:fresh --seed  # Reset database
php artisan tinker             # Interactive shell
php artisan test               # Run tests
php artisan pail               # View logs (prettier)
composer run dev               # Start all backend services

# Frontend
npm start                      # Start dev server
npm run build                  # Build for production
npm test                       # Run tests

# Both
npm start                      # From root - starts both
npm run install:all            # Install all dependencies
```

---

## Version Information

- **Project Version:** 1.0.0
- **Laravel:** 12.x
- **PHP:** 8.2+
- **React:** 19.1.1
- **TypeScript:** 4.9.5
- **Last Updated:** 2025-11-21

---

## Notes for AI Assistants

### When Working with This Codebase

1. **Always check existing patterns** before implementing new features
2. **Follow established naming conventions** (see Code Patterns section)
3. **Use service layer** for complex business logic (PayMongo, Google Calendar)
4. **Validate all inputs** on both frontend and backend
5. **Check authorization** before modifying resources
6. **Use eager loading** to prevent N+1 queries
7. **Log errors** with context for debugging
8. **Update migrations** incrementally, never modify existing ones
9. **Test API endpoints** with proper authentication
10. **Follow RESTful conventions** for new routes

### Common Pitfalls to Avoid

- ❌ Modifying existing migrations (create new ones instead)
- ❌ Exposing sensitive data in API responses (tokens, passwords)
- ❌ Storing sensitive data in .env.example
- ❌ Using raw SQL queries (use Eloquent instead)
- ❌ Forgetting to validate ownership of resources
- ❌ Not using middleware for protected routes
- ❌ Hardcoding API URLs (use environment variables)
- ❌ Committing .env or database.sqlite files

### Best Practices

- ✅ Use transactions for multi-step database operations
- ✅ Cache frequently accessed data
- ✅ Implement proper error handling
- ✅ Add descriptive commit messages
- ✅ Write tests for critical functionality
- ✅ Document complex business logic
- ✅ Use TypeScript types for API responses
- ✅ Implement loading states for async operations
- ✅ Show user-friendly error messages

---

**End of CLAUDE.md**
