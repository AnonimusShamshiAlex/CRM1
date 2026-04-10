import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function TaskForm({ task, defaultProjectId, onSaved, onCancel }) {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const { register, handleSubmit } = useForm({
    defaultValues: task || {
      status: 'open',
      priority: 'medium',
      projectId: defaultProjectId || '',
    },
  });

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/projects'),
    ]).then(([usersRes, projectsRes]) => {
      setUsers(usersRes.data);
      setProjects(projectsRes.data);
    });
  }, []);

  const onSubmit = async (data) => {
    try {
      if (task) {
        await api.put(`/tasks/${task.id}`, data);
        toast.success('Задача обновлена');
      } else {
        await api.post('/tasks', data);
        toast.success('Задача создана');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Название *</label>
        <input {...register('title', { required: true })} className={inputClass} placeholder="Сверстать главную страницу" />
      </div>

      <div>
        <label className={labelClass}>Описание</label>
        <textarea {...register('description')} rows={3} className={inputClass} placeholder="Подробное описание задачи..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Проект</label>
          <select {...register('projectId')} className={inputClass}>
            <option value="">Без проекта</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Исполнитель</label>
          <select {...register('assigneeId')} className={inputClass}>
            <option value="">Не назначен</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Приоритет</label>
          <select {...register('priority')} className={inputClass}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Статус</label>
          <select {...register('status')} className={inputClass}>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Дедлайн</label>
          <input type="date" {...register('deadline')} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Оценка (часы)</label>
        <input type="number" step="0.5" {...register('estimatedHours')} className={inputClass} placeholder="8" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          Отмена
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
          {task ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
