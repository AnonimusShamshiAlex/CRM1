import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ChevronRight, Layers } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function PipelinesPage() {
  const { user } = useAuthStore();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const isAdmin = ['admin', 'director'].includes(user?.role);

  const fetchPipelines = async () => {
    try {
      const { data } = await api.get('/pipelines');
      setPipelines(data);
    } catch {
      toast.error('Ошибка загрузки воронок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPipelines(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/pipelines', form);
      toast.success('Воронка создана');
      setShowForm(false);
      setForm({ name: '', description: '' });
      fetchPipelines();
    } catch {
      toast.error('Ошибка создания воронки');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить воронку? Все клиенты будут отвязаны от неё.')) return;
    try {
      await api.delete(`/pipelines/${id}`);
      toast.success('Воронка удалена');
      fetchPipelines();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Воронки продаж</h1>
          <p className="text-sm text-gray-500 mt-1">Управление воронками и этапами сделок</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Новая воронка
          </button>
        )}
      </div>

      {pipelines.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Нет воронок продаж</p>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
            >
              Создать первую воронку
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-4 h-4 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/pipelines/${p.id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {p.description && (
                <p className="text-sm text-gray-500 mb-3">{p.description}</p>
              )}

              {/* Этапы */}
              <div className="space-y-1.5 mb-4">
                {(p.stages || []).slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color || '#6366f1' }}
                    />
                    <span className="text-xs text-gray-600">{s.name}</span>
                  </div>
                ))}
                {(p.stages?.length || 0) > 5 && (
                  <span className="text-xs text-gray-400">+{p.stages.length - 5} ещё</span>
                )}
              </div>

              <Link
                to={`/pipelines/${p.id}/edit`}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {isAdmin ? 'Редактировать' : 'Открыть'}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Новая воронка продаж">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder='Например: "Воронка IT-разработка"'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Краткое описание воронки..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <p className="text-xs text-gray-400">Базовые этапы будут добавлены автоматически. Вы сможете их настроить.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
              Отмена
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-50">
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
