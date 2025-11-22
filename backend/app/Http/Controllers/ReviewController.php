<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Appointment;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // Get all approved reviews (for homepage)
    public function index()
    {
        $reviews = Review::with(['user', 'lawyer.user'])
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at->format('Y-m-d'),
                    'client_name' => $review->user->name,
                    'lawyer_name' => $review->lawyer->first_name . ' ' . $review->lawyer->last_name,
                ];
            });

        return response()->json([
            'reviews' => $reviews,
            'total_count' => Review::where('is_approved', true)->count(),
            'average_rating' => Review::where('is_approved', true)->avg('rating'),
        ]);
    }

    // Get reviews for a specific lawyer
    public function lawyerReviews($lawyerId)
    {
        $reviews = Review::with('user')
            ->where('lawyer_id', $lawyerId)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_reviews' => $reviews->count(),
            'average_rating' => $reviews->avg('rating'),
            'rating_distribution' => [
                5 => $reviews->where('rating', 5)->count(),
                4 => $reviews->where('rating', 4)->count(),
                3 => $reviews->where('rating', 3)->count(),
                2 => $reviews->where('rating', 2)->count(),
                1 => $reviews->where('rating', 1)->count(),
            ]
        ];

        return response()->json([
            'reviews' => $reviews,
            'stats' => $stats,
        ]);
    }

    // Create a review
   public function store(Request $request)
{
    // Debug: Check if user is authenticated
    \Log::info('Review store - User ID: ' . auth()->id());
    \Log::info('Review store - Token: ' . $request->bearerToken());
    
    if (!auth()->check()) {
        return response()->json(['message' => 'Not authenticated'], 401);
    }

    $validated = $request->validate([
        'appointment_id' => 'required|exists:appointments,id',
        'rating' => 'required|integer|min:1|max:5',
        'comment' => 'required|string|min:1|max:500',
    ]);

    $appointment = Appointment::findOrFail($validated['appointment_id']);

    // ADD MORE DEBUG INFO
    \Log::info('Appointment User ID: ' . $appointment->user_id);
    \Log::info('Current User ID: ' . auth()->id());
    \Log::info('Appointment Status: ' . $appointment->status);
    \Log::info('Has Review: ' . ($appointment->review ? 'Yes' : 'No'));

    // Verify user owns the appointment
   if ($appointment->user_id != auth()->id()) {
        \Log::error('UNAUTHORIZED: Appointment user_id=' . $appointment->user_id . ' but current user=' . auth()->id());
        return response()->json(['message' => 'Unauthorized - This appointment does not belong to you'], 403);
    }

    // Check if appointment is completed
    if ($appointment->status !== 'completed') {
        return response()->json([
            'message' => 'You can only review completed appointments'
        ], 422);
    }

    // Check if already reviewed
    if ($appointment->review) {
        return response()->json([
            'message' => 'You have already reviewed this appointment'
        ], 422);
    }

    $review = Review::create([
        'user_id' => auth()->id(),
        'lawyer_id' => $appointment->lawyer_id,
        'appointment_id' => $appointment->id,
        'rating' => $validated['rating'],
        'comment' => $validated['comment'],
        'is_approved' => true, // Auto-approve all reviews
    ]);

    \Log::info('Review created successfully: ID=' . $review->id);

    // Update lawyer's rating and review count
    $this->updateLawyerRating($appointment->lawyer_id);

    return response()->json([
        'message' => 'Review submitted successfully!',
        'review' => $review
    ], 201);
}

    // Get user's reviews
    public function myReviews()
    {
        $reviews = Review::with(['lawyer.user', 'appointment'])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['reviews' => $reviews]);
    }

    // Update review
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        if ($review->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:1|max:500',
        ]);

        $review->update([
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        // Recalculate lawyer's rating
        $this->updateLawyerRating($review->lawyer_id);

        return response()->json([
            'message' => 'Review updated successfully!',
            'review' => $review
        ]);
    }

    // Delete review
    public function destroy($id)
    {
        $review = Review::findOrFail($id);

        if ($review->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lawyerId = $review->lawyer_id;
        $review->delete();

        // Recalculate lawyer's rating after deletion
        $this->updateLawyerRating($lawyerId);

        return response()->json(['message' => 'Review deleted successfully']);
    }

    // Helper method to update lawyer's rating and review count
    private function updateLawyerRating($lawyerId)
    {
        $lawyer = \App\Models\Lawyer::findOrFail($lawyerId);

        // Get all approved reviews for this lawyer
        $reviews = Review::where('lawyer_id', $lawyerId)
            ->where('is_approved', true)
            ->get();

        // Calculate average rating and total count
        $totalReviews = $reviews->count();
        $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : 0;

        // Update lawyer record
        $lawyer->update([
            'rating' => round($averageRating, 2),
            'total_reviews' => $totalReviews
        ]);

        \Log::info("Updated lawyer #{$lawyerId} rating: {$averageRating} ({$totalReviews} reviews)");
    }
}
