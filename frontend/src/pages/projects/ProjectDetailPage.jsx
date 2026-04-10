import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, GitBranch, Globe, Figma, CheckCircle2, Circle,
} from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ProjectForm from './ProjectForm';
import FileUpload from '../../components/ui/FileUpload';
import { PROJECT_STATUSES, TASK_STATUSES, TASK_PRIORITIES, getStatusInfo, formatDate, formatMoney } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch {
      toast.error('Проект не найден');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const toggleStage = async (stageId) => {
    const updatedStages = project.stages.map((s) =>
      s.id === stageId ? { ...s, done: !s.done } : s
    );
    try {
      await api.put(`/projects/${id}`, { stages: updatedStages });
      setProject({ ...project, stages: updatedStages });
    } catch {
      toast.error('Ошибка обновления');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return <p>Проект не найден</p>;

  const st = getStatusInfo(PROJECT_STATUSES, project.status);
  const progress = project.stages
    ? Math.round((project.stages.filter((s) => s.done).length / project.stages.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/projects" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Проекты
        </Link>
      </div>

      {/* Основная информация */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant={st.color}>{st.label}</Badge>
            </div>
            {project.client && (
              <Link to={`/clients/${project.client.id}`} className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block">
                {project.client.companyName || project.client.name}
              </Link>
            )}
            {project.description && (
              <p className="text-sm text-gray-600 mt-2">{project.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Редактировать
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <span className="text-xs text-gray-400">Старт</span>
            <p className="text-sm text-gray-700">{formatDate(project.startDate)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Дедлайн</span>
            <p className="text-sm text-gray-700">{formatDate(project.deadline)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Бюджет (план)</span>
            <p className="text-sm text-gray-700">{formatMoney(project.budgetPlan)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Бюджет (факт)</span>
            <p className="text-sm text-gray-700">{formatMoney(project.budgetFact)}</p>
          </div>
        </div>

        {/* Ссылки */}
        <div className="flex flex-wrap gap-3 mt-4">
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
              <GitBranch className="w-3.5 h-3.5" /> Репозиторий
            </a>
          )}
          {project.figmaUrl && (
            <a href={project.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
              <Figma className="w-3.5 h-3.5" /> Figma
            </a>
          )}
          {project.stagingUrl && (
            <a href={project.stagingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
              <Globe className="w-3.5 h-3.5" /> Тест
            </a>
          )}
          {project.productionUrl && (
            <a href={project.productionUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
              <ExternalLink className="w-3.5 h-3.5" /> Продакшен
            </a>
          )}
        </div>

        {/* Команда */}
        {project.members?.length > 0 && (
          <div className="mt-4">
            <span className="text-xs text-gray-400">Команда</span>
            <div className="flex gap-2 mt-1">
              {project.members.map((m) => (
                <div key={m.id} className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                  <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-[10px] font-semibold">
                    {m.name.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-700">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Файлы проекта */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Файлы проекта</h2>
        <FileUpload
          entity="projects"
          entityId={id}
          files={project.files || []}
          onFilesChange={async (files) => {
            await api.put(`/projects/${id}`, { files });
            fetchProject();
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Этапы с чек-листом */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Этапы проекта</h2>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Общий прогресс</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full">
              <div className="h-2 bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {project.stages?.map((stage) => (
              <button
                key={stage.id}
                onClick={() => toggleStage(stage.id)}
                className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-gray-50 transition"
              >
                {stage.done ? (
                  <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
                <span className={`text-sm ${stage.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {stage.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Задачи проекта */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Задачи проекта</h2>
            <Link to={`/tasks?projectId=${id}`} className="text-sm text-primary-600 hover:text-primary-700">
              Все задачи
            </Link>
          </div>
          {project.tasks?.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Нет задач</p>
          ) : (
            <div className="space-y-2">
              {project.tasks?.map((t) => {
                const taskSt = getStatusInfo(TASK_STATUSES, t.status);
                const taskPr = getStatusInfo(TASK_PRIORITIES, t.priority);
                return (
                  <Link
                    key={t.id}
                    to={`/tasks/${t.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.assignee && (
                        <span className="text-xs text-gray-400">{t.assignee.name}</span>
                      )}
                      <Badge variant={taskPr.color}>{taskPr.label}</Badge>
                      <Badge variant={taskSt.color}>{taskSt.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Редактировать проект" size="lg">
        <ProjectForm project={project} onSaved={() => { setShowEdit(false); fetchProject(); }} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
