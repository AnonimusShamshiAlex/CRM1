import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  Receipt,
  UsersRound,
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart2,
  Trophy,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';

export default function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  const role = user?.role;
  const isAdmin = ['admin', 'director'].includes(role);
  const isManager = ['admin', 'director', 'head_of_sales', 'manager'].includes(role);
  const isHeadOrAbove = ['admin', 'director', 'head_of_sales'].includes(role);

  const navigation = [
    { name: 'Дашборд', to: '/', icon: LayoutDashboard, show: true },
    { name: 'Клиенты', to: '/clients', icon: Users, show: true },
    { name: 'Воронки продаж', to: '/pipelines', icon: Layers, show: true },
    { name: 'Проекты', to: '/projects', icon: FolderKanban, show: true },
    { name: 'Задачи', to: '/tasks', icon: ListTodo, show: true },
    { name: 'Финансы', to: '/finance', icon: Receipt, show: isHeadOrAbove },
    { name: 'Мой дашборд', to: '/manager/dashboard', icon: BarChart2, show: isManager },
    { name: 'Рейтинг', to: '/managers/rating', icon: Trophy, show: isHeadOrAbove },
    { name: 'Команда', to: '/team', icon: UsersRound, show: true },
  ];

  const settingsNav = [
    { name: 'Поля клиента', to: '/settings/client-fields', icon: Settings, show: isAdmin },
  ];

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 z-30',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Логотип */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">CS</span>
        </div>
        {!collapsed && (
          <span className="ml-3 font-bold text-gray-900 text-lg">CRM Studio</span>
        )}
      </div>

      {/* Навигация */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navigation.filter(i => i.show).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}

        {/* Настройки (только admin) */}
        {settingsNav.filter(i => i.show).length > 0 && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Настройки
              </p>
            )}
            {settingsNav.filter(i => i.show).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Role badge */}
      {!collapsed && user && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate">{user.name}</p>
          <p className="text-[10px] text-primary-600 font-medium capitalize">{user.role}</p>
        </div>
      )}

      {/* Свернуть/развернуть */}
      <button
        onClick={toggleSidebar}
        className="m-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
