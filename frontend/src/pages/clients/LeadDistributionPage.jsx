import React, { useEffect, useState } from 'react';
import { Users, Shuffle, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

export default function LeadDistributionPage() {
  const [managers, setManagers] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState('equal');

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, clientsRes] = await Promise.all([
          api.get('/users?role=manager&status=active'),
          api.get('/clients?projectId=unassigned&limit=500'),
        ]);
        const mgrs = usersRes.data?.users || usersRes.data || [];
        const clients = clientsRes.data?.clients || clientsRes.data || [];
        setManagers(mgrs);
        setUnassigned(clients);

        autoDistribute(mgrs, clients);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const autoDistribute = (mgrs, clients) => {
    if (!mgrs.length) return;
    const dist = {};
    mgrs.forEach((m) => (dist[m.id] = []));
    clients.forEach((c, i) => {
      const mgr = mgrs[i % mgrs.length];
      dist[mgr.id].push(c);
    });
    setDistribution(dist);
  };

  const shuffleDistribute = () => {
    const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
    autoDistribute(managers, shuffled);
  };

  const moveClient = (clientId, fromMgr, toMgr) => {
    setDistribution((prev) => {
      const next = { ...prev };
      next[fromMgr] = (next[fromMgr] || []).filter((c) => c.id !== clientId);
      const client = unassigned.find((c) => c.id === clientId) ||
        Object.values(prev).flat().find((c) => c.id === clientId);
      if (client) next[toMgr] = [...(next[toMgr] || []), client];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const assignments = Object.entries(distribution).flatMap(([managerId, clients]) =>
        clients.map((c) => ({ clientId: c.id, managerId: Number(managerId) }))
      );
      await api.post('/clients/distribute', { assignments });
      setDone(true);
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка распределения');
    } finally {
      setSaving(false);
    }
  };

  const totalAssigned = Object.values(distribution).reduce((s, arr) => s + arr.length, 0);

  if (loading) return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Загрузка...</div>;

  if (done) return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <CheckCircle size={52} color="var(--success)" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Распределение завершено!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        {totalAssigned} лидов распределено между {managers.length} менеджерами
      </p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        Распределить ещё
      </button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          Распределение лидов
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Нераспределённых лидов: <strong>{unassigned.length}</strong> · Менеджеров: <strong>{managers.length}</strong>
        </p>
      </div>

      {unassigned.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
        }}>
          <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 500 }}>Нет нераспределённых лидов</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Все лиды уже закреплены за менеджерами</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={shuffleDistribute}>
              <Shuffle size={14} /> Перемешать случайно
            </button>
            <button className="btn btn-secondary" onClick={() => autoDistribute(managers, unassigned)}>
              Поровну
            </button>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Будет назначено: {totalAssigned} лидов
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || totalAssigned === 0}>
              {saving ? 'Сохраняю...' : `Назначить ${totalAssigned} лидов`}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {managers.map((mgr) => {
              const mgrClients = distribution[mgr.id] || [];
              return (
                <div key={mgr.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {mgr.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{mgr.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {mgr.position || 'Менеджер'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 700, color: 'var(--accent)',
                      minWidth: 24, textAlign: 'right',
                    }}>
                      {mgrClients.length}
                    </div>
                  </div>

                  <div style={{ padding: '8px 16px 0' }}>
                    <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 99 }}>
                      <div style={{
                        height: 4, borderRadius: 99,
                        background: 'var(--accent)',
                        width: unassigned.length > 0
                          ? `${Math.round((mgrClients.length / unassigned.length) * 100 * managers.length)}%`
                          : '0%',
                        maxWidth: '100%',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>

                  <div style={{ padding: '8px 0', maxHeight: 220, overflowY: 'auto' }}>
                    {mgrClients.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                        Нет лидов
                      </div>
                    ) : (
                      mgrClients.slice(0, 8).map((c) => (
                        <div key={c.id} style={{
                          padding: '6px 16px', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          borderBottom: '1px solid var(--border-color)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{c.phone || c.email}</div>
                          </div>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) moveClient(c.id, mgr.id, Number(e.target.value));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 11, width: 28, padding: '2px', cursor: 'pointer', flexShrink: 0 }}
                            title="Переместить к другому менеджеру"
                          >
                            <option value="">↗</option>
                            {managers.filter((m) => m.id !== mgr.id).map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      ))
                    )}
                    {mgrClients.length > 8 && (
                      <div style={{ padding: '6px 16px', fontSize: 12, color: 'var(--text-tertiary)' }}>
                        + ещё {mgrClients.length - 8} лидов
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}