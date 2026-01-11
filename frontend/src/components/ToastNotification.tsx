// Toast Notification Component
// Shows popup notifications for real-time updates

import React, { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/notificationService';

interface Toast {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ position = 'top-right' }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Map notification types to toast types
  const getToastType = (notificationType: string): Toast['type'] => {
    switch (notificationType) {
      case 'appointment_created':
      case 'payment_received':
      case 'reschedule_accepted':
      case 'case_closed':
        return 'success';
      case 'reschedule_requested':
      case 'reschedule_declined':
      case 'appointment_cancelled':
        return 'warning';
      case 'appointment_reminder':
      case 'new_review':
      case 'case_updated':
        return 'info';
      default:
        return 'info';
    }
  };

  // Start polling when component mounts (only if user is logged in)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      notificationService.start(3000); // Poll every 3 seconds for faster updates
      console.log('[ToastNotification] Started notification polling (3s interval)');
    }

    return () => {
      notificationService.stop();
    };
  }, []);

  // Subscribe to new notifications
  useEffect(() => {
    const unsubscribe = notificationService.onNewNotification((notification: Notification) => {
      console.log('[ToastNotification] New notification received:', notification.title);
      
      try {
        addToast({
          type: getToastType(notification.type),
          title: notification.title,
          message: notification.message,
          duration: 6000,
        });

        // Play notification sound (optional)
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignore if autoplay is blocked
        } catch (e) {
          // Ignore audio errors
        }
      } catch (err) {
        console.error('[ToastNotification] Error displaying toast:', err);
      }
    });

    return () => unsubscribe();
  }, [addToast, getToastType]);

  // Expose addToast globally for manual triggers
  useEffect(() => {
    (window as any).showToast = addToast;
    return () => {
      delete (window as any).showToast;
    };
  }, [addToast]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBorderColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-orange-500';
      case 'error': return 'border-l-red-500';
      default: return 'border-l-blue-500';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-[100] space-y-3 max-w-sm w-full pointer-events-none`}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-white rounded-lg shadow-lg border border-gray-200 border-l-4 ${getBorderColor(toast.type)} p-4 transform transition-all duration-300 animate-slide-in`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ToastNotification;

// Helper function to show toast from anywhere
export const showToast = (toast: Omit<Toast, 'id'>) => {
  if ((window as any).showToast) {
    (window as any).showToast(toast);
  }
};
