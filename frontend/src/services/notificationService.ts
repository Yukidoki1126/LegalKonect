// Notification Polling Service
// Handles real-time updates via smart AJAX polling

import api from './api';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at: string | null;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
  has_new: boolean;
}

type NotificationCallback = (notifications: Notification[], unreadCount: number) => void;
type NewNotificationCallback = (notification: Notification) => void;

class NotificationService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheckTime: string | null = null;
  private isPolling: boolean = false;
  private callbacks: NotificationCallback[] = [];
  private newNotificationCallbacks: NewNotificationCallback[] = [];
  private pollInterval: number = 3000; // 3 seconds when active (faster)
  private inactiveInterval: number = 15000; // 15 seconds when inactive (faster)
  private isTabActive: boolean = true;
  private lastNotificationIds: Set<number> = new Set();
  private isFirstLoad: boolean = true;
  private isChecking: boolean = false; // Prevent concurrent checks
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    // Listen for tab visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      
      // Also listen for focus events for better responsiveness
      window.addEventListener('focus', this.handleWindowFocus);
    }
  }

  private handleVisibilityChange = () => {
    this.isTabActive = !document.hidden;
    
    // Immediately check for updates when tab becomes active
    if (this.isTabActive && this.isPolling) {
      this.checkNotifications();
    }
    
    // Adjust polling interval
    this.restartPolling();
  };

  private handleWindowFocus = () => {
    // Immediate check when window gets focus
    if (this.isPolling && !this.isChecking) {
      this.checkNotifications();
    }
  };

  private restartPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.isPolling) {
      const interval = this.isTabActive ? this.pollInterval : this.inactiveInterval;
      this.intervalId = setInterval(() => this.checkNotifications(), interval);
    }
  }

  // Start polling for notifications
  start(interval?: number) {
    if (interval) {
      this.pollInterval = interval;
    }
    
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.retryCount = 0; // Reset retry count
    this.checkNotifications(); // Check immediately
    this.restartPolling();
    
    console.log('[NotificationService] Started polling with', this.pollInterval + 'ms interval');
  }

  // Stop polling
  stop() {
    this.isPolling = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[NotificationService] Stopped polling');
  }

  // Subscribe to notification updates
  subscribe(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to new notifications (for toast)
  onNewNotification(callback: NewNotificationCallback): () => void {
    this.newNotificationCallbacks.push(callback);
    return () => {
      this.newNotificationCallbacks = this.newNotificationCallbacks.filter(cb => cb !== callback);
    };
  }

  // Check for new notifications
  private async checkNotifications() {
    // Prevent concurrent checks
    if (this.isChecking) {
      return;
    }

    this.isChecking = true;

    try {
      const params: any = {};
      if (this.lastCheckTime) {
        params.since = this.lastCheckTime;
      }

      const response = await api.get<NotificationResponse>('/notifications', { 
        params,
        timeout: 5000 // 5 second timeout
      });
      const { notifications, unread_count, has_new } = response.data;

      // Reset retry count on success
      this.retryCount = 0;

      // Notify all subscribers
      this.callbacks.forEach(cb => {
        try {
          cb(notifications, unread_count);
        } catch (err) {
          console.error('[NotificationService] Error in callback:', err);
        }
      });

      // On first load, just record existing notification IDs (don't show toasts)
      if (this.isFirstLoad) {
        this.lastNotificationIds = new Set(notifications.map(n => n.id));
        this.isFirstLoad = false;
        console.log('[NotificationService] First load - recorded', notifications.length, 'existing notifications');
      } else {
        // Check for new notifications and trigger toast
        const newNotifications: Notification[] = [];
        
        notifications.forEach(notification => {
          if (!this.lastNotificationIds.has(notification.id) && !notification.read_at) {
            newNotifications.push(notification);
          }
        });

        // Show toasts for new notifications
        if (newNotifications.length > 0) {
          console.log('[NotificationService]', newNotifications.length, 'new notification(s)');
          newNotifications.forEach(notification => {
            this.newNotificationCallbacks.forEach(cb => {
              try {
                cb(notification);
              } catch (err) {
                console.error('[NotificationService] Error in new notification callback:', err);
              }
            });
          });
        }

        // Update tracked IDs
        this.lastNotificationIds = new Set(notifications.map(n => n.id));
      }

      // Update last check time
      this.lastCheckTime = new Date().toISOString();
    } catch (error: any) {
      console.error('[NotificationService] Error checking notifications:', error?.message || error);
      
      // Implement exponential backoff on errors
      this.retryCount++;
      if (this.retryCount <= this.maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
        console.log(`[NotificationService] Retrying in ${retryDelay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.checkNotifications(), retryDelay);
      }
    } finally {
      this.isChecking = false;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      // Force immediate check (bypasses isChecking flag)
      this.isChecking = false;
      await this.checkNotifications();
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/notifications/read-all');
      // Force immediate check (bypasses isChecking flag)
      this.isChecking = false;
      await this.checkNotifications();
    } catch (error) {
      console.error('[NotificationService] Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get current interval
  getCurrentInterval(): number {
    return this.isTabActive ? this.pollInterval : this.inactiveInterval;
  }

  // Force an immediate check
  forceCheck() {
    this.isChecking = false; // Bypass lock
    this.checkNotifications();
  }

  // Clean up resources
  destroy() {
    this.stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('focus', this.handleWindowFocus);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
