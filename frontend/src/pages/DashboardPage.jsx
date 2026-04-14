import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, DollarSign, CheckSquare,
  AlertCircle, ArrowRight, Target
} from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n || 0);

const fmtMoney = (n) => fmt(n) + ' UZS';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/tasks?deadline=today&limit=5'),
        ]);
        setStats(statsRes.data);
        setUrgentTasks(tasksRes.data?.tasks || tasksRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 17) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {loading ? <SkeletonGrid /> : (
        <>
          {/* ТЗ: ключевые виджеты — LTV, CAC, активные сделки, прогноз выручки */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}>
            <StatCard
              icon={<TrendingUp size={20} />}
              label="LTV (ср. жизненная ценность)"
              value={fmtMoney(stats?.ltv)}
              trend={stats?.ltvTrend}
              color="var(--accent)"
              bg="var(--accent-light)"
            />
            <StatCard
              icon={<Target size={20} />}
              label="CAC (стоимость привлечения)"
              value={fmtMoney(stats?.cac)}
              trend={stats?.cacTrend}
              color="var(--warning)"
              bg="var(--warning-light)"
              trendInverse
            />
            <StatCard
              icon={<Users size={20} />}
              label="Активных сделок"
              value={fmt(stats?.activeDeals)}
              trend={stats?.dealsTrend}
              color="var(--info)"
              bg="var(--info-light)"
            />
            <StatCard
              icon={<DollarSign size={20} />}
              label="Прогноз выручки (месяц)"
              value={fmtMoney(stats?.revenueforecast)}
              trend={stats?.revenueTrend}
              color="var(--success)"
              bg="var(--success-light)"
            />
          </div>

          {/* Second row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* ТЗ: «горящие» задачи на сегодня */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={16} color="var(--warning)" />
                  Горящие задачи
                </div>
                <button
                  onClick={() => navigate('/tasks')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Все <ArrowRight size={12} />
                </button>
              </div>

              {urgentTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
                  🎉 Срочных задач нет
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {urgentTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <CheckSquare size={14} color={task.priority === 'high' ? 'var(--danger)' : 'var(--text-tertiary)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {task.assignee?.name} · {task.project?.name}
                        </div>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Сводка за месяц</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Новых лидов', value: fmt(stats?.newLeads), icon: '👤' },
                  { label: 'Закрыто сделок', value: fmt(stats?.closedDeals), icon: '✅' },
                  { label: 'Выставлено счетов', value: fmtMoney(stats?.invoiced), icon: '📄' },
                  { label: 'Оплачено', value: fmtMoney(stats?.paid), icon: '💰' },
                  { label: 'Просроченных задач', value: fmt(stats?.overdueTasks), icon: '⚠️' },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-color)',
                  }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{row.icon}</span>{row.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, trend, color, bg, trendInverse }) {
  const trendUp = trend > 0;
  const trendGood = trendInverse ? !trendUp : trendUp;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
          background: bg, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: trendGood ? 'var(--success)' : 'var(--danger)',
          }}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    high: { label: 'Высокий', color: 'var(--danger)', bg: 'var(--danger-light)' },
    medium: { label: 'Средний', color: 'var(--warning)', bg: 'var(--warning-light)' },
    low: { label: 'Низкий', color: 'var(--success)', bg: 'var(--success-light)' },
  };
  const s = map[priority] || map.low;
  return (
    <span style={{
      fontSize: 11, padding: '2px 7px', borderRadius: 99,
      background: s.bg, color: s.color, fontWeight: 600, flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 110, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} style={{ height: 280, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    </div>
  );
}
