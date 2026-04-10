import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  ListTodo,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  Receipt,
} from 'lucide-react';
import api from '../api/axios';
import Badge from '../components/ui/Badge';
import { formatMoney, formatDate, getStatusInfo, TASK_PRIORITIES, PROJECT_STATUSES } from '../utils/constants';

function StatCard({ icon: Icon, label, value, color = 'primary', sub }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-success-50 text-success-600',
    yellow: 'bg-warning-50 text-warning-600',
    red: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: d } = await api.get('/dashboard');
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Ошибка загрузки дашборда</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>

      {/* Виджеты-карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban}
          label="Активные проекты"
          value={data.activeProjects.length}
          color="primary"
        />
        <StatCard
          icon={ListTodo}
          label="Мои задачи"
          value={data.myTasks.length}
          color="yellow"
          sub="на сегодня"
        />
        <StatCard
          icon={AlertTriangle}
          label="Просроченные"
          value={data.overdueTasks.length}
          color="red"
          sub="задач"
        />
        <StatCard
          icon={Users}
          label="Новые лиды"
          value={data.newLeads}
          color="green"
          sub="за неделю"
        />
      </div>

      {/* Финансы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success-600" />
            <h2 className="font-semibold text-gray-900">Выручка за месяц</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatMoney(data.finance.monthRevenue)}</p>
          <p className="text-sm text-gray-400 mt-1">
            Неоплачено: {formatMoney(data.finance.unpaidTotal)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-warning-600" />
              <h2 className="font-semibold text-gray-900">Неоплаченные счета</h2>
            </div>
            <Link to="/finance" className="text-sm text-primary-600 hover:text-primary-700">
              Все
            </Link>
          </div>
          {data.finance.unpaidInvoices.length === 0 ? (
            <p className="text-sm text-gray-400">Нет неоплаченных счетов</p>
          ) : (
            <div className="space-y-2">
              {data.finance.unpaidInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{inv.number}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{formatDate(inv.dueDate)}</span>
                    <span className="font-medium">{formatMoney(inv.total - inv.paidAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Активные проекты и мои задачи */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Проекты */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Активные проекты</h2>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700">
              Все проекты
            </Link>
          </div>
          {data.activeProjects.length === 0 ? (
            <p className="text-sm text-gray-400">Нет активных проектов</p>
          ) : (
            <div className="space-y-3">
              {data.activeProjects.map((p) => {
                const st = getStatusInfo(PROJECT_STATUSES, p.status);
                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">Дедлайн: {formatDate(p.deadline)}</p>
                    </div>
                    <Badge variant={st.color}>{st.label}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Задачи */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Мои задачи на сегодня</h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
              Все задачи
            </Link>
          </div>
          {data.myTasks.length === 0 ? (
            <p className="text-sm text-gray-400">Нет задач на сегодня</p>
          ) : (
            <div className="space-y-2">
              {data.myTasks.map((t) => {
                const pr = getStatusInfo(TASK_PRIORITIES, t.priority);
                return (
                  <Link
                    key={t.id}
                    to={`/tasks/${t.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <p className="text-sm text-gray-900">{t.title}</p>
                    <Badge variant={pr.color}>{pr.label}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Просроченные задачи */}
      {data.overdueTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-danger-200 p-5">
          <h2 className="font-semibold text-danger-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Просроченные задачи
          </h2>
          <div className="space-y-2">
            {data.overdueTasks.map((t) => (
              <Link
                key={t.id}
                to={`/tasks/${t.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-danger-50/50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-400">
                    Дедлайн: {formatDate(t.deadline)}
                    {t.assignee && ` | ${t.assignee.name}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
