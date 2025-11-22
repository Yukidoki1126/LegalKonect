import React, { useState, useEffect } from 'react';
import CaseStatusTracker from '../components/CaseStatusTracker';
import { lawyerApi } from '../services/lawyerApi';
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
  user?: {
    id: number;
    name: string;
    email: string;
  };
  appointment?: {
    id: number;
    appointment_date: string;
    appointment_time: string;
  };
  status_label: string;
  progress_percentage: number;
  todos?: Todo[];
  todos_count?: number;
  completed_todos_count?: number;
}

interface Appointment {
  id: number;
  user_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  meeting_type?: string;
  client_notes?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
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

const LawyerCases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'ongoing' | 'closed'>('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // New case form
  const [newCase, setNewCase] = useState({
    appointment_id: 0,
    title: '',
    description: '',
    case_type: '',
  });

  // Update case form
  const [updateForm, setUpdateForm] = useState({
    status: '' as 'pending' | 'ongoing' | 'closed',
    lawyer_updates: '',
    resolution_summary: '',
  });

  // Todo management
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
  });

  const caseTypes = [
    'Civil',
    'Criminal',
    'Family',
    'Labor',
    'Corporate',
    'Tax',
    'Immigration',
    'Real Estate',
    'Intellectual Property',
    'Other',
  ];

  useEffect(() => {
    fetchCases(false).finally(() => {
      setLoading(false);
      setIsInitialLoad(false);
    });
  }, []);

  useEffect(() => {
    if (isTabSwitching) {
      setLoading(true);
      fetchCases(false).finally(() => {
        setLoading(false);
        setIsTabSwitching(false);
      });
    }
  }, [filter]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showNewCaseModal || showUpdateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNewCaseModal, showUpdateModal]);

  const fetchCases = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const data = await lawyerApi.getCases();
      setCases(data);
    } catch (err: any) {
      console.error('Failed to load cases', err);
      setError('Failed to load cases');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchCompletedAppointments = async () => {
    try {
      const data = await lawyerApi.getCompletedAppointments();
      setAppointments(data);
    } catch (err: any) {
      console.error('Failed to load completed appointments', err);
    }
  };

  const fetchTodos = async (caseId: number) => {
    try {
      const data = await lawyerApi.getCaseTodos(caseId);
      setTodos(data);
    } catch (err: any) {
      console.error('Failed to load todos', err);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'pending' | 'ongoing' | 'closed') => {
    setIsTabSwitching(true);
    cacheService.invalidatePattern('/lawyer/cases');
    setFilter(newFilter);
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newTodo.title.trim()) {
      setError('Please enter a todo title');
      return;
    }

    if (!newTodo.due_date) {
      setError('Please select a due date');
      return;
    }

    try {
      await lawyerApi.createTodo(selectedCase.id, newTodo);
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
      });
      setError('');
      fetchTodos(selectedCase.id);
      fetchCases(false);
    } catch (err: any) {
      console.error('Failed to create todo', err);
      setError(err.response?.data?.message || 'Failed to create todo');
    }
  };

  const handleToggleTodo = async (todoId: number) => {
    if (!selectedCase) return;

    // Optimistic update - update UI immediately
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === todoId
          ? { ...todo, is_completed: !todo.is_completed }
          : todo
      )
    );

    try {
      await lawyerApi.toggleTodo(selectedCase.id, todoId);
      setError('');
      // Refresh case data to update progress percentage
      fetchCases(false);
    } catch (err: any) {
      console.error('Failed to toggle todo', err);
      setError(err.response?.data?.message || 'Failed to update todo');
      // Revert optimistic update on error
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === todoId
            ? { ...todo, is_completed: !todo.is_completed }
            : todo
        )
      );
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    if (!selectedCase) return;

    try {
      await lawyerApi.deleteTodo(selectedCase.id, todoId);
      setError('');
      fetchTodos(selectedCase.id);
      fetchCases(false);
    } catch (err: any) {
      console.error('Failed to delete todo', err);
      setError(err.response?.data?.message || 'Failed to delete todo');
    }
  };

  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAppointment) {
      setError('Please select an appointment');
      return;
    }

    try {
      await lawyerApi.createCase({
        ...newCase,
        appointment_id: selectedAppointment,
      });
      setShowNewCaseModal(false);
      setSelectedAppointment(null);
      setNewCase({
        appointment_id: 0,
        title: '',
        description: '',
        case_type: '',
      });
      fetchCases(false);
      fetchCompletedAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create case');
    }
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setError('');

    try {
      await lawyerApi.updateCase(selectedCase.id, updateForm);
      setShowUpdateModal(false);
      fetchCases(false);
      setSelectedCase(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update case');
    }
  };

  const openNewCaseModal = () => {
    fetchCompletedAppointments();
    setShowNewCaseModal(true);
  };

  const openUpdateModal = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setUpdateForm({
      status: caseItem.status,
      lawyer_updates: caseItem.lawyer_updates || '',
      resolution_summary: caseItem.resolution_summary || '',
    });
    fetchTodos(caseItem.id);
    setShowUpdateModal(true);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Calculate stats
  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'pending').length,
    ongoing: cases.filter(c => c.status === 'ongoing').length,
    closed: cases.filter(c => c.status === 'closed').length,
  };

  if (loading && !isTabSwitching) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2"></div>
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

  return (
    <div className={`min-h-screen bg-gray-50 p-4 ${!isTabSwitching ? 'animate-fadeIn' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Spinner overlay for tab switching */}
        {loading && isTabSwitching && (
          <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading cases...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Case Management
              </h1>
              <p className="text-lg text-gray-600">
                Manage and track your legal cases efficiently
              </p>
            </div>
            <button
              onClick={openNewCaseModal}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Case
            </button>
          </div>
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
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
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
                  <span className="capitalize">{tab}</span>
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
                ? "Get started by creating your first case from a completed appointment."
                : `No ${filter} cases at the moment.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={openNewCaseModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold"
              >
                Create Your First Case
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900">
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
                    </div>

                    {caseItem.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {caseItem.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {caseItem.case_type && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {caseItem.case_type}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {caseItem.user?.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created {new Date(caseItem.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Progress and Todos Summary */}
                    <div className="mt-4 space-y-3">
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
                            <span className="font-medium text-gray-900">Client Checklist</span>
                            <span className="text-gray-600">
                              {caseItem.completed_todos_count || 0} of {caseItem.todos_count || 0} completed
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

                  <div className="flex lg:flex-col gap-2">
                    <button
                      onClick={() => openUpdateModal(caseItem)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => openUpdateModal(caseItem)}
                      className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* New Case Modal */}
        {showNewCaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Create New Case</h2>
                </div>
                <button
                  onClick={() => setShowNewCaseModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitCase} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  {/* Info Banner */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-0.5">Track Your Legal Cases</p>
                        <p className="text-xs text-blue-700">
                          Create a case from your completed appointments to manage ongoing legal matters with your clients.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Select Appointment */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Select Appointment <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <select
                        required
                        value={selectedAppointment || ''}
                        onChange={(e) => setSelectedAppointment(Number(e.target.value))}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white shadow-sm hover:border-gray-400"
                      >
                        <option value="">Choose a completed appointment...</option>
                        {appointments.map((apt) => {
                          const date = new Date(apt.appointment_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });
                          // Format time to 12-hour format
                          const formatTime = (timeStr: string) => {
                            const [hours, minutes] = timeStr.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `${displayHour}:${minutes} ${ampm}`;
                          };
                          const time = formatTime(apt.appointment_time);
                          const clientName = apt.user?.name || 'Unknown';
                          const meetingType = apt.meeting_type
                            ? ` • ${apt.meeting_type.charAt(0).toUpperCase() + apt.meeting_type.slice(1)}`
                            : '';

                          return (
                            <option key={apt.id} value={apt.id}>
                              {date} at {time} - {clientName}{meetingType}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {appointments.length === 0 && (
                      <div className="mt-2 flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm">You need to have at least one completed appointment to create a case.</p>
                      </div>
                    )}
                  </div>

                  {/* Case Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Case Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        value={newCase.title}
                        onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400"
                        placeholder="e.g., Property Dispute Resolution"
                      />
                    </div>
                  </div>

                  {/* Case Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Case Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <select
                        value={newCase.case_type}
                        onChange={(e) => setNewCase({ ...newCase, case_type: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white shadow-sm hover:border-gray-400"
                      >
                        <option value="">Select a type...</option>
                        {caseTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={newCase.description}
                      onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 resize-none"
                      placeholder="Provide details about the case, including key facts, client concerns, and initial assessment..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewCaseModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-gray-400 transition shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={appointments.length === 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Case
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Case Modal */}
        {showUpdateModal && selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Update Case</h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {/* Status Tracker */}
                <CaseStatusTracker status={selectedCase.status} />

                {/* Case Info */}
                <div className="mt-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {selectedCase.title}
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status_label}
                    </span>
                    {selectedCase.case_type && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {selectedCase.case_type}
                      </span>
                    )}
                  </div>
                  {selectedCase.description && (
                    <p className="text-sm text-gray-600 mb-4">{selectedCase.description}</p>
                  )}
                  {selectedCase.user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Client</h4>
                      <p className="text-blue-700 font-medium">{selectedCase.user.name}</p>
                      <p className="text-blue-600 text-sm">{selectedCase.user.email}</p>
                    </div>
                  )}
                </div>

                {/* Update Form */}
                <form onSubmit={handleUpdateCase} className="space-y-5 border-t pt-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Case Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as 'pending' | 'ongoing' | 'closed' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 bg-white"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="ongoing">In Progress</option>
                      <option value="closed">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Updates for Client
                    </label>
                    <textarea
                      rows={3}
                      value={updateForm.lawyer_updates}
                      onChange={(e) => setUpdateForm({ ...updateForm, lawyer_updates: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 resize-none"
                      placeholder="Provide updates on the case progress..."
                    />
                  </div>

                  {updateForm.status === 'closed' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Resolution Summary
                      </label>
                      <textarea
                        rows={3}
                        value={updateForm.resolution_summary}
                        onChange={(e) => setUpdateForm({ ...updateForm, resolution_summary: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 resize-none"
                        placeholder="Summarize how the case was resolved..."
                      />
                    </div>
                  )}

                  {/* Todo List Section */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Client Checklist
                      <span className="text-sm font-normal text-gray-500 ml-2">(Items the client should bring)</span>
                    </h3>

                    {/* Add New Todo Form */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newTodo.title}
                            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                            placeholder="What should the client bring? (e.g., Valid ID, Birth Certificate)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                          />
                          <input
                            type="date"
                            value={newTodo.due_date}
                            onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleCreateTodo}
                            disabled={!newTodo.title.trim() || !newTodo.due_date}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                          >
                            Add Item
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Todo List */}
                    <div className="space-y-2">
                      {todos.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No items yet. Add items for the client to bring.
                        </p>
                      ) : (
                        todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg transition ${
                              todo.is_completed
                                ? 'bg-green-50 border-green-300'
                                : 'bg-white border-gray-200 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={todo.is_completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                              />
                              <span className={`text-gray-900 font-medium ${todo.is_completed ? 'line-through text-gray-500' : ''}`}>
                                {todo.title}
                              </span>
                              {todo.due_date && (
                                <span className={`text-xs ${todo.is_completed ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Due: {new Date(todo.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {todo.is_completed && (
                                <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Completed
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition ml-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-gray-400 transition shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCase}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
                  >
                    Update Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LawyerCases;