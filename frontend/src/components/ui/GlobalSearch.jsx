import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, FolderKanban, CheckSquare, FileText, X } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

const ENTITY_CONFIG = {
  clients: {
    icon: <Users size={14} />,
    label: 'Клиент',
    color: 'var(--info)',
    bg: 'var(--info-light)',
    path: (id) => `/clients/${id}`,
  },
  projects: {
    icon: <FolderKanban size={14} />,
    label: 'Проект',
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
    path: (id) => `/projects/${id}`,
  },
  tasks: {
    icon: <CheckSquare size={14} />,
    label: 'Задача',
    color: 'var(--success)',
    bg: 'var(--success-light)',
    path: (id) => `/tasks/${id}`,
  },
  documents: {
    icon: <FileText size={14} />,
    label: 'Документ',
    color: 'var(--warning)',
    bg: 'var(--warning-light)',
    path: (id) => `/documents/${id}`,
  },
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef();
  const containerRef = useRef();
  const debounceRef = useRef();

  // Ctrl+K / Cmd+K открывает поиск
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Клик вне — закрыть
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults({}); return; }
    setLoading(true);
    try {
      const res = await api.get('/search', { params: { q } });
      setResults(res.data || {});
    } catch {
      setResults({});
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (entity, id) => {
    const cfg = ENTITY_CONFIG[entity];
    if (cfg) navigate(cfg.path(id));
    setOpen(false);
    setQuery('');
    setResults({});
  };

  const totalResults = Object.values(results).reduce((acc, arr) => acc + (arr?.length || 0), 0);
  const hasResults = totalResults > 0;

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{
          position: 'absolute', left: 11, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-tertiary)',
          pointerEvents: 'none',
        }} />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Поиск... (Ctrl+K)"
          style={{
            paddingLeft: 34,
            paddingRight: query ? 32 : 12,
            height: 36,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            width: '100%',
            outline: 'none',
            color: 'var(--text-primary)',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults({}); setOpen(false); }}
            style={{
              position: 'absolute', right: 8, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', padding: 2,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: 420,
          overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Поиск...
            </div>
          )}

          {!loading && !hasResults && (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Ничего не найдено по запросу «{query}»
              </div>
            </div>
          )}

          {!loading && hasResults && Object.entries(results).map(([entity, items]) => {
            if (!items?.length) return null;
            const cfg = ENTITY_CONFIG[entity];
            if (!cfg) return null;
            return (
              <div key={entity}>
                {/* Group header */}
                <div style={{
                  padding: '8px 14px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  {cfg.label}ы ({items.length})
                </div>

                {items.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(entity, item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 14px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{
                      padding: '3px 7px',
                      borderRadius: 4,
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: 11,
                      flexShrink: 0,
                    }}>
                      {cfg.label}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name || item.title}
                      </div>
                      {item.subtitle && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                ))}

                {items.length > 5 && (
                  <div style={{ padding: '4px 14px 8px', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    + ещё {items.length - 5}
                  </div>
                )}

                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}