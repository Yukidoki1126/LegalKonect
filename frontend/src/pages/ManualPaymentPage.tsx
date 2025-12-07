import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const STORAGE_URL = 'http://localhost:8000';

// Helper to get full image URL
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/storage')) return STORAGE_URL + path;
  return STORAGE_URL + '/storage/' + path;
};

interface PaymentMethod {
  gcash?: {
    number: string;
    account_name: string;
    qr_code: string | null;
  };
  bank?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
}

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  consultation_fee: number;
  status: string;
  payment_status: string;
  payment_proof?: string;
  lawyer: {
    id: number;
    first_name: string;
    last_name: string;
    reservation_fee?: number;
    payment_methods?: PaymentMethod;
    preferred_payment_method?: string;
    has_payment_info?: boolean;
  };
}

const ManualPaymentPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'gcash' | 'bank'>('gcash');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAppointmentAndPaymentInfo();
  }, [appointmentId]);

  const fetchAppointmentAndPaymentInfo = async () => {
    try {
      setLoading(true);
      
      // Fetch appointment details
      const appointmentRes = await api.get(`/appointments/${appointmentId}`);
      const apt = appointmentRes.data.appointment;
      setAppointment(apt);

      // Fetch lawyer's payment info
      const paymentInfoRes = await api.get(`/lawyers/${apt.lawyer.id}/payment-info`);
      setPaymentMethods(paymentInfoRes.data.payment_methods);
      
      // Set default payment method based on what's available
      if (paymentInfoRes.data.payment_methods.gcash) {
        setSelectedMethod('gcash');
      } else if (paymentInfoRes.data.payment_methods.bank) {
        setSelectedMethod('bank');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile) {
      setError('Please select a payment proof image');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('payment_proof', proofFile);
      formData.append('payment_method_used', selectedMethod);

      await api.post(`/appointments/${appointmentId}/upload-payment-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/appointments', {
          state: { message: 'Payment proof uploaded! Waiting for lawyer confirmation.' }
        });
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 font-medium">{error || 'Appointment not found'}</p>
            <button
              onClick={() => navigate('/appointments')}
              className="mt-4 text-red-600 hover:underline"
            >
              Go back to appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Proof Uploaded!</h2>
          <p className="text-gray-600 mb-6">
            Your payment is being verified by the lawyer. You'll receive a notification once confirmed.
          </p>
          <p className="text-sm text-gray-500">Redirecting to appointments...</p>
        </div>
      </div>
    );
  }

  const hasGcash = paymentMethods?.gcash;
  const hasBank = paymentMethods?.bank;
  const noPaymentMethods = !hasGcash && !hasBank;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">
            Pay directly to the lawyer's account and upload your receipt
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Appointment & Payment Method */}
          <div className="space-y-6">
            {/* Appointment Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span> Appointment Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Lawyer</p>
                  <p className="font-medium text-gray-900">
                    Atty. {appointment.lawyer.first_name} {appointment.lawyer.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    <span className="text-gray-600 ml-2">{appointment.appointment_time}</span>
                  </p>
                </div>
              </div>

              {/* Fee Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Total Fee</span>
                  <span className="font-semibold">₱{appointment.consultation_fee.toLocaleString()}</span>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Pay Now</p>
                      <p className="text-xs text-gray-600">₱{(appointment.consultation_fee - (appointment.lawyer.reservation_fee || 100)).toLocaleString()} due at office</p>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      ₱{(appointment.lawyer.reservation_fee || 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {noPaymentMethods ? (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-amber-800 mb-2">Payment Info Not Available</h3>
                <p className="text-amber-700 text-sm mb-4">
                  The lawyer hasn't set up payment accounts yet.
                </p>
                <button
                  onClick={() => navigate('/appointments')}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">💳</span> Payment Method
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {hasGcash && (
                    <button
                      onClick={() => setSelectedMethod('gcash')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedMethod === 'gcash'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">📱</div>
                      <p className="font-semibold text-gray-900 text-sm">GCash</p>
                    </button>
                  )}
                  {hasBank && (
                    <button
                      onClick={() => setSelectedMethod('bank')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedMethod === 'bank'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🏦</div>
                      <p className="font-semibold text-gray-900 text-sm">Bank</p>
                    </button>
                  )}
                </div>

                {/* Payment Details */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                  {selectedMethod === 'gcash' && paymentMethods?.gcash && (
                    <div>
                      {paymentMethods.gcash.qr_code && (
                        <div className="mb-3 text-center">
                          <img
                            src={getImageUrl(paymentMethods.gcash.qr_code) || ""}
                            alt="GCash QR Code"
                            className="w-48 h-48 mx-auto rounded-lg border-2 border-blue-300 shadow-md bg-white"
                            style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
                          />
                          <p className="text-xs text-gray-500 mt-2">Scan with GCash app</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                          <span className="text-gray-600 text-sm">Number</span>
                          <span className="font-mono font-semibold text-sm">{paymentMethods.gcash.number}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                          <span className="text-gray-600 text-sm">Name</span>
                          <span className="font-semibold text-sm">{paymentMethods.gcash.account_name}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'bank' && paymentMethods?.bank && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-gray-600 text-sm">Bank</span>
                        <span className="font-semibold text-sm">{paymentMethods.bank.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-gray-600 text-sm">Account #</span>
                        <span className="font-mono font-semibold text-sm">{paymentMethods.bank.account_number}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-gray-600 text-sm">Name</span>
                        <span className="font-semibold text-sm">{paymentMethods.bank.account_name}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Send:</strong> ₱{(appointment.lawyer.reservation_fee || 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Upload & Actions */}
          <div className="space-y-6">
            {/* Upload Payment Proof */}
            {!noPaymentMethods && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📤</span> Upload Payment Proof
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  After payment, upload a screenshot of your receipt.
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    proofPreview
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {proofPreview ? (
                    <div>
                      <img
                        src={proofPreview}
                        alt="Payment proof preview"
                        className="max-h-48 mx-auto rounded-lg shadow-md mb-3"
                      />
                      <p className="text-green-600 font-medium text-sm">✓ Receipt uploaded</p>
                      <p className="text-xs text-gray-500 mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium text-sm">Click to upload receipt</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-red-700 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleUploadProof}
                    disabled={!proofFile || uploading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Payment Proof
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/appointments')}
                    className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pay Later
                  </button>
                </div>

                {/* Help Text */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Need help?{' '}
                    <a href="mailto:support@legalkonect.com" className="text-blue-600 hover:underline">
                      support@legalkonect.com
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualPaymentPage;
