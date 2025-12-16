<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLawyer
{
    public function handle(Request $request, Closure $next)
{
    $user = $request->user();
    
    if (!$user || !$user->lawyer) {
        return response()->json(['message' => 'Unauthorized. Lawyer profile required.'], 403);
    }
    
    // Check if lawyer is suspended
    if ($user->lawyer->status === 'suspended') {
        return response()->json([
            'message' => 'Your lawyer account has been suspended. Please contact support.',
            'suspended' => true
        ], 403);
    }
    
    // Check if lawyer verification has been rejected FIRST
    if ($user->lawyer->verification_status === 'rejected') {
        return response()->json([
            'message' => 'Your lawyer verification has been rejected.',
            'rejected' => true,
            'verification_status' => 'rejected',
            'verification_notes' => $user->lawyer->verification_notes,
            'first_name' => $user->lawyer->first_name,
            'last_name' => $user->lawyer->last_name,
        ], 403);
    }
    
    if ($user->lawyer->status !== 'approved') {
        return response()->json(['message' => 'Your lawyer profile is pending approval.'], 403);
    }
    
    return $next($request);
}
}