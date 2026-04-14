import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle, ArrowLeft, FileText, Users } from 'lucide-react';
import api from '../../api/axios';

const REQUIRED_COLUMNS = ['name'];
const OPTIONAL_COLUMNS = ['email', 'phone', 'company', 'status', 'projectId'];

export default function ClientImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // { rows, columns, errors }
  const [step, setStep] = useState('upload'); // upload | preview | result
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [columnMap, setColumnMap] = useState({});

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      alert('Поддерживаются только CSV и XLSX файлы');
      return;
    }
    setFile(f);
    previewFile(f);
  };

  const previewFile = async (f) => {
    setLoading(true);
    const form = new FormData();
    form.append('file', f);
    try {
      const res = await api.post('/clients/import/preview', form);
      setPreview(res.data);
      // Автоматически определяем маппинг колонок
      const autoMap = {};
      const cols = res.data.columns || [];
      const allFields = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
      allFields.forEach((field) => {
        const match = cols.find(
          (c) => c.toLowerCase() === field.toLowerCase() ||
                 c.toLowerCase().includes(field.toLowerCase())
        );
        if (match) autoMap[field] = match;
      });
      setColumnMap(autoMap);
      setStep('preview');
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка чтения файла');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('columnMap', JSON.stringify(columnMap));
    try {
      const res = await api.post('/clients/import', form);
      setResult(res.data);
      setStep('result');
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* Back */}
      <button
        onClick={() => navigate('/clients')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Назад к клиентам
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
        Импорт базы лидов
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Загрузите файл CSV или XLSX. Система автоматически проверит дубликаты по email и телефону.
      </p>

      {/* Steps indicator */}
      <Steps current={step} />

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '60px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--bg-card)',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Читаю файл...</div>
          ) : (
            <>
              <Upload size={40} color="var(--accent)" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>
                Перетащите файл или нажмите для выбора
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Поддерживаются .csv и .xlsx до 10 МБ
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Preview + column mapping */}
      {step === 'preview' && preview && (
        <div>
          {/* File info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
          }}>
            <FileText size={20} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{file?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {preview.totalRows} строк найдено
              </div>
            </div>
          </div>

          {/* Column mapping */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, margin: '0 0 16px' }}>
              Сопоставление колонок
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].map((field) => (
                <div key={field}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {fieldLabel(field)}
                    {REQUIRED_COLUMNS.includes(field) && <span style={{ color: 'var(--danger)' }}> *</span>}
                  </label>
                  <select
                    value={columnMap[field] || ''}
                    onChange={(e) => setColumnMap((m) => ({ ...m, [field]: e.target.value }))}
                  >
                    <option value="">— не выбрано —</option>
                    {(preview.columns || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: 13, fontWeight: 500 }}>
              Предпросмотр (первые 5 строк)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    {(preview.columns || []).map((c) => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(preview.rows || []).slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {(preview.columns || []).map((c) => (
                        <td key={c} style={{ fontSize: 13 }}>{row[c] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Дубликаты */}
          {preview.duplicates > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'var(--warning-light)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 20,
              fontSize: 14,
              color: 'var(--warning)',
            }}>
              <AlertCircle size={16} />
              Найдено {preview.duplicates} дубликатов по email/телефону — они будут пропущены при импорте
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setStep('upload')}>
              ← Выбрать другой файл
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={loading || !columnMap['name']}
            >
              {loading ? 'Импортирую...' : `Импортировать ${preview.totalRows - (preview.duplicates || 0)} лидов`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Result */}
      {step === 'result' && result && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 40,
          textAlign: 'center',
        }}>
          <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Импорт завершён!</h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '24px 0' }}>
            <Stat label="Добавлено" value={result.imported} color="var(--success)" />
            <Stat label="Пропущено (дубли)" value={result.skipped} color="var(--warning)" />
            <Stat label="Ошибок" value={result.errors} color="var(--danger)" />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => { setStep('upload'); setFile(null); setPreview(null); }}>
              Импортировать ещё
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/clients')}>
              <Users size={14} /> Перейти к клиентам
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ current }) {
  const steps = [
    { key: 'upload', label: 'Загрузка' },
    { key: 'preview', label: 'Проверка' },
    { key: 'result', label: 'Готово' },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i <= idx ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: i <= idx ? '#fff' : 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
            }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: i <= idx ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: i === idx ? 500 : 400 }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < idx ? 'var(--accent)' : 'var(--border-color)', margin: '0 12px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

function fieldLabel(field) {
  const map = {
    name: 'Имя / Название',
    email: 'Email',
    phone: 'Телефон',
    company: 'Компания',
    status: 'Статус',
    projectId: 'ID проекта',
  };
  return map[field] || field;
}
