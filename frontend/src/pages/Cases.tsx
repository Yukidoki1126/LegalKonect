import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CaseStatusTracker from '../components/CaseStatusTracker';
import api from '../services/api';
import { cacheService } from '../services/cacheService';

interface Case {
  id: number;
  appointment_id: number;
  user_id: number;
  lawyer_id: number;
  title: string;
  description: string | null;
  case_type: string | null;
  status: 'pending' | 'ongoing' | 'closed';
  lawyer_updates: string | null;
  resolution_summary: string | null;
  started_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  lawyer?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  appointment?: {
    id: number;
    appointment_date: string;
    appointment_time: string;
  };
  status_label: string;
  progress_percentage: number;
  todos?: Todo[];
}

interface Todo {
  id: number;
  case_id: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Cache for cases data - persists across component mounts
let casesCache: Case[] | null = null;

const Cases: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>(casesCache || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'ongoing' | 'closed'>('all');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Only show loading spinner if we don't have cached data
    const hasCache = casesCache !== null;
    fetchCases(!hasCache).finally(() => {
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    });

    // Auto-refresh every 5 seconds (silent background refresh after initial load)
    const interval = setInterval(() => {
      fetchCases(true); // Pass true to skip loading state
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle filter changes with cache invalidation
  const handleFilterChange = (newFilter: 'all' | 'pending' | 'ongoing' | 'closed') => {
    // Mark that we're switching tabs (not initial load)
    setIsTabSwitching(true);
    // Invalidate cache for fresh data
    cacheService.invalidatePattern('/cases');
    setFilter(newFilter);
  };

  // Prevent body scroll when modal is open and auto-refresh todos
  useEffect(() => {
    if (selectedCase) {
      document.body.style.overflow = 'hidden';

      // Auto-refresh todos every 5 seconds when case is open
      // Use a longer interval to reduce flickering
      const todosInterval = setInterval(() => {
        fetchTodos(selectedCase.id);
      }, 10000); // Changed from 5 seconds to 10 seconds

      return () => {
        document.body.style.overflow = 'unset';
        clearInterval(todosInterval);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedCase]);

  const fetchCases = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const response = await api.get('/cases');
      setCases(response.data);
      casesCache = response.data; // Update cache

      // Update selected case if it's currently open
      if (selectedCase) {
        const updatedCase = response.data.find((c: Case) => c.id === selectedCase.id);
        if (updatedCase) {
          setSelectedCase(updatedCase);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load cases');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchTodos = async (caseId: number) => {
    try {
      const response = await api.get(`/cases/${caseId}/todos`);
      setTodos(response.data);
    } catch (err: any) {
      console.error('Failed to load todos', err);
    }
  };

  const handleToggleTodo = async (todoId: number, isCompleted: boolean) => {
    if (!selectedCase) return;

    // Optimistic update - update UI immediately
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === todoId
          ? { ...todo, is_completed: !isCompleted }
          : todo
      )
    );

    try {
      // Make the API call
      await api.put(`/cases/${selectedCase.id}/todos/${todoId}`, {
        is_completed: !isCompleted,
      });

      // Update selectedCase and cases list without refetching todos
      // This prevents the flicker since we already updated todos optimistically
      setSelectedCase(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          todos: prev.todos?.map(todo =>
            todo.id === todoId
              ? { ...todo, is_completed: !isCompleted }
              : todo
          )
        };
      });

      setCases(prevCases =>
        prevCases.map(c => {
          if (c.id === selectedCase.id) {
            return {
              ...c,
              todos: c.todos?.map(todo =>
                todo.id === todoId
                  ? { ...todo, is_completed: !isCompleted }
                  : todo
              )
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      console.error('Failed to update todo', err);
      setError(err.response?.data?.message || 'Failed to update todo');
      // Revert optimistic update on error
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === todoId
            ? { ...todo, is_completed: isCompleted }
            : todo
        )
      );
    }
  };

  const openCaseDetails = (caseItem: Case) => {
    setSelectedCase(caseItem);
    fetchTodos(caseItem.id);
  };

  const filteredCases = cases.filter((c) =>
    filter === 'all' ? true : c.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate stats
  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'pending').length,
    ongoing: cases.filter(c => c.status === 'ongoing').length,
    closed: cases.filter(c => c.status === 'closed').length,
  };

  if (loading) {
    // Show skeleton loading on initial page load (from sidebar)
    // Only show simple spinner when explicitly switching tabs
    if (!isTabSwitching) {
      return (
        <div className="min-h-screen bg-gray-50 pt-16 animate-fadeIn">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>

          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-96"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>

          {/* Cases Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      );
    }

    // Show simple spinner when switching tabs
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Simple loading indicator */}
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading cases...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16 ${!isTabSwitching ? 'animate-fadeIn' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors font-medium"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Your Case Progress
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Track the progress of your legal cases and stay updated with your lawyer's latest developments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.ongoing}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.closed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-8">
          <div className="flex space-x-1">
            {(['all', 'pending', 'ongoing', 'closed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                className={`
                  flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    filter === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="capitalize">
                    {tab === 'all' ? 'All Cases' : 
                     tab === 'pending' ? 'Under Review' :
                     tab === 'ongoing' ? 'In Progress' : 'Resolved'}
                  </span>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${filter === tab ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {tab === 'all' ? stats.total : 
                     tab === 'pending' ? stats.pending :
                     tab === 'ongoing' ? stats.ongoing : stats.closed}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cases List */}
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cases found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filter === 'all' 
                ? "Your lawyer will create cases for you. Once created, you can track their progress here."
                : `No ${filter === 'pending' ? 'cases under review' : filter === 'ongoing' ? 'cases in progress' : 'resolved cases'} at the moment.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer group"
                onClick={() => openCaseDetails(caseItem)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {caseItem.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status_label}
                        </span>
                      </div>
                      <svg
                        className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    {caseItem.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {caseItem.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      {caseItem.case_type && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {caseItem.case_type}
                        </span>
                      )}
                      {caseItem.lawyer && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {caseItem.lawyer.first_name} {caseItem.lawyer.last_name}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created {new Date(caseItem.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Progress and Todos Summary */}
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Case Progress</span>
                          <span>{caseItem.progress_percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${caseItem.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Todos Summary */}
                      {caseItem.todos && caseItem.todos.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="font-medium text-gray-900">Items to Bring</span>
                            <span className="text-gray-600">
                              {caseItem.todos.filter(t => t.is_completed).length} of {caseItem.todos.length} completed
                            </span>
                          </div>
                          <div className="space-y-2">
                            {caseItem.todos.slice(0, 3).map((todo) => (
                              <div key={todo.id} className="flex items-center gap-3">
                                {todo.is_completed ? (
                                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0"></div>
                                )}
                                <span className={`text-sm ${todo.is_completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                  {todo.title}
                                </span>
                              </div>
                            ))}
                            {caseItem.todos.length > 3 && (
                              <p className="text-xs text-gray-500 italic">
                                +{caseItem.todos.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Case Details</h2>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {/* Status Tracker */}
                <CaseStatusTracker status={selectedCase.status} />

                {/* Case Info */}
                <div className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {selectedCase.title}
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                          selectedCase.status
                        )}`}
                      >
                        {selectedCase.status_label}
                      </span>
                      {selectedCase.case_type && (
                        <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {selectedCase.case_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedCase.description && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Case Description</h4>
                      <p className="text-blue-800 whitespace-pre-line">
                        {selectedCase.description}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Your Legal Representative</h4>
                      <p className="text-blue-800 font-medium">
                        {selectedCase.lawyer.first_name} {selectedCase.lawyer.last_name}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer_updates && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-2">Latest Updates from Your Lawyer</h4>
                      <div className="bg-white rounded-lg p-3 border border-yellow-100">
                        <p className="text-yellow-800 whitespace-pre-line">
                          {selectedCase.lawyer_updates}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCase.resolution_summary && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-green-900 mb-2">
                        Case Resolution Summary
                      </h4>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-green-900 whitespace-pre-line">
                          {selectedCase.resolution_summary}
                        </p>
                        {selectedCase.closed_at && (
                          <p className="text-xs text-green-700 mt-2 font-medium">
                            Case closed on {new Date(selectedCase.closed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Client Checklist */}
                  {todos.length > 0 && (
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Checklist - Items to Bring
                      </h4>
                      <p className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        📋 Your lawyer will check off items as you submit and confirm your documents.
                      </p>
                      <div className="space-y-3">
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                              todo.is_completed
                                ? 'bg-green-50 border-green-300'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={todo.is_completed}
                              disabled={true}
                              className="w-6 h-6 text-blue-600 rounded-lg cursor-not-allowed opacity-60"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span
                                  className={`text-base font-medium ${
                                    todo.is_completed
                                      ? 'text-gray-500 line-through'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {todo.title}
                                </span>
                              </div>
                              {todo.due_date && (
                                <p className={`text-sm ${
                                  todo.is_completed ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Due: {new Date(todo.due_date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              )}
                            </div>
                            {todo.is_completed && (
                              <div className="flex items-center gap-1 text-green-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Completed</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500 pt-4 border-t">
                    <div className="flex flex-wrap gap-4">
                      <span>Created: {new Date(selectedCase.created_at).toLocaleString()}</span>
                      <span>Last Updated: {new Date(selectedCase.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cases;