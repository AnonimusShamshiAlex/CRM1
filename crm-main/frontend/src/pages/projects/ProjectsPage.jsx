import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ProjectForm from './ProjectForm';
import { PROJECT_STATUSES, getStatusInfo, formatDate, formatMoney } from '../../utils/constants';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchProjects = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/projects', { params });
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [search, statusFilter]);

  const handleSaved = () => {
    setShowForm(false);
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Новый проект
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск проектов..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">Все статусы</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-12 text-gray-400">
            <FolderKanban className="w-12 h-12 mb-3" />
            <p>Нет проектов</p>
          </div>
        )}
        {projects.map((p) => {
          const st = getStatusInfo(PROJECT_STATUSES, p.status);
          const progress = p.stages ? Math.round((p.stages.filter((s) => s.done).length / p.stages.length) * 100) : 0;
          return (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.client?.companyName || p.client?.name || 'Без клиента'}
                  </p>
                </div>
                <Badge variant={st.color}>{st.label}</Badge>
              </div>

              {/* Прогресс */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Прогресс</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Дедлайн: {formatDate(p.deadline)}</span>
                {p.budgetPlan && <span>{formatMoney(p.budgetPlan)}</span>}
              </div>

              {p.members?.length > 0 && (
                <div className="flex -space-x-2 mt-3">
                  {p.members.slice(0, 4).map((m) => (
                    <div key={m.id} className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-semibold">
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {p.members.length > 4 && (
                    <div className="w-7 h-7 bg-gray-100 text-gray-500 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Новый проект" size="lg">
        <ProjectForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
