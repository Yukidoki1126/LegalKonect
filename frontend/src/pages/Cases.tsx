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
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
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
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your Cases</h1>
          <p className="text-sm text-gray-500">Track progress and stay updated with your legal cases</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs with counts */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex gap-8">
            {([
              { key: 'all', label: 'All Cases', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'ongoing', label: 'In Progress', count: stats.ongoing },
              { key: 'closed', label: 'Resolved', count: stats.closed },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`
                  pb-3 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${filter === tab.key
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    filter === tab.key 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cases List */}
        {filteredCases.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg py-20 px-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              {filter === 'all' 
                ? "Cases will appear here after your lawyer creates them following an appointment."
                : `You don't have any ${filter === 'pending' ? 'pending' : filter === 'ongoing' ? 'in progress' : 'resolved'} cases.`}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openCaseDetails(caseItem)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {caseItem.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status_label}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {caseItem.lawyer && (
                        <span>{caseItem.lawyer.first_name} {caseItem.lawyer.last_name}</span>
                      )}
                      {caseItem.case_type && (
                        <span>{caseItem.case_type}</span>
                      )}
                      <span>{new Date(caseItem.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Progress Bar - Simple */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{caseItem.progress_percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${caseItem.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Case Details</h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded transition"
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
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedCase.description}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Your Lawyer</h4>
                      <p className="text-sm text-gray-900">
                        {selectedCase.lawyer.first_name} {selectedCase.lawyer.last_name}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer_updates && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">Latest Updates</h4>
                      <p className="text-sm text-yellow-700 whitespace-pre-line">
                        {selectedCase.lawyer_updates}
                      </p>
                    </div>
                  )}

                  {selectedCase.resolution_summary && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Resolution Summary</h4>
                      <p className="text-sm text-green-700 whitespace-pre-line">
                        {selectedCase.resolution_summary}
                      </p>
                      {selectedCase.closed_at && (
                        <p className="text-xs text-green-600 mt-2">
                          Closed on {new Date(selectedCase.closed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Client Checklist */}
                  {todos.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Items to Bring
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">
                        Your lawyer will check off items as you submit them.
                      </p>
                      <div className="space-y-2">
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center gap-3 p-3 rounded-md border ${
                              todo.is_completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={todo.is_completed}
                              disabled={true}
                              className="w-4 h-4 text-blue-600 rounded cursor-not-allowed opacity-60"
                            />
                            <div className="flex-1">
                              <span className={`text-sm ${todo.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {todo.title}
                              </span>
                              {todo.due_date && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Due: {new Date(todo.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {todo.is_completed && (
                              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
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