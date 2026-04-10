import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { CLIENT_STAGES, CLIENT_SOURCES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function ClientForm({ client, pipelines = [], onSaved, onCancel }) {
  const [users, setUsers] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(client?.pipelineId || '');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: client || {
      type: 'lead',
      pipelineId: '',
      pipelineStageId: '',
    },
  });

  const selectedPipe = pipelines.find(p => p.id === selectedPipelineId);
  const stages = selectedPipe?.stages || [];

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data));
  }, []);

  const onSubmit = async (data) => {
    try {
      if (client) {
        await api.put(`/clients/${client.id}`, data);
        toast.success('Клиент обновлён');
      } else {
        const res = await api.post('/clients', data);
        if (res.status === 201) {
          toast.success('Клиент создан');
        }
      }
      onSaved();
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicateWarning(err.response.data);
      } else {
        toast.error(err.response?.data?.error || 'Ошибка сохранения');
      }
    }
  };

  const forceSave = async (data) => {
    try {
      await api.post('/clients', { ...data, forceSave: true });
      toast.success('Клиент создан');
      onSaved();
    } catch (err) {
      toast.error('Ошибка сохранения');
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {duplicateWarning && (
        <div className="bg-warning-50 border border-warning-500/20 p-4 rounded-lg">
          <p className="text-sm text-warning-600 font-medium mb-2">Возможный дубликат!</p>
          {duplicateWarning.duplicates.map((d, i) => (
            <p key={i} className="text-xs text-gray-600">
              Совпадение по {d.field}: {d.client.name}
            </p>
          ))}
          <button
            type="button"
            onClick={handleSubmit(forceSave)}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Всё равно сохранить
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Имя *</label>
          <input {...register('name', { required: true })} className={inputClass} placeholder="Иван Иванов" />
        </div>
        <div>
          <label className={labelClass}>Компания</label>
          <input {...register('companyName')} className={inputClass} placeholder="ООО Ромашка" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" {...register('email')} className={inputClass} placeholder="email@company.com" />
        </div>
        <div>
          <label className={labelClass}>Телефон</label>
          <input {...register('phone')} className={inputClass} placeholder="+7 999 123 45 67" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Telegram</label>
          <input {...register('telegram')} className={inputClass} placeholder="@username" />
        </div>
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input {...register('whatsapp')} className={inputClass} placeholder="+7 999 123 45 67" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Воронка</label>
<select 
  {...register('pipelineId', {
    onChange: (e) => {
      setSelectedPipelineId(e.target.value);
      setValue('pipelineStageId', '');
    },
  })}
  className={inputClass}
>
            <option value="">Не выбрана</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Этап воронки</label>
          <select {...register('pipelineStageId')} className={inputClass} disabled={!selectedPipelineId}>
            <option value="">Не выбран</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Спец. статус (тег)</label>
          <select {...register('stage')} className={inputClass}>
            <option value="">—</option>
            {CLIENT_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Источник</label>
          <select {...register('source')} className={inputClass}>
            <option value="">Не указан</option>
            {CLIENT_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Менеджер</label>
          <select {...register('managerId')} className={inputClass}>
            <option value="">Я</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Категория</label>
          <input {...register('category')} className={inputClass} placeholder="VIP, средний..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>ИНН</label>
          <input {...register('inn')} className={inputClass} placeholder="1234567890" />
        </div>
        <div>
          <label className={labelClass}>Юр. название</label>
          <input {...register('legalName')} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Заметки</label>
        <textarea {...register('notes')} rows={3} className={inputClass} placeholder="Дополнительная информация..." />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          Отмена
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
          {client ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
