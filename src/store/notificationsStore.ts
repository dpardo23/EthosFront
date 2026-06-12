import { create } from 'zustand';
import type { Notification } from '@/shared/types';
import { notificationsService } from '@/shared/services/notificationsService';

/**
 * Zustand store for in-app notifications. Persisted notifications come from
 * core.notifications (fed by database triggers on real platform events);
 * addNotification additionally surfaces ephemeral client-side events
 * (e.g. realtime chat) without persisting them.
 */
interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'profileId'> & { type: Notification['type'] }) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const LOCAL_ID_PREFIX = 'local-';

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  addNotification: (notification) => {
    const nextNotification: Notification = {
      id: `${LOCAL_ID_PREFIX}${crypto.randomUUID()}`,
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

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationsService.getNotifications();
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, loading: false });
    } catch {
      set({ error: 'Error al cargar notificaciones', loading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      if (!notificationId.startsWith(LOCAL_ID_PREFIX)) {
        await notificationsService.markAsRead(notificationId);
      }
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

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      set({ error: 'Error al marcar todas como leídas' });
    }
  },
}));
