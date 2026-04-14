import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Upload, Download, LayoutList, Kanban } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/ui/Badge';

const PAGE_SIZE = 20;

export default function ClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isManager = user?.role === 'manager';
  const canExport = ['superadmin', 'admin', 'rop'].includes(user?.role);
  const canImport = ['superadmin', 'admin', 'rop'].includes(user?.role);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    pipelineId: '',
  });
  const [pipelines, setPipelines] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Загружаем проекты и воронки для фильтров
  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, pipeRes] = await Promise.all([
          api.get('/projects'),
          api.get('/pipelines'),
        ]);
        setProjects(projRes.data?.projects || projRes.data || []);
        setPipelines(pipeRes.data || []);

        // Если менеджер — автоматически фильтруем по его проекту
        if (isManager && user?.projectId) {
          setFilters((f) => ({ ...f, projectId: String(user.projectId) }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [isManager, user]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        projectId: filters.projectId || undefined,
        status: filters.status || undefined,
        pipelineId: filters.pipelineId || undefined,
      };
      const res = await api.get('/clients', { params });
      setClients(res.data?.clients || res.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    const t = setTimeout(fetchClients, 300);
    return () => clearTimeout(t);
  }, [fetchClients]);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'lead', label: 'Лид' },
    { value: 'active', label: 'Активный' },
    { value: 'inactive', label: 'Неактивный' },
    { value: 'lost', label: 'Потерян' },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Лиды и клиенты
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Всего: {total}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {canImport && (
            <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => navigate('/clients/import')}>
              <Upload size={14} /> Импорт CSV
            </button>
          )}
          {canExport && (
            <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => window.open('/api/export/clients?format=xlsx')}>
              <Download size={14} /> Экспорт
            </button>
          )}
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => navigate('/clients/new')}>
            <Plus size={14} /> Добавить
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 16,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
          }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по имени, email, телефону..."
            style={{ paddingLeft: 32 }}
          />
        </div>

        {/* Фильтр по проекту — ТЗ: менеджер видит только свою выборку */}
        <select
          value={filters.projectId}
          onChange={(e) => handleFilterChange('projectId', e.target.value)}
          disabled={isManager} // менеджер не может менять свой фильтр
          style={{ width: 180, cursor: isManager ? 'not-allowed' : 'pointer', opacity: isManager ? 0.6 : 1 }}
          title={isManager ? 'Вы видите только свой проект' : 'Фильтр по проекту'}
        >
          <option value="">Все проекты</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Статус */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{ width: 150 }}
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Воронка */}
        <select
          value={filters.pipelineId}
          onChange={(e) => handleFilterChange('pipelineId', e.target.value)}
          style={{ width: 160 }}
        >
          <option value="">Все воронки</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <ViewBtn active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<LayoutList size={14} />} />
          <ViewBtn active={viewMode === 'kanban'} onClick={() => setViewMode('kanban')} icon={<Kanban size={14} />} />
        </div>
      </div>

      {/* Active filters hint */}
      {isManager && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', background: 'var(--info-light)',
          borderRadius: 'var(--radius-sm)', marginBottom: 14,
          fontSize: 12, color: 'var(--info)',
        }}>
          <Filter size={12} />
          Показаны только клиенты вашего проекта
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : clients.length === 0 ? (
        <EmptyState onAdd={() => navigate('/clients/new')} />
      ) : (
        <>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            <table>
              <thead>
                <tr>
                  <th>Имя / Компания</th>
                  <th>Контакты</th>
                  <th>Статус</th>
                  <th>Проект</th>
                  <th>Воронка</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      {c.company && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.company}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{c.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.phone}</div>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {c.project?.name || '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {c.pipeline?.name || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >← Назад</button>
              <span style={{ padding: '8px 12px', fontSize: 14, color: 'var(--text-secondary)' }}>
                {page} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= Math.ceil(total / PAGE_SIZE)}
                onClick={() => setPage((p) => p + 1)}
              >Вперёд →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ViewBtn({ active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        background: active ? 'var(--accent)' : 'var(--bg-card)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >{icon}</button>
  );
}

function StatusBadge({ status }) {
  const map = {
    lead: { label: 'Лид', color: 'var(--info)', bg: 'var(--info-light)' },
    active: { label: 'Активный', color: 'var(--success)', bg: 'var(--success-light)' },
    inactive: { label: 'Неактивный', color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' },
    lost: { label: 'Потерян', color: 'var(--danger)', bg: 'var(--danger-light)' },
  };
  const s = map[status] || { label: status, color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' };
  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 500,
      background: s.bg,
      color: s.color,
    }}>{s.label}</span>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
          {[...Array(5)].map((_, j) => (
            <div key={j} style={{ flex: 1, height: 14, background: 'var(--bg-tertiary)', borderRadius: 4, animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Нет клиентов</div>
      <div style={{ fontSize: 14, marginBottom: 20 }}>Добавьте первого клиента или импортируйте базу</div>
      <button className="btn btn-primary" onClick={onAdd}><Plus size={14} /> Добавить клиента</button>
    </div>
  );
}
