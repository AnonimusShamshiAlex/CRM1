import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function ExpenseForm({ onSaved, onCancel }) {
  const [projects, setProjects] = useState([]);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      isPeriodic: false,
    },
  });

  const isPeriodic = watch('isPeriodic');

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data));
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/expenses', data);
      toast.success('Расход добавлен');
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
        <input {...register('name', { required: true })} className={inputClass} placeholder="Оплата хостинга" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Сумма *</label>
          <input type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} className={inputClass} placeholder="5000" />
        </div>
        <div>
          <label className={labelClass}>Категория *</label>
          <select {...register('category', { required: true })} className={inputClass}>
            <option value="">Выберите</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Дата *</label>
          <input type="date" {...register('date', { required: true })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Проект</label>
          <select {...register('projectId')} className={inputClass}>
            <option value="">Не привязан</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" {...register('isPeriodic')} id="isPeriodic" className="rounded" />
        <label htmlFor="isPeriodic" className="text-sm text-gray-700">Периодический расход</label>
      </div>

      {isPeriodic && (
        <div>
          <label className={labelClass}>Периодичность</label>
          <select {...register('periodicity')} className={inputClass}>
            <option value="monthly">Ежемесячно</option>
            <option value="yearly">Ежегодно</option>
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>Заметки</label>
        <textarea {...register('notes')} rows={2} className={inputClass} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          Отмена
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
          Добавить
        </button>
      </div>
    </form>
  );
}
