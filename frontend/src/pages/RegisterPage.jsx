import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { UserPlus, CheckCircle2, Clock } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', position: '' });
  const [registered, setRegistered] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const { register, loading, error } = useAuthStore();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await register(form);

      if (result.pending) {
        // Ожидает одобрения
        setRegistered(true);
        setIsFirstUser(false);
      } else if (result.token) {
        // Первый пользователь — уже залогинен, редирект через authStore
        setRegistered(true);
        setIsFirstUser(true);
        // Небольшая задержка перед редиректом
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch {
      // ошибка уже в store
    }
  };

  // Экран после регистрации (ожидание)
  if (registered && !isFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Заявка отправлена!</h1>
            <p className="text-gray-500 mb-4">
              Ваша заявка на регистрацию отправлена администратору.
              После одобрения вы сможете войти в систему.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p className="font-medium">Что дальше?</p>
              <p className="mt-1">Администратор получил уведомление и рассмотрит вашу заявку. Попробуйте войти позже.</p>
            </div>
            <Link
              to="/login"
              className="mt-6 inline-block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Перейти ко входу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Экран первого пользователя (суперадмин)
  if (registered && isFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать!</h1>
            <p className="text-gray-500">
              Вы зарегистрированы как суперадминистратор. Перенаправление...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-xl mb-4">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
            <p className="text-gray-500 mt-1">Создайте аккаунт в CRM Studio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Иван Иванов"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="email@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Должность</label>
              <input
                type="text"
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Менеджер по продажам"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Минимум 6 символов"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}