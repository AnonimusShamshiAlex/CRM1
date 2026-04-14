import React, { useEffect, useState } from 'react';
import { FileText, Download, Plus, Eye, Trash2, Copy } from 'lucide-react';
import api from '../../api/axios';
import { getExportUrl } from '../../api/axios';

const TEMPLATE_VARS = [
  '{{client_name}}', '{{client_email}}', '{{client_phone}}',
  '{{client_company}}', '{{project_name}}', '{{project_budget}}',
  '{{date_today}}', '{{contract_number}}', '{{manager_name}}',
  '{{service_name}}', '{{amount}}', '{{vat}}', '{{total}}',
];

const DEFAULT_TEMPLATES = [
  {
    id: 'contract',
    name: 'Договор оказания услуг',
    type: 'contract',
    description: 'Стандартный договор для клиентов агентства',
  },
  {
    id: 'invoice',
    name: 'Счёт на оплату',
    type: 'invoice',
    description: 'Счёт с позициями и НДС',
  },
  {
    id: 'brief',
    name: 'Бриф клиента',
    type: 'brief',
    description: 'Анкета для сбора требований',
  },
];

export default function DocumentConstructorPage() {
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState('generate'); // generate | templates
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [extraVars, setExtraVars] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [tplRes, clientRes, projRes] = await Promise.all([
          api.get('/document-templates').catch(() => ({ data: [] })),
          api.get('/clients?limit=100'),
          api.get('/projects?limit=100'),
        ]);
        const tpls = tplRes.data?.length ? tplRes.data : DEFAULT_TEMPLATES;
        setTemplates(tpls);
        setClients(clientRes.data?.clients || clientRes.data || []);
        setProjects(projRes.data?.projects || projRes.data || []);
      } catch (e) {
        setTemplates(DEFAULT_TEMPLATES);
      }
    };
    load();
  }, []);

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedClient) {
      alert('Выберите шаблон и клиента');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/documents/generate', {
        templateId: selectedTemplate,
        clientId: selectedClient,
        projectId: selectedProject || undefined,
        variables: extraVars,
      });
      setGeneratedDocs((prev) => [res.data, ...prev]);
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка генерации документа');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Конструктор документов
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Автоматическая генерация договоров и счетов по шаблонам
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTemplate({ name: '', type: 'contract', body: '' }); setShowEditor(true); }}>
          <Plus size={14} /> Новый шаблон
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {[['generate', 'Создать документ'], ['templates', 'Шаблоны'], ['history', 'История']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: tab === k ? 'var(--accent)' : 'var(--bg-card)',
            color: tab === k ? '#fff' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* TAB: Generate */}
      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Параметры документа">
              <Field label="Шаблон *">
                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                  <option value="">— выберите шаблон —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Клиент *">
                <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                  <option value="">— выберите клиента —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                  ))}
                </select>
              </Field>

              <Field label="Проект">
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  <option value="">— не выбрано —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Номер документа">
                <input
                  placeholder="Авто"
                  value={extraVars.contract_number || ''}
                  onChange={(e) => setExtraVars((v) => ({ ...v, contract_number: e.target.value }))}
                />
              </Field>

              <Field label="Сумма">
                <input
                  type="number"
                  placeholder="0"
                  value={extraVars.amount || ''}
                  onChange={(e) => setExtraVars((v) => ({ ...v, amount: e.target.value }))}
                />
              </Field>

              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating || !selectedTemplate || !selectedClient}
                style={{ marginTop: 8 }}
              >
                <FileText size={14} />
                {generating ? 'Генерирую...' : 'Сгенерировать документ'}
              </button>
            </Card>

            {/* Variables reference */}
            <Card title="Доступные переменные">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TEMPLATE_VARS.map((v) => (
                  <span
                    key={v}
                    onClick={() => navigator.clipboard.writeText(v)}
                    title="Нажмите чтобы скопировать"
                    style={{
                      padding: '3px 8px', borderRadius: 4,
                      background: 'var(--bg-tertiary)', fontSize: 11,
                      fontFamily: 'monospace', cursor: 'pointer',
                      color: 'var(--accent)', border: '1px solid var(--border-color)',
                    }}
                  >
                    {v}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                Кликните на переменную чтобы скопировать в буфер
              </div>
            </Card>
          </div>

          {/* Generated docs */}
          <div>
            <Card title={`Созданные документы (${generatedDocs.length})`}>
              {generatedDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  Здесь появятся сгенерированные документы
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {generatedDocs.map((doc, i) => (
                    <DocRow key={doc.id || i} doc={doc} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB: Templates */}
      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {templates.map((tpl) => (
            <div key={tpl.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  padding: '6px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-light)',
                }}>
                  <FileText size={18} color="var(--accent)" />
                </div>
                <TypeBadge type={tpl.type} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{tpl.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{tpl.description}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 12, flex: 1 }}
                  onClick={() => { setSelectedTemplate(tpl.id); setTab('generate'); }}
                >
                  Использовать
                </button>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 10px' }}>
                  <Eye size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: History */}
      {tab === 'history' && (
        <DocumentHistory />
      )}

      {/* Template editor modal */}
      {showEditor && (
        <TemplateEditor
          template={editTemplate}
          onClose={() => setShowEditor(false)}
          onSave={(tpl) => {
            setTemplates((prev) => [...prev, { ...tpl, id: Date.now() }]);
            setShowEditor(false);
          }}
        />
      )}
    </div>
  );
}

function DocRow({ doc }) {
  return (
    <div style={{
      padding: '10px 12px', background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <FileText size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {doc.name || 'Документ'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {new Date(doc.createdAt || Date.now()).toLocaleString('ru-RU')}
        </div>
      </div>
      {doc.downloadUrl && (
        <a href={doc.downloadUrl} download style={{ color: 'var(--accent)', display: 'flex' }}>
          <Download size={15} />
        </a>
      )}
    </div>
  );
}

function DocumentHistory() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents?limit=50')
      .then((r) => setDocs(r.data?.documents || r.data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>;
  if (!docs.length) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
      <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
      <div>Документов ещё нет</div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <table>
        <thead>
          <tr>
            <th>Название</th><th>Клиент</th><th>Тип</th><th>Дата</th><th></th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.id}>
              <td style={{ fontWeight: 500, fontSize: 13 }}>{doc.name}</td>
              <td style={{ fontSize: 13 }}>{doc.client?.name}</td>
              <td><TypeBadge type={doc.type} /></td>
              <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(doc.createdAt).toLocaleDateString('ru-RU')}</td>
              <td>
                {doc.downloadUrl && (
                  <a href={doc.downloadUrl} download style={{ color: 'var(--accent)' }}>
                    <Download size={14} />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TemplateEditor({ template, onClose, onSave }) {
  const [form, setForm] = useState(template);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: '90%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Новый шаблон</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Название *">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Договор оказания услуг" />
          </Field>
          <Field label="Тип">
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="contract">Договор</option>
              <option value="invoice">Счёт</option>
              <option value="brief">Бриф</option>
              <option value="act">Акт выполненных работ</option>
            </select>
          </Field>
          <Field label="Описание">
            <input value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Текст шаблона (используйте переменные {{...}})">
            <textarea
              value={form.body || ''}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={10}
              placeholder="Договор № {{contract_number}} от {{date_today}}&#10;&#10;Клиент: {{client_name}}&#10;..."
              style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
            />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.name}>Сохранить шаблон</button>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const map = {
    contract: { label: 'Договор', color: 'var(--accent)', bg: 'var(--accent-light)' },
    invoice: { label: 'Счёт', color: 'var(--success)', bg: 'var(--success-light)' },
    brief: { label: 'Бриф', color: 'var(--info)', bg: 'var(--info-light)' },
    act: { label: 'Акт', color: 'var(--warning)', bg: 'var(--warning-light)' },
  };
  const s = map[type] || { label: type, color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
