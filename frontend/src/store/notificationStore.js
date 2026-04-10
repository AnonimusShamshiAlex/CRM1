import { create } from 'zustand';
import api from '../api/axios';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetch: async () => {
    try {
      const { data } = await api.get('/notifications');
      const unread = data.filter((n) => !n.isRead).length;
      set({ notifications: data, unreadCount: unread });
    } catch {
      // игнорируем
    }
  },

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await api.patch('/notifications/read-all');
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));

export default useNotificationStore;
