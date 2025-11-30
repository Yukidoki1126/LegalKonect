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
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200';
      case 'ongoing':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200';
      case 'closed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
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
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-4">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-40 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-72"></div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-8 mb-8 border-b border-gray-200 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
            ))}
          </div>

          {/* Cases Skeleton */}
          <div className="bg-white border border-gray-200 rounded-lg">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 border-b border-gray-100 last:border-b-0 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-5 bg-gray-200 rounded w-48"></div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
                    <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      );
    }

    // Show simple spinner when switching tabs
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mb-3"></div>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 animate-fadeIn pt-16">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-6">
        {/* Enhanced Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Cases</h1>
              <p className="text-sm text-gray-500">Track progress and stay updated with your legal cases</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs with counts */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 mb-6 overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex">
              {([
                { key: 'all', label: 'All Cases', count: stats.total, icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                { key: 'pending', label: 'Pending', count: stats.pending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { key: 'ongoing', label: 'In Progress', count: stats.ongoing, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { key: 'closed', label: 'Resolved', count: stats.closed, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`
                    flex-1 px-4 py-4 text-center font-medium transition-all text-sm flex items-center justify-center gap-2
                    ${filter === tab.key
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      filter === tab.key 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cases List */}
        {filteredCases.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-16 px-8 text-center shadow-soft">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No cases yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {filter === 'all' 
                ? "Cases will appear here after your lawyer creates them following an appointment."
                : `You don't have any ${filter === 'pending' ? 'pending' : filter === 'ongoing' ? 'in progress' : 'resolved'} cases.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-card hover:border-gray-200 transition-all duration-300 cursor-pointer group"
                onClick={() => openCaseDetails(caseItem)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {caseItem.title}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status_label}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                      {caseItem.lawyer && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {caseItem.lawyer.first_name} {caseItem.lawyer.last_name}
                        </span>
                      )}
                      {caseItem.case_type && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">{caseItem.case_type}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500 font-medium">Progress</span>
                        <span className="font-bold text-indigo-600">{caseItem.progress_percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                          style={{ width: `${caseItem.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Case Details</h2>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/80 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {/* Status Tracker */}
                <CaseStatusTracker status={selectedCase.status} />

                {/* Case Info */}
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedCase.title}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded text-sm font-medium ${getStatusColor(selectedCase.status)}`}>
                        {selectedCase.status_label}
                      </span>
                      {selectedCase.case_type && (
                        <span className="px-2.5 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700">
                          {selectedCase.case_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedCase.description && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Description
                      </h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedCase.description}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Your Lawyer
                      </h4>
                      <p className="text-sm font-medium text-blue-900">
                        {selectedCase.lawyer.first_name} {selectedCase.lawyer.last_name}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer_updates && (
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Latest Updates
                      </h4>
                      <p className="text-sm text-amber-700 whitespace-pre-line">
                        {selectedCase.lawyer_updates}
                      </p>
                    </div>
                  )}

                  {selectedCase.resolution_summary && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resolution Summary
                      </h4>
                      <p className="text-sm text-green-700 whitespace-pre-line">
                        {selectedCase.resolution_summary}
                      </p>
                      {selectedCase.closed_at && (
                        <p className="text-xs text-green-600 mt-3 pt-2 border-t border-green-200 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Closed on {new Date(selectedCase.closed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Client Checklist */}
                  {todos.length > 0 && (
                    <div className="border-t border-gray-200 pt-5">
                      <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Items to Bring
                      </h4>
                      <p className="text-xs text-gray-500 mb-4">
                        Your lawyer will check off items as you submit them.
                      </p>
                      <div className="space-y-2">
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                              todo.is_completed
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              todo.is_completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`}>
                              {todo.is_completed && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${todo.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {todo.title}
                              </span>
                              {todo.due_date && (
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Due: {new Date(todo.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                    <span>Created {new Date(selectedCase.created_at).toLocaleDateString()}</span>
                    <span className="mx-2">·</span>
                    <span>Updated {new Date(selectedCase.updated_at).toLocaleDateString()}</span>
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