import React, { useEffect, useState } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { 
  Calendar, 
  Clock, 
  Plus
} from 'lucide-react';

interface Schedule {
  id: number;
  lawyer_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  daily_appointment_limit: number | null;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LawyerSchedule: React.FC = () => {
  // Helper function to convert 24-hour time to 12-hour format
  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);

  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '17:00',
    daily_appointment_limit: null as number | null,
  });

  useEffect(() => {
    fetchSchedules(false).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchSchedules = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await lawyerApi.getSchedules();
      setSchedules(data);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await lawyerApi.createSchedule(formData);
      setSuccess('Schedule added successfully!');
      setShowAddModal(false);
      setFormData({
        day_of_week: 'Monday',
        start_time: '09:00',
        end_time: '17:00',
        daily_appointment_limit: null,
      });
      fetchSchedules(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add schedule');
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    setError('');
    setSuccess('');

    try {
      await lawyerApi.updateSchedule(editingSchedule.id, formData);
      setSuccess('Schedule updated successfully!');
      setEditingSchedule(null);
      fetchSchedules(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;

    try {
      await lawyerApi.deleteSchedule(deletingSchedule.id);
      setSuccess('Schedule deleted successfully!');
      setDeletingSchedule(null);
      fetchSchedules(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete schedule');
      setDeletingSchedule(null);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await lawyerApi.toggleSchedule(id);
      fetchSchedules(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle schedule status');
    }
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.substring(0, 5),
      end_time: schedule.end_time.substring(0, 5),
      daily_appointment_limit: schedule.daily_appointment_limit,
    });
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingSchedule(null);
    setFormData({
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '17:00',
      daily_appointment_limit: null,
    });
    setError('');
  };

  const groupSchedulesByDay = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day] = schedules.filter(s => s.day_of_week === day);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="max-w-full overflow-x-hidden animate-fadeIn">
        {/* Header Skeleton - matching actual design */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-44 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-64 ml-14 animate-pulse"></div>
            </div>
            <div className="h-11 bg-gray-200 rounded-xl w-36 animate-pulse"></div>
          </div>
        </div>

        {/* Weekly Schedule Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {DAYS_OF_WEEK.map((day, index) => (
            <div key={day} className="bg-white rounded-2xl border-2 border-gray-100 p-5">
              {/* Day Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>

              {/* Time Slots */}
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                      <div className="h-6 bg-green-100 rounded-full w-14"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-100 rounded w-20"></div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const groupedSchedules = groupSchedulesByDay();

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>

      <div className="max-w-full overflow-x-hidden animate-fadeIn">
        {/* Header - Clean transparent style */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Weekly Schedule</h1>
              </div>
              <p className="text-gray-500 ml-14">Manage your available consultation hours</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-200"
            >
              <Plus className="w-5 h-5" />
              Add Time Slot
            </button>
          </div>
        </div>

      {/* Toast Notifications - Fixed Position */}
      {error && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-slideIn">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 shadow-lg max-w-md mx-auto sm:mx-0">
            <div className="flex items-start">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-red-800 break-words">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-2 sm:ml-3 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-slideIn">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 shadow-lg max-w-md mx-auto sm:mx-0">
            <div className="flex items-start">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-green-800 break-words">{success}</p>
              </div>
              <button
                onClick={() => setSuccess('')}
                className="ml-2 sm:ml-3 text-green-400 hover:text-green-600 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Grid - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="bg-white rounded-2xl border-2 border-gray-100 p-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{day}</h3>
            </div>

            {groupedSchedules[day].length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">No schedules</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groupedSchedules[day].map(schedule => (
                  <div
                    key={schedule.id}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      schedule.is_active
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {formatTime12Hour(schedule.start_time.substring(0, 5))} - {formatTime12Hour(schedule.end_time.substring(0, 5))}
                        </span>
                        {schedule.daily_appointment_limit && (
                          <span className="text-xs text-orange-600 font-medium">
                            Max {schedule.daily_appointment_limit} appointments/day
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleActive(schedule.id)}
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          schedule.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => openEditModal(schedule)}
                        className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingSchedule(schedule)}
                        className="flex-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingSchedule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={editingSchedule ? handleUpdateSchedule : handleAddSchedule} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border-t pt-3 sm:pt-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Daily Limit <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="daily_appointment_limit"
                        value={formData.daily_appointment_limit ?? ''}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          setFormData(prev => ({
                            ...prev,
                            daily_appointment_limit: value === '' || value === null ? null : parseInt(value)
                          }));
                        }}
                        onKeyDown={(e) => {
                          // Allow clearing the field with backspace/delete
                          if (e.key === 'Backspace' || e.key === 'Delete') {
                            const input = e.currentTarget;
                            if (input.value.length === 1) {
                              e.preventDefault();
                              setFormData(prev => ({ ...prev, daily_appointment_limit: null }));
                            }
                          }
                        }}
                        min="1"
                        max="50"
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
                      />
                      {formData.daily_appointment_limit !== null && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, daily_appointment_limit: null }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3 w-full sm:w-auto sm:mb-0">
                    <button
                      type="button"
                      onClick={closeModals}
                      className="flex-1 sm:flex-initial px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-initial px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingSchedule ? 'Update' : 'Add'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 sm:hidden">
                  Max appointments per day
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-scaleIn">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-red-100 rounded-full mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-2">
              Delete Schedule?
            </h3>

            <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6">
              Are you sure you want to delete the schedule for{' '}
              <span className="font-semibold text-gray-900">{deletingSchedule.day_of_week}</span>{' '}
              from{' '}
              <span className="font-semibold text-gray-900">
                {deletingSchedule.start_time.substring(0, 5)} - {deletingSchedule.end_time.substring(0, 5)}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setDeletingSchedule(null)}
                className="flex-1 px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSchedule}
                className="flex-1 px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default LawyerSchedule;
