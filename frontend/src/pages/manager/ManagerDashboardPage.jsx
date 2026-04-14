import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign, Users, Percent } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

const formatMoney = (n) =>
  new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(n || 0) + ' UZS';

const STAGES = ['Брифинг', 'Анализ', 'Настройка', 'Запуск', 'Оптимизация'];

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const isMarketer = user?.role === 'marketer';

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMetrics, setEditMetrics] = useState(false);
  const [form, setForm] = useState({ leads: '', cpl: '', budget: '', ctr: '', roi: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/projects');
        const list = res.data?.projects || res.data || [];
        setProjects(list);
        if (list.length > 0) setSelectedProject(list[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    loadMetrics(selectedProject.id);
  }, [selectedProject]);

  const loadMetrics = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/metrics`);
      setMetrics(res.data);
      setForm({
        leads: res.data?.leads || '',
        cpl: res.data?.cpl || '',
        budget: res.data?.budget || '',
        ctr: res.data?.ctr || '',
        roi: res.data?.roi || '',
      });
    } catch (e) {
      setMetrics(null);
    }
  };

  const saveMetrics = async () => {
    try {
      await api.put(`/projects/${selectedProject.id}/metrics`, form);
      setMetrics((m) => ({ ...m, ...form }));
      setEditMetrics(false);
    } catch (e) {
      alert('Ошибка сохранения метрик');
    }
  };

  if (loading) return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Загрузка...</div>;

  const currentStage = selectedProject?.stage || 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            {isMarketer ? 'Мои проекты' : 'Дашборд аналитики'}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Эффективность рекламных кампаний
          </div>
        </div>

        {/* Выбор проекта */}
        {projects.length > 0 && (
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((p) => String(p.id) === e.target.value);
              setSelectedProject(p);
            }}
            style={{ width: 220 }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {!selectedProject ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          Нет доступных проектов
        </div>
      ) : (
        <>
          {/* Таймлайн этапов — ТЗ: Брифинг → Анализ → Настройка → Запуск → Оптимизация */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              Этап работы
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {STAGES.map((stage, i) => {
                const done = i < currentStage;
                const active = i === currentStage;
                return (
                  <React.Fragment key={stage}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: done || active ? '#fff' : 'var(--text-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600,
                        border: active ? '3px solid var(--accent-light)' : 'none',
                        boxSizing: 'border-box',
                      }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div style={{
                        fontSize: 11, marginTop: 6, textAlign: 'center',
                        color: active ? 'var(--accent)' : done ? 'var(--success)' : 'var(--text-tertiary)',
                        fontWeight: active ? 600 : 400,
                      }}>
                        {stage}
                      </div>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div style={{
                        flex: 2, height: 2,
                        background: done ? 'var(--success)' : 'var(--border-color)',
                        marginBottom: 20,
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Метрики — ТЗ: лиды, CPL, бюджет, CTR, ROI */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Метрики эффективности
              </div>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12 }}
                onClick={() => setEditMetrics((v) => !v)}
              >
                {editMetrics ? 'Отмена' : 'Изменить'}
              </button>
            </div>

            {editMetrics ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { key: 'leads', label: 'Кол-во лидов', placeholder: '0' },
                    { key: 'cpl', label: 'CPL (стоимость лида)', placeholder: '0 UZS' },
                    { key: 'budget', label: 'Рекламный бюджет', placeholder: '0 UZS' },
                    { key: 'ctr', label: 'CTR (%)', placeholder: '0.00' },
                    { key: 'roi', label: 'ROI (%)', placeholder: '0' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
                      <input
                        type="number"
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={saveMetrics}>Сохранить метрики</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <MetricCard icon={<Users size={18} />} label="Лидов" value={metrics?.leads || 0} color="var(--info)" />
                <MetricCard icon={<Target size={18} />} label="CPL" value={formatMoney(metrics?.cpl)} color="var(--accent)" />
                <MetricCard icon={<DollarSign size={18} />} label="Бюджет" value={formatMoney(metrics?.budget)} color="var(--warning)" />
                <MetricCard icon={<Percent size={18} />} label="CTR" value={(metrics?.ctr || 0) + '%'} color="var(--success)" />
                <MetricCard
                  icon={metrics?.roi >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  label="ROI"
                  value={(metrics?.roi || 0) + '%'}
                  color={metrics?.roi >= 0 ? 'var(--success)' : 'var(--danger)'}
                />
              </div>
            )}
          </div>

          {/* Лог выполненных работ — ТЗ */}
          <WorkLog projectId={selectedProject.id} />
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ color, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function WorkLog({ projectId }) {
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get(`/projects/${projectId}/worklogs`)
      .then((r) => setLogs(r.data || []))
      .catch(() => setLogs([]));
  }, [projectId]);

  const addLog = async () => {
    if (!newLog.trim()) return;
    setAdding(true);
    try {
      const res = await api.post(`/projects/${projectId}/worklogs`, { text: newLog });
      setLogs((l) => [res.data, ...l]);
      setNewLog('');
    } catch (e) {
      alert('Ошибка добавления записи');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: 24,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
        Лог выполненных работ
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={newLog}
          onChange={(e) => setNewLog(e.target.value)}
          placeholder="Что сделано? Можно вставить ссылку на отчёт или креатив..."
          onKeyDown={(e) => e.key === 'Enter' && addLog()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={addLog} disabled={adding}>
          {adding ? '...' : 'Добавить'}
        </button>
      </div>

      {logs.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          Записей нет. Добавьте первую запись о выполненной работе.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map((log, i) => (
            <div key={log.id || i} style={{
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: 13,
            }}>
              <div style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{log.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {log.author?.name} · {new Date(log.createdAt).toLocaleString('ru-RU')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
