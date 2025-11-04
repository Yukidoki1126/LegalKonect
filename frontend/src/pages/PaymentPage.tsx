import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  consultation_fee: number;
  lawyer: {
    first_name: string;
    last_name: string;
  };
}

const PaymentPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [error, setError] = useState('');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      setAppointment(response.data.appointment);
    } catch (err) {
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    // Step 1: Create Payment Intent
    const intentResponse = await api.post(`/appointments/${appointmentId}/payment-intent`);
    const { payment_intent_id } = intentResponse.data;

    // Step 2: Create Payment Method
    const paymentMethodPayload = {
      type: 'card',
      card_number: cardNumber.replace(/\s/g, ''),
      exp_month: parseInt(expMonth),
      exp_year: parseInt(expYear),
      cvc: cvc,
    };

    const methodResponse = await api.post('/payment-methods', paymentMethodPayload);
    const { payment_method_id } = methodResponse.data;

    // Step 3: Attach Payment Method and Confirm
    const paymentResponse = await api.post('/payments/attach', {
      payment_intent_id,
      payment_method_id,
      appointment_id: appointmentId,
      payment_method_type: 'card'
    });

    // Check if payment requires 3D Secure authentication
    if (paymentResponse.data.status === 'awaiting_next_action') {
      window.location.href = paymentResponse.data.redirect_url;
      return;
    }

    if (paymentResponse.data.status === 'succeeded') {
      navigate('/appointments', {
        state: { message: 'Payment successful! Appointment confirmed.' }
      });
    } else {
      setError('Payment is being processed. Please check your appointments.');
      setTimeout(() => navigate('/appointments'), 3000);
    }
  };

  const handleEWalletPayment = async () => {
    // Step 1: Create Payment Intent
    const intentResponse = await api.post(`/appointments/${appointmentId}/payment-intent`);
    const { payment_intent_id } = intentResponse.data;

    // Step 2: Create Source for GCash/PayMaya
    const sourceResponse = await api.post('/payment-sources', {
      type: paymentMethod,
      amount: appointment!.consultation_fee,
      payment_intent_id: payment_intent_id,
      appointment_id: appointmentId
    });

    // Redirect to GCash/PayMaya checkout
    if (sourceResponse.data.redirect_url) {
      window.location.href = sourceResponse.data.redirect_url;
    } else {
      throw new Error('No redirect URL received');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      if (paymentMethod === 'card') {
        await handleCardPayment();
      } else if (paymentMethod === 'gcash' || paymentMethod === 'paymaya') {
        await handleEWalletPayment();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'Appointment not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment</h1>

        {/* Appointment Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Lawyer:</strong> {appointment.lawyer.first_name} {appointment.lawyer.last_name}
            </p>
            <p className="text-gray-700">
              <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
            </p>
            <p className="text-gray-700">
              <strong>Time:</strong> {appointment.appointment_time}
            </p>
            <div className="border-t pt-4 mt-4">
              <p className="text-2xl font-bold text-blue-600">
                Total: ₱{appointment.consultation_fee.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>

          <form onSubmit={handlePayment} className="space-y-6">
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg font-medium transition ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  💳 Credit/Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('gcash')}
                  className={`p-4 border-2 rounded-lg font-medium transition ${
                    paymentMethod === 'gcash'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  📱 GCash
                </button>
              </div>
            </div>

            {/* Card Details (only show if card is selected) */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                      setCardNumber(formatted);
                    }}
                    placeholder="4343 4343 4343 4345"
                    maxLength={19}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <input
                      type="text"
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      placeholder="12"
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="text"
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      placeholder="2025"
                      maxLength={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Test card: 4343 4343 4343 4345 | Any future date | Any 3-digit CVC
                </p>
              </div>
            )}

            {/* GCash Message */}
            {paymentMethod === 'gcash' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">
                  ✓ You will be redirected to GCash to complete your payment securely.
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  After payment, you'll be redirected back to your appointments page.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition"
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay ₱${appointment.consultation_fee.toLocaleString()}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;