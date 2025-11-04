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
    
    if ($user->lawyer->status !== 'approved') {
        return response()->json(['message' => 'Your lawyer profile is pending approval.'], 403);
    }
    
    return $next($request);
}
}