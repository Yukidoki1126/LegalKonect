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
  private pollInterval: number = 5000; // 5 seconds when active
  private inactiveInterval: number = 30000; // 30 seconds when inactive
  private isTabActive: boolean = true;
  private lastNotificationIds: Set<number> = new Set();
  private isFirstLoad: boolean = true; // Track first load to skip showing old notifications

  constructor() {
    // Listen for tab visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
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
    this.checkNotifications(); // Check immediately
    this.restartPolling();
    
    console.log('[NotificationService] Started polling');
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
    try {
      const params: any = {};
      if (this.lastCheckTime) {
        params.since = this.lastCheckTime;
      }

      const response = await api.get<NotificationResponse>('/notifications', { params });
      const { notifications, unread_count, has_new } = response.data;

      // Notify all subscribers
      this.callbacks.forEach(cb => cb(notifications, unread_count));

      // On first load, just record existing notification IDs (don't show toasts)
      if (this.isFirstLoad) {
        this.lastNotificationIds = new Set(notifications.map(n => n.id));
        this.isFirstLoad = false;
        console.log('[NotificationService] First load - recorded', notifications.length, 'existing notifications');
      } else {
        // Check for new notifications and trigger toast
        notifications.forEach(notification => {
          if (!this.lastNotificationIds.has(notification.id) && !notification.read_at) {
            // This is a new notification - show toast!
            console.log('[NotificationService] New notification:', notification.title);
            this.newNotificationCallbacks.forEach(cb => cb(notification));
          }
        });

        // Update tracked IDs
        this.lastNotificationIds = new Set(notifications.map(n => n.id));
      }

      // Update last check time
      this.lastCheckTime = new Date().toISOString();
    } catch (error) {
      console.error('[NotificationService] Error checking notifications:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      // Refresh notifications
      await this.checkNotifications();
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/notifications/read-all');
      // Refresh notifications
      await this.checkNotifications();
    } catch (error) {
      console.error('[NotificationService] Error marking all notifications as read:', error);
    }
  }

  // Get current interval
  getCurrentInterval(): number {
    return this.isTabActive ? this.pollInterval : this.inactiveInterval;
  }

  // Force an immediate check
  forceCheck() {
    this.checkNotifications();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
