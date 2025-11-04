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
    fetchCases();
    fetchCompletedAppointments();
  }, []);

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

  const fetchCases = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/lawyer/cases');
      console.log('Cases response:', response.data);
      setCases(response.data);
    } catch (err: any) {
      console.error('Failed to load cases', err);
      console.error('Error from /lawyer/cases:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedAppointments = async () => {
    try {
      const response = await api.get('/lawyer/cases/completed-appointments');
      console.log('Completed appointments response:', response.data);
      setAppointments(response.data);
    } catch (err: any) {
      console.error('Failed to load appointments', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load completed appointments');
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

    // Validate that the due date is not in the past and not too far in the future
    const selectedDate = new Date(newTodo.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);

    if (selectedDate < today) {
      setError('Due date cannot be in the past');
      return;
    }

    if (selectedDate > maxDate) {
      setError('Due date cannot be more than 5 years in the future');
      return;
    }

    try {
      await api.post(`/lawyer/cases/${selectedCase.id}/todos`, newTodo);
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
      });
      setError('');

      // Fetch updated todos for the modal
      fetchTodos(selectedCase.id);

      // Refresh the case data to update the case card
      const response = await api.get(`/lawyer/cases/${selectedCase.id}`);
      setSelectedCase(response.data);

      // Update the case in the cases list to reflect new todo on the card
      setCases(prevCases =>
        prevCases.map(c => c.id === selectedCase.id ? response.data : c)
      );
    } catch (err: any) {
      console.error('Failed to create todo', err);
      setError(err.response?.data?.message || 'Failed to create todo');
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    if (!selectedCase) return;

    try {
      await api.delete(`/lawyer/cases/${selectedCase.id}/todos/${todoId}`);
      setError('');

      // Fetch updated todos for the modal
      fetchTodos(selectedCase.id);

      // Refresh the case data to update the case card
      const response = await api.get(`/lawyer/cases/${selectedCase.id}`);
      setSelectedCase(response.data);

      // Update the case in the cases list to reflect deleted todo on the card
      setCases(prevCases =>
        prevCases.map(c => c.id === selectedCase.id ? response.data : c)
      );
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
      await api.post('/lawyer/cases', {
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
      fetchCases();
      fetchCompletedAppointments(); // Refresh to remove used appointment
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create case');
    }
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setError('');

    try {
      await api.put(`/lawyer/cases/${selectedCase.id}`, updateForm);
      setShowUpdateModal(false);
      fetchCases();
      setSelectedCase(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update case');
    }
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
    <div className="max-w-full overflow-x-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Case Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Create and manage cases for your clients
            </p>
          </div>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Case
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 min-w-min">
            {(['all', 'pending', 'ongoing'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`
                  py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap
                  ${
                    filter === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
                <span className="ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full bg-gray-100 text-xs">
                  {tab === 'all'
                    ? cases.length
                    : cases.filter((c) => c.status === tab).length}
                </span>
              </button>
            ))}
            <button
              onClick={() => setFilter('closed')}
              className={`
                py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap
                ${
                  filter === 'closed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Ongoing
              <span className="ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full bg-gray-100 text-xs">
                {cases.filter((c) => c.status === 'closed').length}
              </span>
            </button>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cases</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a case from your completed appointments to start tracking progress.
            </p>
            <button
              onClick={() => setShowNewCaseModal(true)}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Create Your First Case
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
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
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                          {caseItem.description}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="truncate">{caseItem.user?.name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Created {new Date(caseItem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openUpdateModal(caseItem)}
                      className="w-full sm:w-auto sm:ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-xs sm:text-sm whitespace-nowrap"
                    >
                      Update Case
                    </button>
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
                        <span className="text-gray-600 font-medium">Client Checklist:</span>
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
                              {todo.completed_at && (
                                <span>• Completed: {new Date(todo.completed_at).toLocaleDateString()} {new Date(todo.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

        {/* New Case Modal */}
        {showNewCaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-5xl w-full h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl animate-fadeIn overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-white bg-opacity-20 p-1.5 sm:p-2 rounded-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Create New Case</h2>
                </div>
                <button
                  onClick={() => setShowNewCaseModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 sm:p-2 rounded-lg transition"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitCase} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto scrollbar-hide">
                {/* Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
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
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white shadow-sm hover:border-gray-400"
                    >
                      <option value="">Choose a completed appointment...</option>
                      {appointments.map((apt) => {
                        const date = new Date(apt.appointment_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        const time = apt.appointment_time;
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
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400"
                      placeholder="e.g., Property Dispute Resolution"
                    />
                  </div>
                </div>

                {/* Case Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white shadow-sm hover:border-gray-400"
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
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 resize-none"
                    placeholder="Provide details about the case, including key facts, client concerns, and initial assessment..."
                  />
                </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setShowNewCaseModal(false)}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-white hover:border-gray-400 transition shadow-sm text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={appointments.length === 0}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Update Case</h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 sm:p-2 rounded-lg transition"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-hide" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {/* Status Tracker */}
                <CaseStatusTracker status={selectedCase.status} />

                {/* Case Info */}
                <div className="mt-4 mb-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedCase.title}
                  </h3>
                  <div className="flex gap-2 mb-3">
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
                  {selectedCase.description && (
                    <p className="text-sm text-gray-600 mb-3">{selectedCase.description}</p>
                  )}
                  {selectedCase.user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Client</h4>
                      <p className="text-blue-700 text-sm">
                        {selectedCase.user.name}
                      </p>
                      <p className="text-blue-600 text-xs">{selectedCase.user.email}</p>
                    </div>
                  )}
                </div>

                {/* Update Form */}
                <form onSubmit={handleUpdateCase} className="space-y-4 border-t pt-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Case Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={updateForm.status}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          status: e.target.value as 'pending' | 'ongoing' | 'closed',
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 bg-white text-gray-900"
                      style={{ backgroundColor: 'white', color: '#111827' }}
                    >
                      <option value="pending" className="bg-white text-gray-900" style={{ backgroundColor: 'white', color: '#111827' }}>Pending Review</option>
                      <option value="ongoing" className="bg-white text-gray-900" style={{ backgroundColor: 'white', color: '#111827' }}>In Progress</option>
                      <option value="closed" className="bg-white text-gray-900" style={{ backgroundColor: 'white', color: '#111827' }}>Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Updates for Client
                    </label>
                    <textarea
                      rows={3}
                      value={updateForm.lawyer_updates}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, lawyer_updates: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 resize-none"
                      placeholder="Provide updates on the case progress..."
                    />
                  </div>

                  {updateForm.status === 'closed' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                        Resolution Summary
                      </label>
                      <textarea
                        rows={3}
                        value={updateForm.resolution_summary}
                        onChange={(e) =>
                          setUpdateForm({ ...updateForm, resolution_summary: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-400 resize-none"
                        placeholder="Summarize how the case was resolved..."
                      />
                    </div>
                  )}

                  {/* Todo List Section */}
                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Client Checklist
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        (Items the client should bring)
                      </span>
                    </h3>

                    {/* Error Message */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Add New Todo Form */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={newTodo.title}
                            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                            placeholder="What should the client bring? (e.g., Valid ID, Birth Certificate)"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                          />
                        </div>
                        <div className="flex gap-3">
                          <select
                            value={newTodo.priority}
                            onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            style={{ backgroundColor: 'white', color: '#111827' }}
                          >
                            <option value="low" style={{ backgroundColor: 'white', color: '#111827' }}>Low Priority</option>
                            <option value="medium" style={{ backgroundColor: 'white', color: '#111827' }}>Medium Priority</option>
                            <option value="high" style={{ backgroundColor: 'white', color: '#111827' }}>High Priority</option>
                          </select>
                          <input
                            type="date"
                            value={newTodo.due_date}
                            onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                            min={(() => {
                              const today = new Date();
                              const year = today.getFullYear();
                              const month = String(today.getMonth() + 1).padStart(2, '0');
                              const day = String(today.getDate()).padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            })()}
                            max={(() => {
                              const maxDate = new Date();
                              maxDate.setFullYear(maxDate.getFullYear() + 5);
                              const year = maxDate.getFullYear();
                              const month = String(maxDate.getMonth() + 1).padStart(2, '0');
                              const day = String(maxDate.getDate()).padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            })()}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Due date"
                          />
                          <button
                            type="button"
                            onClick={handleCreateTodo}
                            disabled={!newTodo.title.trim() || !newTodo.due_date}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  todo.priority === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : todo.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {todo.priority.toUpperCase()}
                              </span>
                              <span className="text-gray-900 font-medium">{todo.title}</span>
                              {todo.due_date && (
                                <span className="text-xs text-gray-500">
                                  Due: {new Date(todo.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
              <div className="flex-shrink-0 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-white hover:border-gray-400 transition shadow-sm text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCase}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl text-sm sm:text-base"
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
