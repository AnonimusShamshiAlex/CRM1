import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Download, ChevronDown, Layers } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api, { API_BASE } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ClientForm from './ClientForm';
import { CLIENT_SOURCES, getStatusInfo, formatDate } from '../../utils/constants';
import clsx from 'clsx';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const { token } = useAuthStore();

  const handleExport = (url) => {
    if (!token) {
      alert('Сессия истекла. Войдите заново.');
      window.location.href = '/login';
      return;
    }
    window.location.href = url;
  };

  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [pipelinesLoading, setPipelinesLoading] = useState(true);

  // Загружаем воронки
  useEffect(() => {
    api.get('/pipelines').then(({ data }) => {
      setPipelines(data);
    }).catch(() => {}).finally(() => setPipelinesLoading(false));
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const params = { search, limit: 200 };
      if (selectedPipeline) params.pipelineId = selectedPipeline.id;
      const { data } = await api.get('/clients', { params });
      setClients(data.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedPipeline]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Этапы текущей воронки
  const stages = selectedPipeline?.stages || [];

const handleDragEnd = async (result) => {
  if (!result.destination) return;
  const { draggableId, destination } = result;
  const newStageId = destination.droppableId;

  // Если перетащили в "__no_pipeline__" — отвязываем от воронки
  if (newStageId === '__no_pipeline__') {
    setClients((prev) =>
      prev.map((c) => (c.id === draggableId ? { ...c, pipelineStageId: null, pipelineId: null } : c))
    );
    try {
      await api.patch(`/clients/${draggableId}/pipeline-stage`, {
        pipelineId: '',
        pipelineStageId: '',
        stageOrder: destination.index,
      });
    } catch {
      fetchClients();
    }
    return;
  }

  // Определяем pipelineId из этапа
  let targetPipelineId = selectedPipeline?.id;

  // Если мы на вкладке "Все" — найдём pipelineId по stageId
  if (!targetPipelineId) {
    for (const p of pipelines) {
      const found = (p.stages || []).find(s => String(s.id) === String(newStageId));
      if (found) {
        targetPipelineId = p.id;
        break;
      }
    }
  }

  setClients((prev) =>
    prev.map((c) => (c.id === draggableId
      ? { ...c, pipelineStageId: newStageId, pipelineId: targetPipelineId }
      : c))
  );

  try {
    await api.patch(`/clients/${draggableId}/pipeline-stage`, {
      pipelineId: targetPipelineId || '',
      pipelineStageId: newStageId,
      stageOrder: destination.index,
    });
  } catch {
    fetchClients();
  }
};

  const handleSaved = () => {
    setShowForm(false);
    setEditClient(null);
    fetchClients();
  };

  if (loading || pipelinesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Клиенты и лиды</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport(`${API_BASE}/export/clients?token=${token}`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => { setEditClient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Новый клиент
          </button>
        </div>
      </div>

      {/* Выбор воронки */}
      {pipelines.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Layers className="w-4 h-4" />
            <span>Воронка:</span>
          </div>
          <button
            onClick={() => setSelectedPipeline(null)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition border',
              !selectedPipeline
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            )}
          >
            Все
          </button>
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPipeline(p)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition border',
                selectedPipeline?.id === p.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              )}
            >
              {p.name}
            </button>
          ))}
          {pipelines.length === 0 && (
            <Link to="/pipelines" className="text-xs text-primary-600 hover:underline">
              Создать воронку
            </Link>
          )}
        </div>
      )}

      {/* Фильтры */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск клиентов..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
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
        </div>
      </div>

      {/* Kanban — динамические колонки из воронки */}
      {view === 'kanban' && !loading && !pipelinesLoading && (
        <>
          {stages.length > 0 || clients.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {/* Колонка клиентов без воронки */}
                {clients.some(c => !c.pipelineStageId) && (
                  <Droppable droppableId="__no_pipeline__">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={clsx(
                          'min-w-[280px] w-[280px] bg-gray-50 rounded-xl p-3 border-2 border-dashed border-gray-200',
                          snapshot.isDraggingOver && 'bg-primary-50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-500">Без воронки</h3>
                          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                            {clients.filter(c => !c.pipelineStageId).length}
                          </span>
                        </div>
                        <div className="space-y-2 min-h-[60px]">
                          {clients.filter(c => !c.pipelineStageId).map((client, index) => (
                            <Draggable key={client.id} draggableId={client.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow transition cursor-pointer"
                                >
                                  <Link to={`/clients/${client.id}`}>
                                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                    {client.companyName && (
                                      <p className="text-xs text-gray-500 mt-0.5">{client.companyName}</p>
                                    )}
                                  </Link>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )}
                {stages.map((stage) => {
                  const stageClients = clients.filter((c) => String(c.pipelineStageId) === String(stage.id));
                  return (
                    <Droppable droppableId={String(stage.id)} key={stage.id}>
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
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: stage.color || '#6366f1' }}
                              />
                              <h3 className="text-sm font-semibold text-gray-700">{stage.name}</h3>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                              {stageClients.length}
                            </span>
                          </div>
                          <div className="space-y-2 min-h-[60px]">
                            {stageClients.map((client, index) => (
                              <Draggable key={client.id} draggableId={client.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow transition cursor-pointer"
                                  >
                                    <Link to={`/clients/${client.id}`}>
                                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                      {client.companyName && (
                                        <p className="text-xs text-gray-500 mt-0.5">{client.companyName}</p>
                                      )}
                                      {client.leadTags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                          {client.leadTags.map((t, i) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                              {t}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 mt-2">
                                        {client.source && (
                                          <span className="text-[10px] text-gray-400">{client.source}</span>
                                        )}
                                        {client.manager && (
                                          <span className="text-[10px] text-gray-400 ml-auto">
                                            {client.manager.name}
                                          </span>
                                        )}
                                      </div>
                                    </Link>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">
                {!selectedPipeline 
                  ? 'Выберите воронку для отображения в виде Канбан или переключитесь на список'
                  : pipelines.length === 0
                  ? 'Создайте воронку продаж чтобы начать работу'
                  : 'В этой воронке нет этапов'}
              </p>
              <Link to="/pipelines" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
                Настроить воронки →
              </Link>
            </div>
          )}
        </>
      )}
      {view === 'kanban' && (loading || pipelinesLoading) && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {view !== 'kanban' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Имя / Компания</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Контакты</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Этап</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Источник</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Теги</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Менеджер</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => {
                const stageName = stages.find(s => s.id === c.pipelineStageId)?.name || c.stage || '—';
                const stageColor = stages.find(s => s.id === c.pipelineStageId)?.color;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {c.name}
                      </Link>
                      {c.companyName && <p className="text-xs text-gray-400">{c.companyName}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.email && <div>{c.email}</div>}
                      {c.phone && <div>{c.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: stageColor || '#6b7280' }}
                      >
                        {stageName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.source || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.leadTags?.map((t, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.manager?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      {/* Форма создания */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editClient ? 'Редактировать клиента' : 'Новый клиент'} size="lg">
        <ClientForm
          client={editClient}
          pipelines={pipelines}
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
