import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, ChevronDown, User, LogOut, Settings, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useThemeStore from '../../store/themeStore';
import GlobalSearch from '../ui/GlobalSearch';

const roleLabels = {
  superadmin: 'Суперадмин',
  admin: 'Администратор',
  rop: 'РОП',
  marketer: 'Маркетолог',
  manager: 'Менеджер',
};

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef();
  const notifRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header style={{
      height: 60,
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* ТЗ: Глобальный поиск по всем сущностям */}
      <GlobalSearch />

      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <IconBtn title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'} onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </IconBtn>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <IconBtn onClick={() => setNotifOpen(v => !v)}>
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--danger)', border: '2px solid var(--bg-card)',
            }} />
          )}
        </IconBtn>

        {notifOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 320, background: 'var(--bg-card)',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: 14 }}>
              Уведомления
            </div>
            {unreadCount === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                Нет новых уведомлений
              </div>
            ) : (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 13 }}>У вас {unreadCount} новых уведомлений</div>
              </div>
            )}
            <button
              onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
              style={{
                width: '100%', padding: '10px', background: 'none', border: 'none',
                borderTop: '1px solid var(--border-color)', cursor: 'pointer',
                fontSize: 13, color: 'var(--accent)',
              }}
            >
              Смотреть все
            </button>
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-primary)',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {user?.position || roleLabels[user?.role] || user?.role}
            </div>
          </div>
          <ChevronDown size={13} color="var(--text-tertiary)" />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            minWidth: 210, background: 'var(--bg-card)',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)', overflow: 'hidden', zIndex: 200,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</div>
              {user?.position && (
                <span style={{
                  marginTop: 6, display: 'inline-block', fontSize: 11,
                  padding: '2px 8px', borderRadius: 99,
                  background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 500,
                }}>{user.position}</span>
              )}
            </div>
            <DItem icon={<User size={14} />} label="Мой профиль" onClick={() => { navigate('/profile'); setDropdownOpen(false); }} />
            <DItem icon={<Clock size={14} />} label="История действий" onClick={() => { navigate('/activity-log'); setDropdownOpen(false); }} />
            <DItem icon={<Settings size={14} />} label="Настройки" onClick={() => { navigate('/settings'); setDropdownOpen(false); }} />
            <div style={{ borderTop: '1px solid var(--border-color)' }} />
            <DItem icon={<LogOut size={14} />} label="Выйти" onClick={handleLogout} danger />
          </div>
        )}
      </div>
    </header>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      position: 'relative', width: 36, height: 36,
      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  );
}

function DItem({ icon, label, onClick, danger }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '9px 16px', background: h ? 'var(--bg-tertiary)' : 'transparent',
        border: 'none', cursor: 'pointer',
        color: danger ? 'var(--danger)' : 'var(--text-primary)', fontSize: 13, textAlign: 'left',
      }}
    >
      {icon}{label}
    </button>
  );
}
