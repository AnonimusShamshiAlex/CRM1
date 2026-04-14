import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Send, CheckCircle, XCircle, Copy } from 'lucide-react';
import api from '../api/axios';

const EVENT_OPTIONS = [
  { value: 'client.created', label: 'Новый лид создан' },
  { value: 'client.status_changed', label: 'Статус лида изменён' },
  { value: 'deal.won', label: 'Сделка выиграна' },
  { value: 'deal.lost', label: 'Сделка проиграна' },
  { value: 'task.created', label: 'Новая задача' },
  { value: 'task.done', label: 'Задача выполнена' },
  { value: 'invoice.paid', label: 'Счёт оплачен' },
  { value: 'user.registered', label: 'Новая регистрация' },
];

export default function WebhookSettingsPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', events: [], secret: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    api.get('/webhooks')
      .then((r) => setWebhooks(r.data || []))
      .catch(() => setWebhooks([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleEvent = (ev) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  };

  const handleSave = async () => {
    if (!form.url) { alert('Укажите URL'); return; }
    if (!form.events.length) { alert('Выберите хотя бы одно событие'); return; }
    setSaving(true);
    try {
      const res = await api.post('/webhooks', form);
      setWebhooks((prev) => [...prev, res.data]);
      setShowForm(false);
      setForm({ url: '', events: [], secret: '', description: '' });
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить webhook?')) return;
    try {
      await api.delete(`/webhooks/${id}`);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch { alert('Ошибка удаления'); }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      await api.post(`/webhooks/${id}/test`);
      alert('Тестовый запрос отправлен! Проверьте логи.');
    } catch { alert('Ошибка отправки теста'); }
    finally { setTestingId(null); }
  };

  const handleToggle = async (webhook) => {
    try {
      const res = await api.patch(`/webhooks/${webhook.id}`, { active: !webhook.active });
      setWebhooks((prev) => prev.map((w) => w.id === webhook.id ? { ...w, active: !w.active } : w));
    } catch { alert('Ошибка обновления'); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Webhooks</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Отправка данных в сторонние сервисы при событиях в CRM
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Добавить webhook
        </button>
      </div>

      {/* Webhook list */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>
      ) : webhooks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Webhooks не настроены</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>
            Добавьте webhook чтобы получать уведомления в Telegram-бот, Make, Zapier и другие сервисы
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Добавить первый webhook
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {webhooks.map((wh) => (
            <WebhookCard
              key={wh.id}
              webhook={wh}
              onDelete={() => handleDelete(wh.id)}
              onTest={() => handleTest(wh.id)}
              onToggle={() => handleToggle(wh)}
              testing={testingId === wh.id}
            />
          ))}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            padding: 28, width: '90%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Новый Webhook</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>URL назначения *</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://your-service.com/webhook"
                />
              </div>

              <div>
                <label style={labelStyle}>Описание</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Уведомления в Telegram-бот"
                />
              </div>

              <div>
                <label style={labelStyle}>Secret (опционально, для проверки подписи)</label>
                <input
                  value={form.secret}
                  onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                  placeholder="my-secret-key"
                />
              </div>

              <div>
                <label style={labelStyle}>События *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                  {EVENT_OPTIONS.map((ev) => (
                    <label key={ev.value} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px',
                      background: form.events.includes(ev.value) ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${form.events.includes(ev.value) ? 'var(--accent)' : 'var(--border-color)'}`,
                      cursor: 'pointer', fontSize: 13,
                    }}>
                      <input
                        type="checkbox"
                        checked={form.events.includes(ev.value)}
                        onChange={() => toggleEvent(ev.value)}
                        style={{ margin: 0 }}
                      />
                      {ev.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WebhookCard({ webhook, onDelete, onTest, onToggle, testing }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${webhook.active ? 'var(--border-color)' : 'var(--border-color)'}`,
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
      opacity: webhook.active ? 1 : 0.6,
    }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Status */}
        <div style={{ flexShrink: 0 }}>
          {webhook.active
            ? <CheckCircle size={18} color="var(--success)" />
            : <XCircle size={18} color="var(--text-tertiary)" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
            {webhook.description || 'Webhook'}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--text-secondary)',
            fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {webhook.url.length > 50 ? webhook.url.slice(0, 50) + '...' : webhook.url}
            <button
              onClick={() => navigator.clipboard.writeText(webhook.url)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
            >
              <Copy size={12} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 10px' }}
            onClick={onToggle}
          >
            {webhook.active ? 'Выкл' : 'Вкл'}
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 10px' }}
            onClick={onTest}
            disabled={testing}
          >
            <Send size={12} /> {testing ? '...' : 'Тест'}
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'none', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', padding: '6px 8px',
              cursor: 'pointer', color: 'var(--danger)',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Events */}
      <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(webhook.events || []).map((ev) => {
          const opt = EVENT_OPTIONS.find((o) => o.value === ev);
          return (
            <span key={ev} style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 99,
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            }}>
              {opt?.label || ev}
            </span>
          );
        })}
      </div>

      {/* Last delivery status */}
      {webhook.lastDelivery && (
        <div style={{
          padding: '8px 16px', borderTop: '1px solid var(--border-color)',
          fontSize: 11, color: 'var(--text-tertiary)',
          display: 'flex', gap: 8,
        }}>
          <span>Последняя отправка:</span>
          <span style={{ color: webhook.lastDelivery.success ? 'var(--success)' : 'var(--danger)' }}>
            {webhook.lastDelivery.success ? '✓ Успешно' : '✗ Ошибка'}
          </span>
          <span>· {new Date(webhook.lastDelivery.at).toLocaleString('ru-RU')}</span>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: 'var(--text-secondary)', marginBottom: 5,
};
