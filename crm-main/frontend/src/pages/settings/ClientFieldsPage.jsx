import { useEffect, useState } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число' },
  { value: 'date', label: 'Дата' },
  { value: 'select', label: 'Список' },
  { value: 'checkbox', label: 'Флажок' },
];

export default function ClientFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', fieldType: 'text', required: false, options: '' });
  const [saving, setSaving] = useState(false);

  const fetchFields = async () => {
    try {
      const { data } = await api.get('/client-fields');
      setFields(data);
    } catch {
      toast.error('Ошибка загрузки полей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFields(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const options = form.fieldType === 'select'
        ? form.options.split('\n').map(s => s.trim()).filter(Boolean)
        : [];
      await api.post('/client-fields', { ...form, options });
      toast.success('Поле добавлено');
      setShowForm(false);
      setForm({ name: '', fieldType: 'text', required: false, options: '' });
      fetchFields();
    } catch {
      toast.error('Ошибка создания поля');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить поле? Данные в существующих карточках сохранятся.')) return;
    try {
      await api.delete(`/client-fields/${id}`);
      toast.success('Поле удалено');
      fetchFields();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Поля карточки клиента</h1>
          <p className="text-sm text-gray-500 mt-1">Настройка кастомных полей для карточек лидов и клиентов</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Добавить поле
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {fields.length === 0 ? (
          <div className="p-12 text-center">
            <Settings className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Нет кастомных полей</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Название</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Тип</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Обязательное</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {FIELD_TYPES.find(t => t.value === f.fieldType)?.label || f.fieldType}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {f.required ? 'Да' : 'Нет'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Новое поле">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название поля *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Например: Бюджет проекта"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
            <select
              value={form.fieldType}
              onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {FIELD_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {form.fieldType === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Варианты (каждый с новой строки)</label>
              <textarea
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
                rows={4}
                placeholder={"Вариант 1\nВариант 2\nВариант 3"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-700">Обязательное поле</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Отмена
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
