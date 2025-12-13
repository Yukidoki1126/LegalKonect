import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search, Eye, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react';
import adminApi from '../../services/adminApi';
import PageTransition from '../../components/PageTransition';
import { API_BASE_URL } from '../../config/api.config';

interface FAQ {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  type: string;
  order: number;
  views: number;
  is_active: boolean;
  category?: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  faqs_count: number;
}

interface SearchAnalytic {
  query: string;
  count: number;
  avg_results?: number;
}

interface Analytics {
  top_searches: SearchAnalytic[];
  unanswered_questions: SearchAnalytic[];
  search_trends: any[];
  total_searches: number;
}

const AdminFaqs = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);
  const [deletingFaqQuestion, setDeletingFaqQuestion] = useState<string>('');
  
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    answer: '',
    type: 'static',
    order: 0,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchFaqs();
    await fetchCategories();
  };

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get('/faqs');
      setFaqs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/faqs/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await adminApi.get('/faq-analytics');
      console.log('Analytics data loaded:', response.data);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data so the UI doesn't break
      setAnalytics({
        top_searches: [],
        unanswered_questions: [],
        search_trends: [],
        total_searches: 0
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (showAnalytics && !analytics) {
      fetchAnalytics();
    }
  }, [showAnalytics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = sessionStorage.getItem('admin_token');
    const url = editingFaq
      ? `${API_BASE_URL}/admin/faqs/${editingFaq.id}`
      : `${API_BASE_URL}/admin/faqs`;

    const method = editingFaq ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchFaqs();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  const handleDeleteClick = (faq: FAQ) => {
    setDeletingFaqId(faq.id);
    setDeletingFaqQuestion(faq.question);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFaqId) return;

    const token = sessionStorage.getItem('admin_token');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/faqs/${deletingFaqId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchFaqs();
        setShowDeleteModal(false);
        setDeletingFaqId(null);
        setDeletingFaqQuestion('');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingFaqId(null);
    setDeletingFaqQuestion('');
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      category_id: faq.category_id.toString(),
      question: faq.question,
      answer: faq.answer,
      type: faq.type,
      order: faq.order,
      is_active: faq.is_active
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaq(null);
    setFormData({
      category_id: '',
      question: '',
      answer: '',
      type: 'static',
      order: 0,
      is_active: true
    });
  };

  const filteredFaqs = (faqs || []).filter(faq => {
    const matchesSearch = (faq.question || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (faq.answer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           faq.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">FAQ Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage frequently asked questions and categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add FAQ</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm">Total FAQs</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{faqs.length}</p>
            </div>
            <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm">Categories</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{categories.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl">📁</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm">Total Views</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {faqs.reduce((sum, faq) => sum + Number(faq.views || 0), 0)}
              </p>
            </div>
            <Eye className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm">Total Searches</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {analytics?.total_searches || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setShowAnalytics(false)}
          className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
            !showAnalytics
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Manage FAQs
        </button>
        <button
          onClick={() => setShowAnalytics(true)}
          className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
            showAnalytics
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Analytics & Insights
        </button>
      </div>

      {/* Content */}
      {!showAnalytics ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FAQ Table */}
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Question</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Question</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredFaqs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <MessageCircle className="w-16 h-16 text-gray-400" />
                            <div>
                              <p className="text-gray-600 text-lg font-medium">No FAQs found</p>
                              <p className="text-gray-500 text-sm mt-1">
                                {faqs.length === 0
                                  ? 'Get started by creating your first FAQ'
                                  : 'Try adjusting your search or filter criteria'}
                              </p>
                            </div>
                            {faqs.length === 0 && (
                              <button
                                onClick={() => setShowModal(true)}
                                className="mt-4 flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Create First FAQ</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFaqs.map((faq) => (
                        <tr key={faq.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 mb-1">{faq.question}</div>
                            <div className="text-sm text-gray-600 line-clamp-2">{faq.answer}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {faq.category?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-gray-700">
                              <Eye className="w-4 h-4 mr-2 text-gray-600" />
                              <span className="text-sm font-medium">{faq.views}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              faq.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {faq.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(faq)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(faq)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FAQ Cards - Mobile */}
          <div className="md:hidden space-y-3">
            {loading ? (
              // Loading skeleton
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredFaqs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">No FAQs found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {faqs.length === 0
                    ? 'Get started by creating your first FAQ'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {faqs.length === 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First FAQ</span>
                  </button>
                )}
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 flex-1">{faq.question}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                        faq.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{faq.answer}</p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{faq.views}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{faq.category?.name || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(faq)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Analytics Content */}
          {analyticsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading analytics...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Top Searches */}
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Most Searched Questions</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                  Questions users are searching for most frequently (last 30 days)
                </p>
                <div className="space-y-2 sm:space-y-3">
                  {analytics.top_searches && analytics.top_searches.length > 0 ? (
                    analytics.top_searches.map((search, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl sm:text-2xl font-bold text-purple-600">#{index + 1}</span>
                            <p className="text-sm sm:text-base text-gray-900 font-medium">{search.query}</p>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 ml-8 sm:ml-10">
                            Average {search.avg_results} results per search
                          </p>
                        </div>
                        <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-bold self-start sm:self-auto">
                          {search.count} searches
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No search data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Unanswered Questions */}
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Unanswered Questions</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                  Questions users searched for but got 0 results - consider adding these as FAQs
                </p>
                <div className="space-y-2 sm:space-y-3">
                  {analytics.unanswered_questions && analytics.unanswered_questions.length > 0 ? (
                    analytics.unanswered_questions.map((search, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
                        <div className="flex-1">
                          <p className="text-sm sm:text-base text-gray-900 font-medium">{search.query}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Users couldn't find an answer to this</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm font-bold">
                            {search.count} times
                          </span>
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                question: search.query
                              });
                              setShowModal(true);
                              setShowAnalytics(false);
                            }}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            Create FAQ
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-4xl mb-3">🎉</div>
                      <p className="text-green-700 font-medium">No unanswered questions!</p>
                      <p className="text-gray-600 text-sm mt-1">All user searches are finding results</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setAnalytics(null);
                    fetchAnalytics();
                  }}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-medium"
                >
                  Refresh Analytics
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Failed to load analytics</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 relative">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the question..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter the answer..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="static">Static</option>
                      <option value="dynamic">Dynamic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-3 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-medium"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingFaq ? 'Update FAQ' : 'Create FAQ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 relative">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete FAQ
              </h3>
              
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to delete this FAQ?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-sm font-medium text-gray-700 line-clamp-2">
                  {deletingFaqQuestion}
                </p>
              </div>
              
              <p className="text-sm text-gray-500 text-center mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaqs;