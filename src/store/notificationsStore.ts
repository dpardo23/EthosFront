import { create } from 'zustand';
import type { Notification } from '@/shared/types';
import { notificationsService } from '@/shared/services';

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'profileId'> & { type: Notification['type'] }) => void;
  fetchNotifications: (profileId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (profileId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  addNotification: (notification) => {
    const nextNotification: Notification = {
      id: crypto.randomUUID(),
      profileId: 'local-profile',
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notification,
    };

    set((state) => ({
      notifications: [nextNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  fetchNotifications: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationsService.getNotifications(profileId);
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

  markAllAsRead: async (profileId: string) => {
    try {
      await notificationsService.markAllAsRead(profileId);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      set({ error: 'Error al marcar todas como leídas' });
    }
  },
}));
