import { useEffect, useState } from 'react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { TrendingUp, Users, Target, Calendar, ChevronUp } from 'lucide-react';
import { formatMoney } from '../../utils/constants';

function ProgressBar({ value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{pct}% плана</span>
        <span className="text-xs font-medium text-gray-700">{formatMoney(value)} / {formatMoney(max)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/manager-stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { plans = {}, facts = {}, totalClients = 0, stageDistribution = {} } = stats || {};

  const periods = [
    { key: 'day', label: 'Сегодня', icon: Calendar, color: '#6366f1' },
    { key: 'week', label: 'Эта неделя', icon: TrendingUp, color: '#10b981' },
    { key: 'month', label: 'Этот месяц', icon: Target, color: '#f59e0b' },
  ];

  const totalDistrib = Object.values(stageDistribution).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Мой дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">Личные результаты — {user?.name}</p>
      </div>

      {/* Карточки план-факт */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periods.map(({ key, label, icon: Icon, color }) => {
          const plan = plans[key] || 0;
          const fact = facts[key] || 0;
          const pct = plan > 0 ? Math.round((fact / plan) * 100) : 0;
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">План-факт</p>
                </div>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-900">{formatMoney(fact)}</span>
              </div>
              <ProgressBar value={fact} max={plan} color={color} />
              {plan === 0 && (
                <p className="text-xs text-gray-400 mt-2">План не установлен</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Всего клиентов */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Мои клиенты</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalClients}</p>
          <p className="text-sm text-gray-400 mt-1">Всего лидов и клиентов</p>
        </div>

        {/* Конверсии по этапам */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Распределение по этапам</h3>
          {Object.keys(stageDistribution).length === 0 ? (
            <p className="text-sm text-gray-400">Нет данных</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stageDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([stage, count]) => {
                  const pct = totalDistrib > 0 ? Math.round((count / totalDistrib) * 100) : 0;
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-32 truncate">{stage}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
