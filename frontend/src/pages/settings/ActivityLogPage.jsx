import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Clock, User, Edit, Trash2, Plus, LogIn } from 'lucide-react';
import api from '../api/axios';

const ACTION_ICONS = {
  create: <Plus size={14} color="var(--success)" />,
  update: <Edit size={14} color="var(--info)" />,
  delete: <Trash2 size={14} color="var(--danger)" />,
  login: <LogIn size={14} color="var(--accent)" />,
  default: <Clock size={14} color="var(--text-tertiary)" />,
};

const ACTION_LABELS = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  login: 'Вход',
  logout: 'Выход',
  approve: 'Одобрение',
  import: 'Импорт',
  export: 'Экспорт',
};

const ENTITY_LABELS = {
  Client: 'Клиент',
  Project: 'Проект',
  Task: 'Задача',
  Invoice: 'Счёт',
  Expense: 'Расход',
  User: 'Пользователь',
  Pipeline: 'Воронка',
  PipelineStage: 'Этап воронки',
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ action: '', entity: '', userId: '' });
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => {
    api.get('/users').then((r) => setUsers(r.data?.users || r.data || [])).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs', {
        params: {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          action: filters.action || undefined,
          entity: filters.entity || undefined,
          userId: filters.userId || undefined,
        },
      });
      setLogs(res.data?.logs || res.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          История изменений
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Все действия в системе · {total} записей
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по объекту, пользователю..."
            style={{ paddingLeft: 32 }}
          />
        </div>

        <select
          value={filters.action}
          onChange={(e) => { setFilters((f) => ({ ...f, action: e.target.value })); setPage(1); }}
          style={{ width: 150 }}
        >
          <option value="">Все действия</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filters.entity}
          onChange={(e) => { setFilters((f) => ({ ...f, entity: e.target.value })); setPage(1); }}
          style={{ width: 160 }}
        >
          <option value="">Все сущности</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filters.userId}
          onChange={(e) => { setFilters((f) => ({ ...f, userId: e.target.value })); setPage(1); }}
          style={{ width: 180 }}
        >
          <option value="">Все пользователи</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* Log list */}
      {loading ? (
        <LoadingSkeleton />
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <Clock size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div>История пуста</div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {logs.map((log, i) => (
            <LogRow key={log.id || i} log={log} isLast={i === logs.length - 1} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Назад
          </button>
          <span style={{ padding: '8px 12px', fontSize: 14, color: 'var(--text-secondary)' }}>
            {page} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button className="btn btn-secondary" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}

function LogRow({ log, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.changes && Object.keys(log.changes).length > 0;

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
      padding: '12px 16px',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: hasDetails ? 'pointer' : 'default' }}
        onClick={() => hasDetails && setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2,
        }}>
          {ACTION_ICONS[log.action] || ACTION_ICONS.default}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {log.user?.name || 'Система'}
            </span>
            <ActionBadge action={log.action} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {ENTITY_LABELS[log.entity] || log.entity}
              {log.entityName && <span style={{ fontWeight: 500 }}> «{log.entityName}»</span>}
            </span>
          </div>

          {log.description && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              {log.description}
            </div>
          )}
        </div>

        {/* Time */}
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 3 }}>
          {formatTime(log.createdAt)}
        </div>

        {hasDetails && (
          <div style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0, marginTop: 3 }}>
            {expanded ? '▲' : '▼'}
          </div>
        )}
      </div>

      {/* Expanded changes */}
      {expanded && hasDetails && (
        <div style={{
          marginTop: 10,
          marginLeft: 40,
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Что изменилось:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(log.changes).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-tertiary)', minWidth: 100 }}>{key}:</span>
                <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>
                  {String(val.old ?? '—')}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                <span style={{ color: 'var(--success)' }}>
                  {String(val.new ?? '—')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBadge({ action }) {
  const colors = {
    create: { bg: 'var(--success-light)', color: 'var(--success)' },
    update: { bg: 'var(--info-light)', color: 'var(--info)' },
    delete: { bg: 'var(--danger-light)', color: 'var(--danger)' },
    login: { bg: 'var(--accent-light)', color: 'var(--accent)' },
  };
  const c = colors[action] || { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {ACTION_LABELS[action] || action}
    </span>
  );
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function LoadingSkeleton() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
          <div style={{ flex: 1, height: 14, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
          <div style={{ width: 80, height: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}
