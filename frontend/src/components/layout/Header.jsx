import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import clsx from 'clsx';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetch: fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

const roleLabels = {
  admin: 'Администратор',
  director: 'Директор',
  head_of_sales: 'РОП',
  manager: 'Менеджер',
  executor: 'Исполнитель',
};
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-3">
      {/* Уведомления */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-sm">Уведомления</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700">
                  Прочитать все
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">Нет уведомлений</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) navigate(n.link); setShowNotif(false); }}
                    className={clsx(
                      'px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition',
                      !n.isRead && 'bg-primary-50/50'
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Пользователь */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setShowUser(!showUser)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500">{roleLabels[user?.role]}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {showUser && (
          <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
