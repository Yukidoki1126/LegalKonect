import React, { useEffect, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  requireCountdown?: boolean;
  countdownSeconds?: number;
  userDetails?: {                   
    name: string;
    email: string;
    type?: string;
    appointments?: number;
  };
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
  requireCountdown = false,
  countdownSeconds = 5,
  userDetails  
}) => {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isEnabled, setIsEnabled] = useState(!requireCountdown);

  useEffect(() => {
    if (isOpen && requireCountdown) {
      setCountdown(countdownSeconds);
      setIsEnabled(false);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (isOpen && !requireCountdown) {
      setIsEnabled(true);
    } else if (!isOpen) {
      // Reset state when modal closes
      setCountdown(countdownSeconds);
      setIsEnabled(!requireCountdown);
    }
  }, [isOpen, requireCountdown, countdownSeconds]);
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-400',
          iconBg: 'bg-red-500/20',
          button: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
          buttonDisabled: 'bg-red-500/50 cursor-not-allowed'
        };
      case 'warning':
        return {
          icon: 'text-yellow-400',
          iconBg: 'bg-yellow-500/20',
          button: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
          buttonDisabled: 'bg-yellow-500/50 cursor-not-allowed'
        };
      case 'info':
        return {
          icon: 'text-blue-400',
          iconBg: 'bg-blue-500/20',
          button: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
          buttonDisabled: 'bg-blue-500/50 cursor-not-allowed'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 transform transition-all animate-in zoom-in-95 duration-200">
          {/* Icon */}
          <div className="flex items-center justify-center pt-8">
            <div className={`w-16 h-16 rounded-full ${colors.iconBg} flex items-center justify-center relative`}>
              {type === 'danger' && (
                <svg className={`w-8 h-8 ${colors.icon} relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {type === 'warning' && (
                <svg className={`w-8 h-8 ${colors.icon} relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {type === 'info' && (
                <svg className={`w-8 h-8 ${colors.icon} relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              
        {/* Countdown Circle */}
              {requireCountdown && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-16 h-16 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      className={colors.icon}
                      opacity="0.2"
                    />
                    {/* Progress circle - perfectly aligned */}
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      className={colors.icon}
                      strokeDasharray={`${2 * Math.PI * 30}`}
                      strokeDashoffset={`${(1 - countdown / countdownSeconds) * (2 * Math.PI * 30)}`}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dashoffset 1s linear'
                      }}
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              {title}
            </h3>
            
            {/* User Details Card */}
            {userDetails && (
              <div className="mb-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {userDetails.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold text-base">
                      {userDetails.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {userDetails.email}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {userDetails.type && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userDetails.type === 'Lawyer' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {userDetails.type}
                        </span>
                      )}
                      {userDetails.appointments !== undefined && (
                        <span className="text-xs text-gray-400">
                          📅 {userDetails.appointments} appointment{userDetails.appointments !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-gray-400 text-sm leading-relaxed">
              {message}
            </p>
            
            {/* Countdown Notice */}
            {requireCountdown && countdown > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm font-medium">
                  ⏱️ Please wait {countdown} second{countdown !== 1 ? 's' : ''} before confirming
                </p>
              </div>
            )}

            {requireCountdown && countdown === 0 && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm font-medium">
                  ✓ You can now proceed with this action
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-8 pb-8">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={!isEnabled}
              className={`flex-1 px-6 py-3 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                isEnabled 
                  ? `${colors.button} transform hover:scale-[1.02]`
                  : colors.buttonDisabled
              }`}
            >
              {!isEnabled && countdown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {countdown}s
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;