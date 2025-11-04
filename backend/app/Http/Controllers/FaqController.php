<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Models\FaqCategory;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    // Public: Get all categories with FAQ count
    public function categories()
    {
        $categories = FaqCategory::active()
            ->withCount('faqs')
            ->get();

        return response()->json($categories);
    }

    // Public: Get FAQs by category
    public function byCategory($slug)
    {
        $category = FaqCategory::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $faqs = Faq::where('category_id', $category->id)
            ->active()
            ->get();

        return response()->json([
            'category' => $category,
            'faqs' => $faqs
        ]);
    }

    // Public: Search FAQs
    // Public: Search FAQs
public function search(Request $request)
{
    $query = $request->input('q');

    if (empty($query)) {
        return response()->json([]);
    }

    $faqs = Faq::active()
        ->with('category')
        ->where(function($q) use ($query) {
            $q->where('question', 'like', "%{$query}%")
              ->orWhere('answer', 'like', "%{$query}%");
        })
        ->limit(10)
        ->get();

    // Track the search
    \DB::table('faq_searches')->insert([
        'query' => $query,
        'results_count' => $faqs->count(),
        'user_id' => auth('sanctum')->id(), // null if not logged in
        'created_at' => now(),
        'updated_at' => now()
    ]);

    return response()->json($faqs);
}

    // Public: Get single FAQ and increment views
    public function show($id)
    {
        $faq = Faq::with('category')->findOrFail($id);
        $faq->incrementViews();

        return response()->json($faq);
    }

    // Admin: Get all FAQs
    public function index()
    {
        $faqs = Faq::with('category')
            ->orderBy('category_id')
            ->orderBy('order')
            ->get();

        return response()->json($faqs);
    }

    // Admin: Create FAQ
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:faq_categories,id',
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'type' => 'required|in:static,dynamic',
            'dynamic_endpoint' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'boolean'
        ]);

        $faq = Faq::create($validated);

        return response()->json([
            'message' => 'FAQ created successfully',
            'faq' => $faq->load('category')
        ], 201);
    }

    // Admin: Update FAQ
    public function update(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:faq_categories,id',
            'question' => 'sometimes|string|max:500',
            'answer' => 'sometimes|string',
            'type' => 'sometimes|in:static,dynamic',
            'dynamic_endpoint' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'boolean'
        ]);

        $faq->update($validated);

        return response()->json([
            'message' => 'FAQ updated successfully',
            'faq' => $faq->load('category')
        ]);
    }

    // Admin: Delete FAQ
    public function destroy($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'message' => 'FAQ deleted successfully'
        ]);
    }

    // Admin: Get all categories for management
    public function adminCategories()
    {
        $categories = FaqCategory::withCount('faqs')
            ->orderBy('order')
            ->get();

        return response()->json($categories);
    }

    // Admin: Create category
    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:faq_categories|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'boolean'
        ]);

        $category = FaqCategory::create($validated);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category
        ], 201);
    }

    // Admin: Update category
    public function updateCategory(Request $request, $id)
    {
        $category = FaqCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:faq_categories,slug,' . $id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'boolean'
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category
        ]);
    }

    // Admin: Delete category
    public function destroyCategory($id)
    {
        $category = FaqCategory::findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully'
        ]);
    }

    // Admin: Get search analytics
public function searchAnalytics(Request $request)
{
    $days = $request->input('days', 30);
    
    // Most searched queries
    $topSearches = \DB::table('faq_searches')
        ->select('query', \DB::raw('COUNT(*) as count'), \DB::raw('AVG(results_count) as avg_results'))
        ->where('created_at', '>=', now()->subDays($days))
        ->groupBy('query')
        ->orderBy('count', 'desc')
        ->limit(20)
        ->get();
    
    // Unanswered questions (searches with 0 results)
    $unanswered = \DB::table('faq_searches')
        ->where('results_count', 0)
        ->where('created_at', '>=', now()->subDays($days))
        ->select('query', \DB::raw('COUNT(*) as count'))
        ->groupBy('query')
        ->orderBy('count', 'desc')
        ->limit(20)
        ->get();
    
    // Search trends (daily) - FIXED FOR SQL SERVER
    $trends = \DB::table('faq_searches')
        ->select(\DB::raw('CAST(created_at AS DATE) as date'), \DB::raw('COUNT(*) as count'))
        ->where('created_at', '>=', now()->subDays($days))
        ->groupBy(\DB::raw('CAST(created_at AS DATE)'))
        ->orderBy('date', 'asc')
        ->get();
    
    return response()->json([
        'top_searches' => $topSearches,
        'unanswered_questions' => $unanswered,
        'search_trends' => $trends,
        'total_searches' => \DB::table('faq_searches')->where('created_at', '>=', now()->subDays($days))->count()
    ]);
}
}