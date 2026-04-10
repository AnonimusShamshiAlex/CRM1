import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, Palette
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#3b82f6', '#6b7280',
  '#14b8a6', '#f97316', '#84cc16', '#06b6d4',
];

export default function PipelineEditorPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [pipeline, setPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDesc, setPipelineDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [colorPickerStageId, setColorPickerStageId] = useState(null);

  const isAdmin = ['admin', 'director'].includes(user?.role);

  const fetchPipeline = async () => {
    try {
      const { data } = await api.get(`/pipelines/${id}`);
      setPipeline(data);
      setPipelineName(data.name);
      setPipelineDesc(data.description || '');
      setStages(data.stages || []);
    } catch {
      toast.error('Воронка не найдена');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPipeline(); }, [id]);

  const savePipeline = async () => {
    setSaving(true);
    try {
      await api.put(`/pipelines/${id}`, { name: pipelineName, description: pipelineDesc });
      toast.success('Воронка сохранена');
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const addStage = async () => {
    try {
      const maxOrder = stages.reduce((m, s) => Math.max(m, s.order), -1);
      const { data } = await api.post(`/pipelines/${id}/stages`, {
        name: 'Новый этап',
        color: '#6366f1',
        order: maxOrder + 1,
      });
      setStages([...stages, data]);
    } catch {
      toast.error('Ошибка добавления этапа');
    }
  };

  const updateStageLocal = (stageId, field, value) => {
    setStages(stages.map(s => s.id === stageId ? { ...s, [field]: value } : s));
  };

  const saveStage = async (stage) => {
    try {
      await api.put(`/pipelines/${id}/stages/${stage.id}`, {
        name: stage.name,
        color: stage.color,
        order: stage.order,
      });
      toast.success('Этап сохранён');
    } catch {
      toast.error('Ошибка сохранения этапа');
    }
  };

  const deleteStage = async (stageId) => {
    if (!confirm('Удалить этап? Клиенты на этом этапе будут отвязаны.')) return;
    try {
      await api.delete(`/pipelines/${id}/stages/${stageId}`);
      setStages(stages.filter(s => s.id !== stageId));
      toast.success('Этап удалён');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(stages);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    const updated = items.map((s, i) => ({ ...s, order: i }));
    setStages(updated);
    try {
      await api.put(`/pipelines/${id}/stages/reorder`, {
        stageOrders: updated.map(s => ({ id: s.id, order: s.order })),
      });
    } catch {
      fetchPipeline();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Link to="/pipelines" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Воронки
        </Link>
      </div>

      {/* Настройки воронки */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Настройки воронки</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название воронки</label>
            <input
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              disabled={!isAdmin}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={pipelineDesc}
              onChange={(e) => setPipelineDesc(e.target.value)}
              disabled={!isAdmin}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none disabled:bg-gray-50"
            />
          </div>
          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={savePipeline}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Этапы воронки */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Этапы воронки</h2>
          {isAdmin && (
            <button
              onClick={addStage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить этап
            </button>
          )}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="stages">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {stages.map((stage, index) => (
                  <Draggable key={stage.id} draggableId={stage.id} index={index} isDragDisabled={!isAdmin}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          snapshot.isDragging ? 'bg-primary-50 border-primary-200 shadow-md' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {isAdmin && (
                          <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        {/* Цвет */}
                        <div className="relative">
                          <button
                            onClick={() => isAdmin && setColorPickerStageId(colorPickerStageId === stage.id ? null : stage.id)}
                            className="w-7 h-7 rounded-full border-2 border-white shadow-sm cursor-pointer"
                            style={{ backgroundColor: stage.color }}
                            title="Выбрать цвет"
                          />
                          {colorPickerStageId === stage.id && (
                            <div className="absolute z-10 top-9 left-0 bg-white rounded-xl border border-gray-200 shadow-lg p-3">
                              <div className="grid grid-cols-4 gap-2">
                                {PRESET_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => {
                                      updateStageLocal(stage.id, 'color', c);
                                      setColorPickerStageId(null);
                                      saveStage({ ...stage, color: c });
                                    }}
                                    className="w-7 h-7 rounded-full border-2 border-white hover:scale-110 transition"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Palette className="w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="color"
                                  value={stage.color}
                                  onChange={(e) => updateStageLocal(stage.id, 'color', e.target.value)}
                                  onBlur={() => {
                                    setColorPickerStageId(null);
                                    saveStage(stage);
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer"
                                />
                                <span className="text-xs text-gray-400">Свой цвет</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Название */}
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => updateStageLocal(stage.id, 'name', e.target.value)}
                          onBlur={() => saveStage(stage)}
                          disabled={!isAdmin}
                          className="flex-1 text-sm bg-transparent border-none outline-none focus:bg-white focus:px-2 focus:py-1 focus:border focus:border-gray-300 focus:rounded-md transition-all disabled:text-gray-600"
                        />

                        <span className="text-xs text-gray-400 shrink-0">#{index + 1}</span>

                        {isAdmin && (
                          <button
                            onClick={() => deleteStage(stage.id)}
                            className="text-gray-300 hover:text-red-500 transition shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {stages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Нет этапов. Добавьте первый.</p>
        )}
      </div>
    </div>
  );
}
