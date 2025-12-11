import React, { useState, useRef, useEffect } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { CreditCard, Smartphone, Building2, Upload, Trash2, Save, CheckCircle, AlertCircle, X, Edit2 } from 'lucide-react';
import { STORAGE_URL } from '../../config/api.config';

// Helper to get full image URL
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/storage')) return STORAGE_URL + path;
  return STORAGE_URL + '/storage/' + path;
};

interface PaymentInfo {
  gcash_number?: string;
  gcash_account_name?: string;
  gcash_qr_code?: string | null;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  preferred_payout_method?: 'gcash' | 'bank';
}

interface PaymentSettingsProps {
  initialData?: PaymentInfo;
  onUpdate?: () => void;
}

const PaymentSettings: React.FC<PaymentSettingsProps> = ({ initialData, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  const [formData, setFormData] = useState<PaymentInfo>({
    gcash_number: '',
    gcash_account_name: '',
    gcash_qr_code: null,
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    preferred_payout_method: 'gcash',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveGcash = async () => {
    setLoading(true);
    setError('');
    try {
      await lawyerApi.updatePaymentInfo({
        gcash_number: formData.gcash_number,
        gcash_account_name: formData.gcash_account_name,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name,
        preferred_payout_method: 'gcash',
      });
      setFormData(prev => ({ ...prev, preferred_payout_method: 'gcash' }));
      setSuccess('GCash details saved successfully!');
      onUpdate?.();
      setShowGcashModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save GCash details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async () => {
    setLoading(true);
    setError('');
    try {
      await lawyerApi.updatePaymentInfo({
        gcash_number: formData.gcash_number,
        gcash_account_name: formData.gcash_account_name,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name,
        preferred_payout_method: 'bank',
      });
      setFormData(prev => ({ ...prev, preferred_payout_method: 'bank' }));
      setSuccess('Bank details saved successfully!');
      onUpdate?.();
      setShowBankModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setUploadingQr(true);
    setError('');

    try {
      const response = await lawyerApi.uploadGcashQr(file);
      setFormData(prev => ({
        ...prev,
        gcash_qr_code: response.gcash_qr_url,
      }));
      setSuccess('GCash QR code uploaded successfully!');
      onUpdate?.();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload QR code');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleDeleteQr = async () => {
    if (!window.confirm('Are you sure you want to delete the QR code?')) return;

    try {
      await lawyerApi.deleteGcashQr();
      setFormData(prev => ({
        ...prev,
        gcash_qr_code: null,
      }));
      setSuccess('GCash QR code deleted successfully!');
      onUpdate?.();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete QR code');
    }
  };

  const hasGcashInfo = formData.gcash_number || formData.gcash_account_name;
  const hasBankInfo = formData.bank_name || formData.bank_account_number;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
          <p className="text-sm text-gray-500">Set up your payment accounts for client payments</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Compact Payment Method Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* GCash Card */}
        <div
          onClick={() => setShowGcashModal(true)}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
            formData.preferred_payout_method === 'gcash'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">GCash</span>
            </div>
            <Edit2 className="w-4 h-4 text-gray-400" />
          </div>
          {hasGcashInfo ? (
            <div className="text-sm text-gray-600">
              <p className="truncate">{formData.gcash_number || 'No number'}</p>
              <p className="truncate text-xs text-gray-500">{formData.gcash_account_name || 'No name'}</p>
              {formData.gcash_qr_code && (
                <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">QR Added</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Click to set up</p>
          )}
          {formData.preferred_payout_method === 'gcash' && (
            <span className="inline-block mt-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Primary</span>
          )}
        </div>

        {/* Bank Card */}
        <div
          onClick={() => setShowBankModal(true)}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
            formData.preferred_payout_method === 'bank'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">Bank Transfer</span>
            </div>
            <Edit2 className="w-4 h-4 text-gray-400" />
          </div>
          {hasBankInfo ? (
            <div className="text-sm text-gray-600">
              <p className="truncate">{formData.bank_name || 'No bank'}</p>
              <p className="truncate text-xs text-gray-500">
                {formData.bank_account_number ? `****${formData.bank_account_number.slice(-4)}` : 'No account'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Click to set up</p>
          )}
          {formData.preferred_payout_method === 'bank' && (
            <span className="inline-block mt-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">Primary</span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Click a payment method to edit details. Your primary method will be shown to clients.
      </p>

      {/* GCash Modal */}
      {showGcashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">GCash Details</h3>
              </div>
              <button onClick={() => setShowGcashModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GCash Number</label>
                <input
                  type="text"
                  name="gcash_number"
                  value={formData.gcash_number || ''}
                  onChange={handleInputChange}
                  placeholder="09XX XXX XXXX"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  name="gcash_account_name"
                  value={formData.gcash_account_name || ''}
                  onChange={handleInputChange}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* QR Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GCash QR Code (Optional)</label>
                <div className="flex items-start gap-4">
                  {formData.gcash_qr_code ? (
                    <div className="relative">
                      <img
                        src={getImageUrl(formData.gcash_qr_code) || ""}
                        alt="GCash QR"
                        className="w-28 h-28 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteQr}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                    >
                      {uploadingQr ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Upload QR</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 flex-1">
                    Upload your GCash QR code so clients can scan it for easy payment. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGcashModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGcash}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Set Primary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Bank Transfer Details</h3>
              </div>
              <button onClick={() => setShowBankModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <select
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Bank</option>
                  <option value="BDO">BDO</option>
                  <option value="BPI">BPI</option>
                  <option value="Metrobank">Metrobank</option>
                  <option value="UnionBank">UnionBank</option>
                  <option value="Landbank">Landbank</option>
                  <option value="PNB">PNB</option>
                  <option value="Security Bank">Security Bank</option>
                  <option value="RCBC">RCBC</option>
                  <option value="Chinabank">Chinabank</option>
                  <option value="EastWest">EastWest</option>
                  <option value="Maya Bank">Maya Bank</option>
                  <option value="GoTyme Bank">GoTyme Bank</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number || ''}
                  onChange={handleInputChange}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  name="bank_account_name"
                  value={formData.bank_account_name || ''}
                  onChange={handleInputChange}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBankModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBank}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Set Primary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettings;
