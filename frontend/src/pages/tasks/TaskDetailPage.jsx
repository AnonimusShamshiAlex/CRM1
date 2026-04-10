import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Play, Square, Clock, Plus, CheckCircle2, Circle, Trash2,
} from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import TaskForm from './TaskForm';
import FileUpload from '../../components/ui/FileUpload';
import { TASK_STATUSES, TASK_PRIORITIES, getStatusInfo, formatDate, formatSeconds } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showSubtask, setShowSubtask] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [manualHours, setManualHours] = useState('');
  const [manualComment, setManualComment] = useState('');
  const intervalRef = useRef(null);

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data);
      // Если таймер запущен — запустить локальный отсчёт
      if (data.timerStartedAt) {
        const elapsed = Math.floor((Date.now() - new Date(data.timerStartedAt).getTime()) / 1000);
        setTimerSeconds(elapsed);
      }
    } catch {
      toast.error('Задача не найдена');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  useEffect(() => {
    if (task?.timerStartedAt) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000);
        setTimerSeconds(elapsed);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [task?.timerStartedAt]);

  const startTimer = async () => {
    try {
      await api.post(`/tasks/${id}/timer/start`);
      fetchTask();
      toast.success('Таймер запущен');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  const stopTimer = async () => {
    try {
      clearInterval(intervalRef.current);
      const { data } = await api.post(`/tasks/${id}/timer/stop`);
      setTimerSeconds(0);
      fetchTask();
      toast.success(`Записано ${formatSeconds(data.seconds)}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  const addManualTime = async (e) => {
    e.preventDefault();
    if (!manualHours) return;
    try {
      await api.post(`/tasks/${id}/time`, { hours: parseFloat(manualHours), comment: manualComment });
      setManualHours('');
      setManualComment('');
      fetchTask();
      toast.success('Время добавлено');
    } catch (err) {
      toast.error('Ошибка');
    }
  };

  const toggleChecklist = async (index) => {
    const updated = [...(task.checklist || [])];
    updated[index] = { ...updated[index], done: !updated[index].done };
    try {
      await api.put(`/tasks/${id}`, { checklist: updated });
      setTask({ ...task, checklist: updated });
    } catch {
      toast.error('Ошибка');
    }
  };

  const addChecklistItem = async () => {
    const text = prompt('Пункт чек-листа:');
    if (!text) return;
    const updated = [...(task.checklist || []), { text, done: false }];
    try {
      await api.put(`/tasks/${id}`, { checklist: updated });
      setTask({ ...task, checklist: updated });
    } catch {
      toast.error('Ошибка');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) return <p>Задача не найдена</p>;

  const st = getStatusInfo(TASK_STATUSES, task.status);
  const pr = getStatusInfo(TASK_PRIORITIES, task.priority);
  const isTimerRunning = !!task.timerStartedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/tasks" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Задачи
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
                  <Badge variant={st.color}>{st.label}</Badge>
                  <Badge variant={pr.color}>{pr.label}</Badge>
                </div>
                {task.project && (
                  <Link to={`/projects/${task.project.id}`} className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block">
                    {task.project.name}
                  </Link>
                )}
              </div>
              <button
                onClick={() => setShowEdit(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Редактировать
              </button>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">{task.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <span className="text-xs text-gray-400">Исполнитель</span>
                <p className="text-sm text-gray-700">{task.assignee?.name || '—'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Создатель</span>
                <p className="text-sm text-gray-700">{task.createdBy?.name || '—'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Дедлайн</span>
                <p className="text-sm text-gray-700">{formatDate(task.deadline)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Оценка</span>
                <p className="text-sm text-gray-700">{task.estimatedHours ? `${task.estimatedHours}ч` : '—'}</p>
              </div>
            </div>
          </div>

          {/* Файлы */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Вложения</h2>
            <FileUpload
              entity="tasks"
              entityId={id}
              files={task.files || []}
              onFilesChange={async (files) => {
                await api.put(`/tasks/${id}`, { files });
                fetchTask();
              }}
            />
          </div>

          {/* Чек-лист */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Чек-лист</h2>
              <button onClick={addChecklistItem} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Добавить
              </button>
            </div>
            {task.checklist?.length === 0 && (
              <p className="text-sm text-gray-400">Нет пунктов</p>
            )}
            <div className="space-y-2">
              {task.checklist?.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleChecklist(i)}
                  className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-gray-50 transition"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Подзадачи */}
          {task.subtasks?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Подзадачи</h2>
              <div className="space-y-2">
                {task.subtasks.map((sub) => {
                  const subSt = getStatusInfo(TASK_STATUSES, sub.status);
                  return (
                    <Link
                      key={sub.id}
                      to={`/tasks/${sub.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      <span className="text-sm text-gray-900">{sub.title}</span>
                      <div className="flex items-center gap-2">
                        {sub.assignee && <span className="text-xs text-gray-400">{sub.assignee.name}</span>}
                        <Badge variant={subSt.color}>{subSt.label}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Трекер времени */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Трекер времени
            </h2>

            <div className="text-center mb-4">
              <p className="text-3xl font-mono font-bold text-gray-900">
                {formatSeconds(isTimerRunning ? timerSeconds : 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Всего: {formatSeconds(task.trackedSeconds)}
              </p>
            </div>

            <button
              onClick={isTimerRunning ? stopTimer : startTimer}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition ${
                isTimerRunning
                  ? 'bg-danger-500 text-white hover:bg-danger-600'
                  : 'bg-success-500 text-white hover:bg-success-600'
              }`}
            >
              {isTimerRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isTimerRunning ? 'Остановить' : 'Запустить'}
            </button>

            {/* Ручной ввод */}
            <form onSubmit={addManualTime} className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Добавить вручную:</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  placeholder="Часы"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Лог времени */}
          {task.timeLogs?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Лог времени</h2>
              <div className="space-y-2">
                {task.timeLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-700">{log.user?.name}</span>
                      {log.comment && <p className="text-xs text-gray-400">{log.comment}</p>}
                    </div>
                    <span className="text-gray-500 font-mono">{formatSeconds(log.seconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Редактировать задачу" size="lg">
        <TaskForm task={task} onSaved={() => { setShowEdit(false); fetchTask(); }} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
