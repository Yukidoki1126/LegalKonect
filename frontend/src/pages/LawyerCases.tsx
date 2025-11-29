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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-72"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-8"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-1 mb-6 animate-pulse">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 h-9 bg-gray-100 rounded-md"></div>
              ))}
            </div>
          </div>

          {/* Cases Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-5 bg-gray-200 rounded w-40"></div>
                    <div className="h-5 bg-gray-100 rounded-full w-20"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-md w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-100 rounded w-24"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 ${!isTabSwitching ? 'animate-fadeIn' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Spinner overlay for tab switching */}
        {loading && isTabSwitching && (
          <div className="fixed inset-0 bg-white/75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Loading cases...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Case Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track your legal cases efficiently
              </p>
            </div>
            <button
              onClick={openNewCaseModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Case
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Cases</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.ongoing}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">{stats.closed}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-1 mb-6">
          <div className="flex gap-1">
            {(['all', 'pending', 'ongoing', 'closed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                className={`
                  flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    filter === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="capitalize">{tab}</span>
                  <span className={`
                    px-1.5 py-0.5 rounded text-xs font-medium
                    ${filter === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
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
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No cases found</h3>
            <p className="text-sm text-gray-600 mb-5 max-w-sm mx-auto">
              {filter === 'all' 
                ? "Get started by creating your first case from a completed appointment."
                : `No ${filter} cases at the moment.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={openNewCaseModal}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Create Your First Case
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-gray-900">
                          {caseItem.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status_label}
                        </span>
                      </div>
                    </div>

                    {caseItem.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {caseItem.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {caseItem.case_type && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {caseItem.case_type}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {caseItem.user?.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created {new Date(caseItem.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Progress and Todos Summary */}
                    <div className="mt-4 space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                          <span>Progress</span>
                          <span>{caseItem.progress_percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${caseItem.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Todos Summary */}
                      {caseItem.todos && caseItem.todos.length > 0 && (
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-medium text-gray-700">Client Checklist</span>
                            <span className="text-gray-500">
                              {caseItem.completed_todos_count || 0}/{caseItem.todos_count || 0}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {caseItem.todos.slice(0, 3).map((todo) => (
                              <div key={todo.id} className="flex items-center gap-2">
                                {todo.is_completed ? (
                                  <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <div className="w-3.5 h-3.5 border border-gray-300 rounded flex-shrink-0"></div>
                                )}
                                <span className={`text-xs ${todo.is_completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                  {todo.title}
                                </span>
                              </div>
                            ))}
                            {caseItem.todos.length > 3 && (
                              <p className="text-xs text-gray-400">
                                +{caseItem.todos.length - 3} more
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
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => openUpdateModal(caseItem)}
                      className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* New Case Modal */}
        {showNewCaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg border border-gray-200 max-w-xl w-full max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Create New Case</h2>
                <button
                  onClick={() => setShowNewCaseModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitCase} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                  {/* Info Banner */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-600">
                      Create a case from your completed appointments to manage ongoing legal matters with your clients.
                    </p>
                  </div>

                  {/* Select Appointment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Select Appointment <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedAppointment || ''}
                      onChange={(e) => setSelectedAppointment(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition text-sm bg-white"
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
                    {appointments.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-600">
                        You need at least one completed appointment to create a case.
                      </p>
                    )}
                  </div>

                  {/* Case Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Case Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCase.title}
                      onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition text-sm"
                      placeholder="e.g., Property Dispute Resolution"
                    />
                  </div>

                  {/* Case Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Case Type
                    </label>
                    <select
                      value={newCase.case_type}
                      onChange={(e) => setNewCase({ ...newCase, case_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition text-sm bg-white"
                    >
                      <option value="">Select a type...</option>
                      {caseTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={newCase.description}
                      onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition text-sm resize-none"
                      placeholder="Provide details about the case..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 border-t border-gray-200 px-5 py-4 bg-gray-50 rounded-b-lg">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewCaseModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={appointments.length === 0}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg border border-gray-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Update Case</h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-5 overflow-y-auto">
                {/* Status Tracker */}
                <CaseStatusTracker status={selectedCase.status} />

                {/* Case Info */}
                <div className="mt-5 mb-5">
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    {selectedCase.title}
                  </h3>
                  <div className="flex gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status_label}
                    </span>
                    {selectedCase.case_type && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {selectedCase.case_type}
                      </span>
                    )}
                  </div>
                  {selectedCase.description && (
                    <p className="text-sm text-gray-600 mb-4">{selectedCase.description}</p>
                  )}
                  {selectedCase.user && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Client</h4>
                      <p className="text-gray-900 font-medium text-sm">{selectedCase.user.name}</p>
                      <p className="text-gray-600 text-sm">{selectedCase.user.email}</p>
                    </div>
                  )}
                </div>

                {/* Update Form */}
                <form onSubmit={handleUpdateCase} className="space-y-4 border-t border-gray-200 pt-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Case Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as 'pending' | 'ongoing' | 'closed' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="ongoing">In Progress</option>
                      <option value="closed">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Updates for Client
                    </label>
                    <textarea
                      rows={3}
                      value={updateForm.lawyer_updates}
                      onChange={(e) => setUpdateForm({ ...updateForm, lawyer_updates: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition resize-none"
                      placeholder="Provide updates on the case progress..."
                    />
                  </div>

                  {updateForm.status === 'closed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Resolution Summary
                      </label>
                      <textarea
                        rows={3}
                        value={updateForm.resolution_summary}
                        onChange={(e) => setUpdateForm({ ...updateForm, resolution_summary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition resize-none"
                        placeholder="Summarize how the case was resolved..."
                      />
                    </div>
                  )}

                  {/* Todo List Section */}
                  <div className="border-t border-gray-200 pt-5 mt-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Client Checklist
                      <span className="text-xs font-normal text-gray-500 ml-2">(Items the client should bring)</span>
                    </h3>

                    {/* Add New Todo Form */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTodo.title}
                          onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                          placeholder="What should the client bring? (e.g., Valid ID, Birth Certificate)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white text-sm"
                        />
                        <input
                          type="date"
                          value={newTodo.due_date}
                          onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 bg-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleCreateTodo}
                          disabled={!newTodo.title.trim() || !newTodo.due_date}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>

                    {/* Todo List */}
                    <div className="space-y-2">
                      {todos.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-3">
                          No items yet. Add items for the client to bring.
                        </p>
                      ) : (
                        todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center justify-between p-2.5 border rounded-md transition ${
                              todo.is_completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1">
                              <input
                                type="checkbox"
                                checked={todo.is_completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-4 h-4 text-gray-900 rounded cursor-pointer border-gray-300"
                              />
                              <span className={`text-sm ${todo.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {todo.title}
                              </span>
                              {todo.due_date && (
                                <span className={`text-xs ${todo.is_completed ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Due: {new Date(todo.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {todo.is_completed && (
                                <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Completed
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition ml-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex-shrink-0 border-t border-gray-200 px-5 py-3 bg-gray-50 rounded-b-lg">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCase}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition text-sm"
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