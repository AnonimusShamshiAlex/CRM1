import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { PROJECT_STATUSES } from '../../utils/constants';
import toast from 'react-hot-toast';
import FileUpload from '../../components/ui/FileUpload';

export default function ProjectForm({ project, onSaved, onCancel }) {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: project || { status: 'new', files: [] },
  });
  const files = watch('files') || [];

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/clients', { params: { limit: 200 } }),
    ]).then(([usersRes, clientsRes]) => {
      setUsers(usersRes.data);
      setClients(clientsRes.data.clients);
    });
  }, []);

  const onSubmit = async (data) => {
    try {
      if (project) {
        await api.put(`/projects/${project.id}`, data);
        toast.success('Проект обновлён');
      } else {
        await api.post('/projects', data);
        toast.success('Проект создан');
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
        <input {...register('name', { required: true })} className={inputClass} placeholder="Лендинг для ООО Ромашка" />
      </div>

      <div>
        <label className={labelClass}>Описание</label>
        <textarea {...register('description')} rows={3} className={inputClass} placeholder="Описание проекта..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Клиент</label>
          <select {...register('clientId')} className={inputClass}>
            <option value="">Не указан</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Статус</label>
          <select {...register('status')} className={inputClass}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Дата старта</label>
          <input type="date" {...register('startDate')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Дедлайн</label>
          <input type="date" {...register('deadline')} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Бюджет (план)</label>
          <input type="number" step="0.01" {...register('budgetPlan')} className={inputClass} placeholder="100000" />
        </div>
        <div>
          <label className={labelClass}>Менеджер</label>
          <select {...register('managerId')} className={inputClass}>
            <option value="">Я</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Репозиторий</label>
          <input {...register('repoUrl')} className={inputClass} placeholder="https://github.com/..." />
        </div>
        <div>
          <label className={labelClass}>Figma</label>
          <input {...register('figmaUrl')} className={inputClass} placeholder="https://figma.com/..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Тестовый сервер</label>
          <input {...register('stagingUrl')} className={inputClass} placeholder="https://staging.example.com" />
        </div>
        <div>
          <label className={labelClass}>Боевой сервер</label>
          <input {...register('productionUrl')} className={inputClass} placeholder="https://example.com" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <label className={labelClass}>Вложения</label>
        {project ? (
          <FileUpload
            entity="projects"
            entityId={project.id}
            files={files}
            onFilesChange={(newFiles) => setValue('files', newFiles)}
          />
        ) : (
          <p className="text-xs text-gray-400 italic">
            Загрузка файлов будет доступна после создания проекта.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          Отмена
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
          {project ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
