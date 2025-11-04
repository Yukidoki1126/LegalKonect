<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class LawyersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $lawyers = [
            [
                'email' => 'juan.santos@lawfirm.ph',
                'first_name' => 'Juan',
                'last_name' => 'Santos',
                'bio' => 'Specializing in family law with over 15 years of experience handling divorce, child custody, and adoption cases. Known for compassionate approach and successful outcomes.',
                'license_number' => 'PH-LAW-2024-001',
                'years_experience' => 15,
                'hourly_rate' => 3000.00,
                'office_address' => 'Ayala Avenue, Makati City, Metro Manila',
                'office_latitude' => 14.5547,
                'office_longitude' => 121.0244,
                'office_phone' => '+63 917 123 4567',
                'office_hours' => 'Mon-Fri 9AM-6PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [1],
            ],
            [
                'email' => 'maria.reyes@lexcorp.ph',
                'first_name' => 'Maria Clara',
                'last_name' => 'Reyes',
                'bio' => 'Criminal defense attorney with expertise in white-collar crime, fraud cases, and corporate investigations. Former prosecutor with deep understanding of criminal procedure.',
                'license_number' => 'PH-LAW-2024-002',
                'years_experience' => 12,
                'hourly_rate' => 4500.00,
                'office_address' => 'Bonifacio Global City, Taguig, Metro Manila',
                'office_latitude' => 14.5514,
                'office_longitude' => 121.0496,
                'office_phone' => '+63 918 234 5678',
                'office_hours' => 'Mon-Fri 8AM-5PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [2],
            ],
            [
                'email' => 'roberto.delacruz@corplaw.ph',
                'first_name' => 'Roberto',
                'last_name' => 'Dela Cruz',
                'bio' => 'Senior corporate lawyer specializing in mergers and acquisitions, corporate governance, and securities law. Advises Fortune 500 companies and local conglomerates.',
                'license_number' => 'PH-LAW-2024-003',
                'years_experience' => 20,
                'hourly_rate' => 8000.00,
                'office_address' => 'Salcedo Village, Makati City, Metro Manila',
                'office_latitude' => 14.5588,
                'office_longitude' => 121.0272,
                'office_phone' => '+63 919 345 6789',
                'office_hours' => 'Mon-Fri 9AM-7PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [3],
            ],
            [
                'email' => 'annaliza.mendoza@laborlaw.ph',
                'first_name' => 'Anna Liza',
                'last_name' => 'Mendoza',
                'bio' => 'Labor law specialist representing both employers and employees in workplace disputes, unfair dismissal cases, and labor contract negotiations.',
                'license_number' => 'PH-LAW-2024-004',
                'years_experience' => 10,
                'hourly_rate' => 2500.00,
                'office_address' => 'Ortigas Center, Pasig City, Metro Manila',
                'office_latitude' => 14.5865,
                'office_longitude' => 121.0571,
                'office_phone' => '+63 920 456 7890',
                'office_hours' => 'Mon-Fri 9AM-6PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [4],
            ],
            [
                'email' => 'carlos.fernandez@proplaw.ph',
                'first_name' => 'Carlos',
                'last_name' => 'Fernandez',
                'bio' => 'Real estate law expert handling property transactions, land disputes, condominium law, and real estate development projects across the Philippines.',
                'license_number' => 'PH-LAW-2024-005',
                'years_experience' => 18,
                'hourly_rate' => 5000.00,
                'office_address' => 'Rockwell Center, Makati City, Metro Manila',
                'office_latitude' => 14.5656,
                'office_longitude' => 121.0369,
                'office_phone' => '+63 921 567 8901',
                'office_hours' => 'Mon-Sat 10AM-7PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [5],
            ],
            [
                'email' => 'patricia.lim@immigration.ph',
                'first_name' => 'Patricia',
                'last_name' => 'Santos-Lim',
                'bio' => 'Immigration lawyer assisting with visa applications, deportation defense, citizenship matters, and international family reunification cases.',
                'license_number' => 'PH-LAW-2024-006',
                'years_experience' => 8,
                'hourly_rate' => 3500.00,
                'office_address' => 'Eastwood City, Quezon City, Metro Manila',
                'office_latitude' => 14.6091,
                'office_longitude' => 121.0794,
                'office_phone' => '+63 922 678 9012',
                'office_hours' => 'Mon-Fri 9AM-6PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [6],
            ],
            [
                'email' => 'jm.torres@familylaw.ph',
                'first_name' => 'Jose Miguel',
                'last_name' => 'Torres',
                'bio' => 'Dual expertise in family law and property matters, particularly in marital property division, estate planning, and inheritance disputes.',
                'license_number' => 'PH-LAW-2024-007',
                'years_experience' => 14,
                'hourly_rate' => 3800.00,
                'office_address' => 'Quezon Avenue, Quezon City, Metro Manila',
                'office_latitude' => 14.6417,
                'office_longitude' => 121.0359,
                'office_phone' => '+63 923 789 0123',
                'office_hours' => 'Mon-Fri 9AM-5PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [1, 5],
            ],
            [
                'email' => 'sophia.tan@criminaldefense.ph',
                'first_name' => 'Sophia',
                'last_name' => 'Tan',
                'bio' => 'Young but highly skilled criminal defense lawyer with focus on drug cases, theft, and assault. Known for aggressive courtroom advocacy.',
                'license_number' => 'PH-LAW-2024-008',
                'years_experience' => 7,
                'hourly_rate' => 2800.00,
                'office_address' => 'SM Aura Premier, Taguig, Metro Manila',
                'office_latitude' => 14.5466,
                'office_longitude' => 121.0506,
                'office_phone' => '+63 924 890 1234',
                'office_hours' => 'Mon-Fri 10AM-6PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [2],
            ],
            [
                'email' => 'ben.aquino@businesslaw.ph',
                'first_name' => 'Benjamin',
                'last_name' => 'Aquino',
                'bio' => 'Veteran lawyer with expertise in corporate compliance, employment contracts, and HR legal advisory. Senior partner at leading law firm.',
                'license_number' => 'PH-LAW-2024-009',
                'years_experience' => 25,
                'hourly_rate' => 7500.00,
                'office_address' => 'Ayala Triangle, Makati City, Metro Manila',
                'office_latitude' => 14.5538,
                'office_longitude' => 121.0255,
                'office_phone' => '+63 925 901 2345',
                'office_hours' => 'Mon-Fri 8AM-7PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [3, 4],
            ],
            [
                'email' => 'isabella.garcia@estateplanning.ph',
                'first_name' => 'Isabella',
                'last_name' => 'Garcia',
                'bio' => 'Specializes in estate planning, wills and trusts, probate matters, and property succession. Helps families navigate complex inheritance issues.',
                'license_number' => 'PH-LAW-2024-010',
                'years_experience' => 11,
                'hourly_rate' => 4200.00,
                'office_address' => 'The Fort, Bonifacio Global City, Taguig',
                'office_latitude' => 14.5488,
                'office_longitude' => 121.0471,
                'office_phone' => '+63 926 012 3456',
                'office_hours' => 'Mon-Sat 9AM-6PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [1, 5],
            ],
            [
                'email' => 'rafael.domingo@laborattorney.ph',
                'first_name' => 'Rafael',
                'last_name' => 'Domingo',
                'bio' => 'Affordable labor law representation for employees. Handles illegal dismissal, wage disputes, and workers compensation claims.',
                'license_number' => 'PH-LAW-2024-011',
                'years_experience' => 6,
                'hourly_rate' => 1800.00,
                'office_address' => 'España Boulevard, Manila City, Metro Manila',
                'office_latitude' => 14.6091,
                'office_longitude' => 120.9897,
                'office_phone' => '+63 927 123 4567',
                'office_hours' => 'Mon-Fri 9AM-5PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [4],
            ],
            [
                'email' => 'veronica.salazar@immigration.ph',
                'first_name' => 'Veronica',
                'last_name' => 'Salazar',
                'bio' => 'Immigration specialist with strong track record in visa approvals, green card applications, and citizenship petitions for Filipino-Americans.',
                'license_number' => 'PH-LAW-2024-012',
                'years_experience' => 13,
                'hourly_rate' => 4000.00,
                'office_address' => 'Greenhills, San Juan, Metro Manila',
                'office_latitude' => 14.6026,
                'office_longitude' => 121.0489,
                'office_phone' => '+63 928 234 5678',
                'office_hours' => 'Mon-Fri 10AM-7PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [6],
            ],
            [
                'email' => 'miguel.alfonso@realestate.ph',
                'first_name' => 'Miguel',
                'last_name' => 'Alfonso',
                'bio' => 'Real estate lawyer focusing on residential property transactions, title transfers, and homeowners association disputes in South Metro Manila.',
                'license_number' => 'PH-LAW-2024-013',
                'years_experience' => 9,
                'hourly_rate' => 3200.00,
                'office_address' => 'Alabang Town Center, Muntinlupa, Metro Manila',
                'office_latitude' => 14.4186,
                'office_longitude' => 121.0396,
                'office_phone' => '+63 929 345 6789',
                'office_hours' => 'Mon-Sat 10AM-6PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [5],
            ],
            [
                'email' => 'diana.mercado@crimlaw.ph',
                'first_name' => 'Diana',
                'last_name' => 'Cruz-Mercado',
                'bio' => 'Experienced in domestic violence cases, restraining orders, and criminal aspects of family disputes. Advocate for women and children rights.',
                'license_number' => 'PH-LAW-2024-014',
                'years_experience' => 16,
                'hourly_rate' => 5500.00,
                'office_address' => 'Libis, Quezon City, Metro Manila',
                'office_latitude' => 14.6308,
                'office_longitude' => 121.0695,
                'office_phone' => '+63 930 456 7890',
                'office_hours' => 'Mon-Fri 9AM-6PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [2, 1],
            ],
            [
                'email' => 'antonio.lopez@corporatelaw.ph',
                'first_name' => 'Antonio',
                'last_name' => 'Lopez',
                'bio' => 'Junior corporate attorney assisting startups and SMEs with business formation, contracts, and corporate compliance. Affordable rates for entrepreneurs.',
                'license_number' => 'PH-LAW-2024-015',
                'years_experience' => 5,
                'hourly_rate' => 2200.00,
                'office_address' => 'Mandaluyong City, Metro Manila',
                'office_latitude' => 14.5794,
                'office_longitude' => 121.0359,
                'office_phone' => '+63 931 567 8901',
                'office_hours' => 'Mon-Fri 10AM-7PM',
                'profile_photo' => null,
                'status' => 'approved',
                'rating' => 0.00,
                'total_reviews' => 0,
                'is_available' => 1,
                'specializations' => [3],
            ],
        ];

        foreach ($lawyers as $lawyerData) {
            // Extract email and specializations
            $email = $lawyerData['email'];
            $specializations = $lawyerData['specializations'];
            unset($lawyerData['email']);
            unset($lawyerData['specializations']);

            // Check if user already exists
            $user = DB::table('users')->where('email', $email)->first();

            if (!$user) {
                // Create user account for the lawyer
                $userId = DB::table('users')->insertGetId([
                    'name' => $lawyerData['first_name'] . ' ' . $lawyerData['last_name'],
                    'email' => $email,
                    'password' => Hash::make('Password123!'), // Default strong password
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            } else {
                $userId = $user->id;
            }

            // Add user_id to lawyer data
            $lawyerData['user_id'] = $userId;
            $lawyerData['created_at'] = Carbon::now();
            $lawyerData['updated_at'] = Carbon::now();

            // Check if lawyer already exists
            $existingLawyer = DB::table('lawyers')
                ->where('license_number', $lawyerData['license_number'])
                ->first();

            if ($existingLawyer) {
                $lawyerId = $existingLawyer->id;
                $this->command->info("Lawyer {$lawyerData['first_name']} {$lawyerData['last_name']} already exists, skipping...");
            } else {
                // Insert lawyer
                $lawyerId = DB::table('lawyers')->insertGetId($lawyerData);
                $this->command->info("Created lawyer: {$lawyerData['first_name']} {$lawyerData['last_name']}");
            }

            // Attach specializations (remove existing first to avoid duplicates)
            DB::table('lawyer_specializations')->where('lawyer_id', $lawyerId)->delete();
            
            foreach ($specializations as $specializationId) {
                DB::table('lawyer_specializations')->insert([
                    'lawyer_id' => $lawyerId,
                    'specialization_id' => $specializationId,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }

        $this->command->info('15 lawyers seeded successfully with user accounts!');
    }
}