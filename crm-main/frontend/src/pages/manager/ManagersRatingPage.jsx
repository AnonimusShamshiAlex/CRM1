import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import { formatMoney } from '../../utils/constants';

const ROLE_LABELS = {
  manager: 'Менеджер',
  head_of_sales: 'РОП',
  admin: 'Администратор',
  director: 'Директор',
};

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-bold text-gray-400 w-5 text-center">{rank}</span>;
}

export default function ManagersRatingPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/managers-rating')
      .then(({ data }) => setManagers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Рейтинг менеджеров</h1>
        <p className="text-sm text-gray-500 mt-1">Успеваемость по плану продаж за текущий месяц</p>
      </div>

      {managers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Нет данных по менеджерам</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-12">#</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Менеджер</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Роль</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Клиентов</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Факт (месяц)</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">План (месяц)</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-48">Выполнение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {managers.map((m, i) => {
                const pct = m.percentPlan;
                const barColor = pct === null
                  ? '#6b7280'
                  : pct >= 100 ? '#10b981'
                  : pct >= 70 ? '#f59e0b'
                  : '#ef4444';

                return (
                  <tr key={m.id} className={i < 3 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent hover:bg-yellow-50/50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <RankIcon rank={i + 1} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-700">
                              {m.name[0]}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ROLE_LABELS[m.role] || m.role}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.totalClients}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatMoney(m.factMonth)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {m.planMonth > 0 ? formatMoney(m.planMonth) : <span className="text-gray-300">Не задан</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium" style={{ color: barColor }}>
                            {pct !== null ? `${pct}%` : '—'}
                          </span>
                          {pct >= 100 && (
                            <span className="text-xs text-green-600 flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" /> Выполнен!
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: pct !== null ? `${Math.min(100, pct)}%` : '0%',
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
