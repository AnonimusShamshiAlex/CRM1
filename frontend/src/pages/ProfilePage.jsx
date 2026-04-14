import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Lock, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

const roleLabels = {
  superadmin: 'Суперадмин',
  admin: 'Администратор',
  rop: 'РОП (Руководитель отдела продаж)',
  marketer: 'Маркетолог',
  manager: 'Менеджер',
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      position: user?.position || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    watch: watchPwd,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm();

  const onSaveProfile = async (data) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/users/profile', data);
      setUser(res.data);
      setMessage({ type: 'success', text: 'Профиль сохранён' });
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data) => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setMessage({ type: 'success', text: 'Пароль изменён' });
      resetPwd();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Ошибка изменения пароля' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>
        Мой профиль
      </h1>

      {/* Avatar block */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 28,
        padding: 20,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {roleLabels[user?.role] || user?.role}
          </div>
          {user?.position && (
            <div style={{
              marginTop: 6,
              fontSize: 12,
              padding: '2px 10px',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              borderRadius: 99,
              display: 'inline-block',
              fontWeight: 500,
            }}>
              {user.position}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { key: 'profile', label: 'Данные профиля', icon: <User size={14} /> },
          { key: 'password', label: 'Пароль', icon: <Lock size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMessage(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: tab === t.key ? 'var(--accent)' : 'var(--bg-card)',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 16,
          fontSize: 14,
          background: message.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Profile form */}
      {tab === 'profile' && (
        <form
          onSubmit={handleSubmit(onSaveProfile)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Field label="Имя *" error={errors.name?.message}>
            <input
              {...register('name', { required: 'Обязательное поле' })}
              placeholder="Ваше имя"
            />
          </Field>

          <Field label="Email *" error={errors.email?.message}>
            <input
              {...register('email', {
                required: 'Обязательное поле',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Неверный формат email' },
              })}
              placeholder="email@example.com"
            />
          </Field>

          {/* ТЗ: поле «Должность» в карточке пользователя */}
          <Field label="Должность" error={errors.position?.message}>
            <input
              {...register('position')}
              placeholder="Например: Таргетолог, Аккаунт-менеджер..."
            />
          </Field>

          <Field label="Телефон" error={errors.phone?.message}>
            <input
              {...register('phone')}
              placeholder="+998 90 000 00 00"
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={14} />
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </button>
        </form>
      )}

      {/* Password form */}
      {tab === 'password' && (
        <form
          onSubmit={handlePwd(onChangePassword)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Field label="Текущий пароль *" error={pwdErrors.currentPassword?.message}>
            <input
              type="password"
              {...regPwd('currentPassword', { required: 'Обязательное поле' })}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Новый пароль *" error={pwdErrors.newPassword?.message}>
            <input
              type="password"
              {...regPwd('newPassword', {
                required: 'Обязательное поле',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              })}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Повторите пароль *" error={pwdErrors.confirmPassword?.message}>
            <input
              type="password"
              {...regPwd('confirmPassword', {
                required: 'Обязательное поле',
                validate: (v) => v === watchPwd('newPassword') || 'Пароли не совпадают',
              })}
              placeholder="••••••••"
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Lock size={14} />
            {saving ? 'Сохраняю...' : 'Изменить пароль'}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}
