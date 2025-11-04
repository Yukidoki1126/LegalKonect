import React, { useState, useEffect } from 'react';
import CaseStatusTracker from '../components/CaseStatusTracker';
import api from '../services/api';

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

const Cases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'ongoing' | 'closed'>('all');
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    fetchCases();

    // Auto-refresh every 5 seconds (silent background refresh after initial load)
    const interval = setInterval(() => {
      fetchCases(true); // Pass true to skip loading state
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Prevent body scroll when modal is open and auto-refresh todos
  useEffect(() => {
    if (selectedCase) {
      document.body.style.overflow = 'hidden';

      // Auto-refresh todos every 5 seconds when case is open
      const todosInterval = setInterval(() => {
        fetchTodos(selectedCase.id);
      }, 5000);

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
      // Make the API call - don't await it to avoid blocking UI
      api.put(`/cases/${selectedCase.id}/todos/${todoId}`, {
        is_completed: !isCompleted,
      }).then(async () => {
        // After update, refresh case data in background
        const response = await api.get(`/cases/${selectedCase.id}`);
        setSelectedCase(response.data);
        setCases(prevCases =>
          prevCases.map(c => c.id === selectedCase.id ? response.data : c)
        );
      }).catch((err: any) => {
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
      });
    } catch (err: any) {
      console.error('Failed to update todo', err);
      setError(err.response?.data?.message || 'Failed to update todo');
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
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Case Progress Tracker</h1>
          <p className="text-gray-600 mt-1">
            Track your ongoing cases with your lawyer
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {(['all', 'pending', 'ongoing', 'closed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm capitalize
                  ${
                    filter === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
                <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-xs">
                  {tab === 'all'
                    ? cases.length
                    : cases.filter((c) => c.status === tab).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Cases List */}
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cases yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your lawyer will create cases for you. Once created, you can track their progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer"
                onClick={() => openCaseDetails(caseItem)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {caseItem.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status_label}
                        </span>
                        {caseItem.case_type && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {caseItem.case_type}
                          </span>
                        )}
                      </div>
                      {caseItem.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {caseItem.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Created {new Date(caseItem.created_at).toLocaleDateString()}
                        </span>
                        {caseItem.lawyer && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {caseItem.lawyer.first_name} {caseItem.lawyer.last_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg
                        className="w-6 h-6 text-gray-400"
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
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${caseItem.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Todo Summary */}
                  {caseItem.todos && caseItem.todos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">Checklist - Items to Bring:</span>
                        <span className="text-gray-500">
                          {caseItem.todos.filter(t => t.is_completed).length} / {caseItem.todos.length} completed
                        </span>
                      </div>
                      <div className="mt-2 space-y-2">
                        {caseItem.todos.slice(0, 3).map((todo) => (
                          <div key={todo.id} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs">
                              {todo.is_completed ? (
                                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                </svg>
                              )}
                              <span className={`truncate ${todo.is_completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                {todo.title}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                                todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {todo.priority.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 ml-6">
                              <span>Added: {new Date(todo.created_at).toLocaleDateString()} {new Date(todo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {todo.due_date && (
                                <span>• Due: {new Date(todo.due_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {caseItem.todos.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            +{caseItem.todos.length - 3} more items...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Case Details</h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600"
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedCase.title}
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          selectedCase.status
                        )}`}
                      >
                        {selectedCase.status_label}
                      </span>
                      {selectedCase.case_type && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {selectedCase.case_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedCase.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                      <p className="text-gray-600 whitespace-pre-line">
                        {selectedCase.description}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Your Lawyer</h4>
                      <p className="text-blue-700">
                        {selectedCase.lawyer.first_name} {selectedCase.lawyer.last_name}
                      </p>
                    </div>
                  )}

                  {selectedCase.lawyer_updates && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Latest Updates</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-line">
                          {selectedCase.lawyer_updates}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCase.resolution_summary && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Resolution Summary
                      </h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-900 whitespace-pre-line">
                          {selectedCase.resolution_summary}
                        </p>
                        {selectedCase.closed_at && (
                          <p className="text-xs text-green-700 mt-2">
                            Closed on {new Date(selectedCase.closed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Client Checklist */}
                  {todos.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Checklist - Items to Bring
                      </h4>
                      <div className="space-y-2">
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                              todo.is_completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={todo.is_completed}
                              onChange={() => handleToggleTodo(todo.id, todo.is_completed)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    todo.is_completed
                                      ? 'text-gray-500 line-through'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {todo.title}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    todo.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : todo.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {todo.priority.toUpperCase()}
                                </span>
                              </div>
                              {todo.due_date && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Due: {new Date(todo.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {todo.is_completed && (
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-4 border-t">
                    <p>Created: {new Date(selectedCase.created_at).toLocaleString()}</p>
                    <p>Last Updated: {new Date(selectedCase.updated_at).toLocaleString()}</p>
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
