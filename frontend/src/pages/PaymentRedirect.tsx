import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  consultation_fee: number | string;
  payment_status: string;
  lawyer: {
    first_name: string;
    last_name: string;
    specializations: Array<{ name: string }>;
  };
}

const PaymentRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await api.get(`/appointments/${appointmentId}`);
        console.log('Appointment data received:', response.data);

        // Check if appointment exists and has required data
        const appointmentData = response.data.appointment || response.data;

        if (!appointmentData || !appointmentData.lawyer) {
          console.error('Invalid appointment data structure:', appointmentData);
          navigate('/appointments');
          return;
        }

        setAppointment(appointmentData);
      } catch (error) {
        console.error('Error fetching appointment:', error);
        navigate('/appointments');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/appointments');
    }
  }, [countdown, navigate]);

  const handlePayNow = () => {
    navigate(`/appointments/${appointmentId}/payment`);
  };

  const handleViewAppointments = () => {
    navigate('/appointments');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatFee = (fee: number | string): string => {
    const feeNumber = typeof fee === 'number' ? fee : parseFloat(fee);
    return feeNumber.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Appointment Booked Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Your consultation has been scheduled
          </p>
        </div>

        {/* Appointment Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Lawyer</p>
                <p className="text-base font-semibold text-gray-900">
                  Atty. {appointment.lawyer?.first_name} {appointment.lawyer?.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  {appointment.lawyer?.specializations?.map(s => s.name).join(', ') || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(appointment.appointment_date)}
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {formatTime(appointment.appointment_time)}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Consultation Fee</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{formatFee(appointment.consultation_fee)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status Card */}
        {appointment.payment_status === 'unpaid' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 sm:p-8 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Payment Required
                </h3>
                <p className="text-yellow-800 mb-4">
                  Please complete your payment to confirm your appointment. Your slot will be reserved for 24 hours.
                </p>
                <button
                  onClick={handlePayNow}
                  className="w-full sm:w-auto bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Pay Now - ₱{formatFee(appointment.consultation_fee)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleViewAppointments}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View My Appointments
            </button>
            <button
              onClick={() => navigate('/lawyers')}
              className="flex-1 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Book Another Appointment
            </button>
          </div>

          {/* Auto-redirect countdown */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Redirecting to appointments in <span className="font-semibold text-blue-600">{countdown}</span> seconds...
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              <span className="text-gray-700">Complete your payment to confirm the appointment</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              <span className="text-gray-700">You'll receive a confirmation email with meeting details</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              <span className="text-gray-700">Join the consultation at the scheduled time</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PaymentRedirect;
