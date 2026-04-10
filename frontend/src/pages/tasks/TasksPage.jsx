import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import TaskForm from './TaskForm';
import { TASK_STATUSES, TASK_PRIORITIES, getStatusInfo, formatDate, formatSeconds } from '../../utils/constants';
import clsx from 'clsx';

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterProject, setFilterProject] = useState(searchParams.get('projectId') || '');
  const [filterPriority, setFilterPriority] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filterProject) params.projectId = filterProject;
      if (filterPriority) params.priority = filterPriority;
      const { data } = await api.get('/tasks', { params });
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterPriority]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/tasks/${draggableId}`, { status: newStatus, order: destination.index });
    } catch {
      fetchTasks();
    }
  };

  const filteredTasks = search
    ? tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks;

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
        <h1 className="text-2xl font-bold text-gray-900">Задачи</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Новая задача
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск задач..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">Все приоритеты</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={clsx('p-2 rounded-md transition', view === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-500')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={clsx('p-2 rounded-md transition', view === 'list' ? 'bg-white shadow-sm' : 'text-gray-500')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('calendar')}
            className={clsx('p-2 rounded-md transition', view === 'calendar' ? 'bg-white shadow-sm' : 'text-gray-500')}
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TASK_STATUSES.map((status) => {
              const columnTasks = filteredTasks.filter((t) => t.status === status.value);
              return (
                <Droppable droppableId={status.value} key={status.value}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={clsx(
                        'min-w-[280px] w-[280px] bg-gray-100 rounded-xl p-3',
                        snapshot.isDraggingOver && 'bg-primary-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">{status.label}</h3>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                          {columnTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2 min-h-[60px]">
                        {columnTasks.map((task, index) => {
                          const pr = getStatusInfo(TASK_PRIORITIES, task.priority);
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow transition"
                                >
                                  <Link to={`/tasks/${task.id}`}>
                                    <div className="flex items-start justify-between mb-1">
                                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant={pr.color}>{pr.label}</Badge>
                                      {task.deadline && (
                                        <span className="text-[10px] text-gray-400">{formatDate(task.deadline)}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      {task.assignee && (
                                        <div className="flex items-center gap-1">
                                          <div className="w-5 h-5 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-[9px] font-semibold">
                                            {task.assignee.name.charAt(0)}
                                          </div>
                                          <span className="text-[10px] text-gray-400">{task.assignee.name}</span>
                                        </div>
                                      )}
                                      {task.project && (
                                        <span className="text-[10px] text-gray-400">{task.project.name}</span>
                                      )}
                                    </div>
                                    {task.subtasks?.length > 0 && (
                                      <div className="text-[10px] text-gray-400 mt-1">
                                        Подзадач: {task.subtasks.filter((s) => s.status === 'done').length}/{task.subtasks.length}
                                      </div>
                                    )}
                                  </Link>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Задача</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Проект</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Исполнитель</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Приоритет</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Статус</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Дедлайн</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Время</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map((t) => {
                const st = getStatusInfo(TASK_STATUSES, t.status);
                const pr = getStatusInfo(TASK_PRIORITIES, t.priority);
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/tasks/${t.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.project?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.assignee?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge variant={pr.color}>{pr.label}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={st.color}>{st.label}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(t.deadline)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatSeconds(t.trackedSeconds)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'calendar' && (() => {
        const monthStart = startOfMonth(calendarMonth);
        const monthEnd = endOfMonth(calendarMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: calStart, end: calEnd });
        const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {format(calendarMonth, 'LLLL yyyy', { locale: ru })}
              </h2>
              <button
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {weekDays.map((d) => (
                <div key={d} className="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2">
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const dayTasks = filteredTasks.filter(
                  (t) => t.deadline && isSameDay(new Date(t.deadline), day)
                );
                const inMonth = isSameMonth(day, calendarMonth);
                const today = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={clsx(
                      'bg-white min-h-[100px] p-1.5 relative',
                      !inMonth && 'bg-gray-50'
                    )}
                  >
                    <span
                      className={clsx(
                        'text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full',
                        today && 'bg-primary-600 text-white',
                        !today && inMonth && 'text-gray-700',
                        !today && !inMonth && 'text-gray-300'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[80px]">
                      {dayTasks.map((t) => {
                        const pr = getStatusInfo(TASK_PRIORITIES, t.priority);
                        const st = getStatusInfo(TASK_STATUSES, t.status);
                        return (
                          <Link
                            key={t.id}
                            to={`/tasks/${t.id}`}
                            className={clsx(
                              'block text-[10px] leading-tight px-1.5 py-1 rounded truncate transition hover:opacity-80',
                              st.color === 'green' && 'bg-success-100 text-success-700',
                              st.color === 'blue' && 'bg-primary-100 text-primary-700',
                              st.color === 'yellow' && 'bg-warning-100 text-warning-700',
                              st.color === 'red' && 'bg-danger-100 text-danger-700',
                              !['green', 'blue', 'yellow', 'red'].includes(st.color) && 'bg-gray-100 text-gray-700'
                            )}
                            title={`${t.title} — ${st.label} (${pr.label})`}
                          >
                            {t.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Новая задача" size="lg">
        <TaskForm
          defaultProjectId={filterProject}
          onSaved={() => { setShowForm(false); fetchTasks(); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
