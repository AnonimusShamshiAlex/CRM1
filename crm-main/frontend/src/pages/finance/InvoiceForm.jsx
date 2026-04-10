import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { INVOICE_STATUSES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function InvoiceForm({ onSaved, onCancel }) {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const { register, handleSubmit, control, watch, setValue } = useForm({
    defaultValues: {
      status: 'draft',
      items: [{ name: '', qty: 1, price: 0 }],
      vatPercent: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const vatPercent = watch('vatPercent');

  useEffect(() => {
    Promise.all([
      api.get('/clients', { params: { limit: 200 } }),
      api.get('/projects'),
    ]).then(([clientsRes, projectsRes]) => {
      setClients(clientsRes.data.clients);
      setProjects(projectsRes.data);
    });
  }, []);

  // Автоматический пересчёт
  const subtotal = items?.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0) || 0;
  const vatAmount = subtotal * (vatPercent || 0) / 100;
  const total = subtotal + vatAmount;

  const onSubmit = async (data) => {
    try {
      await api.post('/invoices', {
        ...data,
        subtotal,
        vatAmount,
        total,
        items: data.items.map((i) => ({ ...i, total: i.qty * i.price })),
      });
      toast.success('Счёт создан');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Клиент *</label>
          <select {...register('clientId', { required: true })} className={inputClass}>
            <option value="">Выберите клиента</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Проект</label>
          <select {...register('projectId')} className={inputClass}>
            <option value="">Не указан</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Статус</label>
          <select {...register('status')} className={inputClass}>
            {INVOICE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Срок оплаты</label>
          <input type="date" {...register('dueDate')} className={inputClass} />
        </div>
      </div>

      {/* Позиции */}
      <div>
        <label className={labelClass}>Позиции</label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <input
                {...register(`items.${index}.name`)}
                placeholder="Название"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                {...register(`items.${index}.qty`, { valueAsNumber: true })}
                placeholder="Кол-во"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                step="0.01"
                {...register(`items.${index}.price`, { valueAsNumber: true })}
                placeholder="Цена"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="p-2 text-gray-400 hover:text-danger-500 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => append({ name: '', qty: 1, price: 0 })}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Добавить позицию
        </button>
      </div>

      {/* НДС */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>НДС (%)</label>
          <input type="number" step="0.01" {...register('vatPercent', { valueAsNumber: true })} className={inputClass} />
        </div>
      </div>

      {/* Итоги */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Подитог:</span>
          <span className="text-gray-700">{subtotal.toLocaleString('ru-RU')} руб.</span>
        </div>
        {vatPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">НДС ({vatPercent}%):</span>
            <span className="text-gray-700">{vatAmount.toLocaleString('ru-RU')} руб.</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200">
          <span>Итого:</span>
          <span>{total.toLocaleString('ru-RU')} руб.</span>
        </div>
      </div>

      <div>
        <label className={labelClass}>Примечания</label>
        <textarea {...register('notes')} rows={2} className={inputClass} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          Отмена
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
          Создать счёт
        </button>
      </div>
    </form>
  );
}
