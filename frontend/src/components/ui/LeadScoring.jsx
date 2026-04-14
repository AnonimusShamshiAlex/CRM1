import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Phone, Mail, Clock, FileText, MessageCircle } from 'lucide-react';
import api from '../../api/axios';

// ТЗ: Lead Scoring — система оценки качества лидов
// Оценка строится на основе заполненности данных + активности

const SCORE_FACTORS = [
  { key: 'hasPhone', label: 'Указан телефон', icon: <Phone size={13} />, points: 10 },
  { key: 'hasEmail', label: 'Указан email', icon: <Mail size={13} />, points: 10 },
  { key: 'hasCompany', label: 'Указана компания', icon: <FileText size={13} />, points: 5 },
  { key: 'recentInteraction', label: 'Взаимодействие < 7 дней', icon: <MessageCircle size={13} />, points: 20 },
  { key: 'hasTask', label: 'Есть активная задача', icon: <Clock size={13} />, points: 15 },
  { key: 'inPipeline', label: 'Находится в воронке', icon: <TrendingUp size={13} />, points: 15 },
  { key: 'briefFilled', label: 'Бриф заполнен', icon: <FileText size={13} />, points: 25 },
];

const MAX_SCORE = SCORE_FACTORS.reduce((s, f) => s + f.points, 0);

function calcScore(client) {
  let score = 0;
  const factors = {};

  factors.hasPhone = !!(client.phone);
  factors.hasEmail = !!(client.email);
  factors.hasCompany = !!(client.company);
  factors.inPipeline = !!(client.pipelineId || client.pipeline);
  factors.briefFilled = !!(client.briefFilled || client.customFields?.brief);

  // Взаимодействие за последние 7 дней
  if (client.lastInteractionAt) {
    const daysDiff = (Date.now() - new Date(client.lastInteractionAt)) / (1000 * 60 * 60 * 24);
    factors.recentInteraction = daysDiff < 7;
  } else {
    factors.recentInteraction = false;
  }

  factors.hasTask = !!(client.activeTasks > 0 || client.tasks?.some?.((t) => t.status !== 'done'));

  SCORE_FACTORS.forEach((f) => {
    if (factors[f.key]) score += f.points;
  });

  return { score, factors };
}

function getScoreLabel(score) {
  const pct = (score / MAX_SCORE) * 100;
  if (pct >= 80) return { label: 'Горячий', color: 'var(--danger)', bg: 'var(--danger-light)', stars: 5 };
  if (pct >= 60) return { label: 'Тёплый', color: 'var(--warning)', bg: 'var(--warning-light)', stars: 4 };
  if (pct >= 40) return { label: 'Средний', color: 'var(--info)', bg: 'var(--info-light)', stars: 3 };
  if (pct >= 20) return { label: 'Холодный', color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)', stars: 2 };
  return { label: 'Новый', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)', stars: 1 };
}

// Компонент для встройки в карточку клиента
export function LeadScoreBadge({ client }) {
  const { score } = calcScore(client);
  const { label, color, bg, stars } = getScoreLabel(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            fill={i < stars ? color : 'transparent'}
            color={i < stars ? color : 'var(--border-color)'}
          />
        ))}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 600, padding: '2px 7px',
        borderRadius: 99, background: bg, color,
      }}>
        {label} ({score}/{MAX_SCORE})
      </span>
    </div>
  );
}

// Полная панель скоринга для детальной страницы клиента
export default function LeadScoringPanel({ client }) {
  const { score, factors } = calcScore(client);
  const { label, color, bg, stars } = getScoreLabel(score);
  const pct = Math.round((score / MAX_SCORE) * 100);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Lead Score
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px',
          borderRadius: 99, background: bg, color,
        }}>
          {label}
        </span>
      </div>

      {/* Score circle + bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `conic-gradient(${color} ${pct * 3.6}deg, var(--bg-tertiary) 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', flexShrink: 0,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>/{MAX_SCORE}</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i} size={16}
                fill={i < stars ? color : 'transparent'}
                color={i < stars ? color : 'var(--border-color)'}
              />
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {pct}% заполненности профиля
          </div>
          {pct < 60 && (
            <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
              Заполните данные чтобы повысить оценку
            </div>
          )}
        </div>
      </div>

      {/* Factor list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SCORE_FACTORS.map((f) => {
          const ok = factors[f.key];
          return (
            <div key={f.key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              background: ok ? 'var(--success-light)' : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              opacity: ok ? 1 : 0.6,
            }}>
              <span style={{ color: ok ? 'var(--success)' : 'var(--text-tertiary)' }}>{f.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: ok ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {f.label}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: ok ? 'var(--success)' : 'var(--text-tertiary)',
              }}>
                {ok ? `+${f.points}` : `+${f.points}`}
              </span>
              <span style={{ fontSize: 14 }}>{ok ? '✓' : '○'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
