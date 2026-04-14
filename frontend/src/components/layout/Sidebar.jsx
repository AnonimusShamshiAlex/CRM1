import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  DollarSign,
  GitMerge,
  UserCog,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Phone,
  Trophy,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';

/* ──────────────────────────────────────────────
   Ролевые ограничения:
   roles: [] = видят все
   roles: ['admin','superadmin'] = только эти роли
────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    label: 'Дашборд',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: [], // все
  },
  {
    label: 'Лиды / Клиенты',
    icon: Users,
    path: '/clients',
    roles: [], // все
  },
  {
    label: 'Проекты',
    icon: FolderKanban,
    path: '/projects',
    roles: [], // все
  },
  {
    label: 'Задачи',
    icon: CheckSquare,
    path: '/tasks',
    roles: [], // все
  },
  {
    label: 'Воронки',
    icon: GitMerge,
    path: '/pipelines',
    roles: ['superadmin', 'admin', 'rop'],
  },
  {
    label: 'Финансы',
    icon: DollarSign,
    path: '/finance',
    // Маркетолог и менеджер НЕ видят финансы
    roles: ['superadmin', 'admin', 'rop'],
  },
  {
    label: 'Телефония',
    icon: Phone,
    path: '/telephony',
    roles: ['superadmin', 'admin', 'rop'],
  },
  {
    label: 'Менеджеры',
    icon: Trophy,
    path: '/managers/rating',
    roles: ['superadmin', 'admin', 'rop'],
  },
  {
    label: 'Аналитика',
    icon: BarChart2,
    path: '/managers/dashboard',
    // Маркетолог видит только свой дашборд
    roles: ['superadmin', 'admin', 'rop', 'marketer'],
  },
  {
    label: 'Команда',
    icon: UserCog,
    path: '/team',
    roles: ['superadmin', 'admin'],
  },
  {
    label: 'Настройки',
    icon: Settings,
    path: '/settings',
    // Маркетолог и менеджер НЕ видят настройки системы
    roles: ['superadmin', 'admin'],
  },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const userRole = user?.role || 'manager';

  // Фильтруем пункты меню по роли
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roles.length === 0) return true; // видят все
    return item.roles.includes(userRole);
  });

  const W = sidebarCollapsed ? 64 : 240;

  return (
    <aside style={{
      width: W,
      minHeight: '100vh',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: sidebarCollapsed ? '0 16px' : '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        gap: 10,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          color: '#fff',
          flexShrink: 0,
        }}>C</div>
        {!sidebarCollapsed && (
          <span style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            whiteSpace: 'nowrap',
          }}>CRM Studio</span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleItems.map((item) => (
          <SidebarLink
            key={item.path}
            item={item}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Role badge */}
      {!sidebarCollapsed && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {roleLabel(userRole)}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
        style={{
          position: 'absolute',
          bottom: 52,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          zIndex: 10,
        }}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

function SidebarLink({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '10px 18px' : '10px 16px',
        margin: '2px 8px',
        borderRadius: 8,
        textDecoration: 'none',
        color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
        background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
        fontWeight: isActive ? 500 : 400,
        fontSize: 14,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      })}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'var(--bg-sidebar-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function roleLabel(role) {
  const map = {
    superadmin: 'Суперадмин',
    admin: 'Администратор',
    rop: 'Руководитель отдела продаж',
    marketer: 'Маркетолог',
    manager: 'Менеджер',
  };
  return map[role] || role;
}
