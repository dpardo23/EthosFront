import { create } from 'zustand';
import type { Notification } from '@/shared/types';
import { notificationsService } from '@/shared/services';

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'userId'> & { type: Notification['type'] }) => void;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  addNotification: (notification) => {
    const nextNotification: Notification = {
      id: crypto.randomUUID(),
      userId: 'local-user',
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notification,
    };

    set((state) => ({
      notifications: [nextNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  fetchNotifications: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationsService.getNotifications(userId);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, loading: false });
    } catch {
      set({ error: 'Error al cargar notificaciones', loading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      set({ error: 'Error al marcar como leída' });
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await notificationsService.markAllAsRead(userId);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      set({ error: 'Error al marcar todas como leídas' });
    }
  },
}));
