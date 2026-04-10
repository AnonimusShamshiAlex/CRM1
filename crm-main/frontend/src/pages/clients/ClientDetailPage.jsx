import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MessageCircle, Send, Building2, FileText,
  PhoneCall, PhoneOff, Mic, MicOff, Clock, Play
} from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ClientForm from './ClientForm';
import FileUpload from '../../components/ui/FileUpload';
import { formatDate } from '../../utils/constants';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const interactionTypes = [
  { value: 'call', label: 'Звонок', icon: Phone },
  { value: 'meeting', label: 'Встреча', icon: Building2 },
  { value: 'email', label: 'Письмо', icon: Mail },
  { value: 'comment', label: 'Комментарий', icon: MessageCircle },
];

function formatDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function CallRecordPlayer({ url, duration }) {
  return (
    <div className="mt-2 bg-gray-50 rounded-lg p-2 flex items-center gap-2">
      <Play className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <audio
        controls
        src={url}
        className="h-6 w-full"
        controlsList="nodownload"
        style={{ accentColor: '#6366f1' }}
      />
      {duration && (
        <span className="text-xs text-gray-400 shrink-0">{formatDuration(duration)}</span>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [newInteraction, setNewInteraction] = useState({ type: 'comment', content: '' });
  const [calling, setCalling] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [pipelines, setPipelines] = useState([]);

  const fetchClient = async () => {
    try {
      const { data } = await api.get(`/clients/${id}`);
      setClient(data);
    } catch {
      toast.error('Клиент не найден');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  fetchClient();
  api.get('/client-fields').then(({ data }) => setCustomFields(data)).catch(() => {});
  api.get('/pipelines').then(({ data }) => setPipelines(data)).catch(() => {});
}, [id]);

  const addInteraction = async (e) => {
    e.preventDefault();
    if (!newInteraction.content.trim()) return;
    try {
      await api.post(`/clients/${id}/interactions`, newInteraction);
      setNewInteraction({ type: 'comment', content: '' });
      fetchClient();
      toast.success('Взаимодействие добавлено');
    } catch {
      toast.error('Ошибка');
    }
  };

  // Инициация звонка через IP-телефонию
  const handleCall = async () => {
    if (!client?.phone) {
      toast.error('У клиента нет номера телефона');
      return;
    }
    setCalling(true);
    try {
      const { data } = await api.post('/calls/initiate', {
        clientId: client.id,
        phone: client.phone,
      });
      setActiveCallId(data.interactionId);
      toast.success(`Звонок на ${client.phone} инициирован`);
      // Обновляем через 2 сек чтобы показать новую запись взаимодействия
      setTimeout(() => {
        fetchClient();
        setCalling(false);
      }, 2000);
    } catch {
      toast.error('Ошибка инициации звонка');
      setCalling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return <p>Клиент не найден</p>;

  const stageName = client.pipelineStage?.name || client.stage || '—';
  const stageColor = client.pipelineStage?.color;

  return (
    <div className="space-y-6">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2">
        <Link to="/clients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Клиенты
        </Link>
      </div>

      {/* Основная инфа */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: stageColor || '#6b7280' }}
              >
                {stageName}
              </span>
            </div>
            {client.companyName && (
              <p className="text-gray-500 mt-1">{client.companyName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Кнопка IP-звонка */}
            {client.phone && (
              <button
                onClick={handleCall}
                disabled={calling}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
              >
                {calling ? (
                  <>
                    <PhoneCall className="w-4 h-4 animate-pulse" />
                    Соединение...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    Позвонить
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setShowEdit(true)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Редактировать
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {client.email && (
            <div>
              <span className="text-xs text-gray-400">Email</span>
              <p className="text-sm text-gray-700">{client.email}</p>
            </div>
          )}
          {client.phone && (
            <div>
              <span className="text-xs text-gray-400">Телефон</span>
              <p className="text-sm text-gray-700">{client.phone}</p>
            </div>
          )}
          {client.telegram && (
            <div>
              <span className="text-xs text-gray-400">Telegram</span>
              <p className="text-sm text-gray-700">{client.telegram}</p>
            </div>
          )}
          {client.source && (
            <div>
              <span className="text-xs text-gray-400">Источник</span>
              <p className="text-sm text-gray-700">{client.source}</p>
            </div>
          )}
          {client.inn && (
            <div>
              <span className="text-xs text-gray-400">ИНН</span>
              <p className="text-sm text-gray-700">{client.inn}</p>
            </div>
          )}
          {client.manager && (
            <div>
              <span className="text-xs text-gray-400">Менеджер</span>
              <p className="text-sm text-gray-700">{client.manager.name}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-400">Первый контакт</span>
            <p className="text-sm text-gray-700">{formatDate(client.firstContactDate)}</p>
          </div>
          {client.category && (
            <div>
              <span className="text-xs text-gray-400">Категория</span>
              <p className="text-sm text-gray-700">{client.category}</p>
            </div>
          )}
          {client.pipeline && (
            <div>
              <span className="text-xs text-gray-400">Воронка</span>
              <p className="text-sm text-gray-700">{client.pipeline.name}</p>
            </div>
          )}
        </div>

        {/* Теги лида */}
        {client.leadTags?.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {client.leadTags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Обычные теги */}
        {client.tags?.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {client.tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Кастомные поля */}
        {customFields.length > 0 && client.customFields && Object.keys(client.customFields).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Доп. поля</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {customFields.map((f) => {
                const val = client.customFields[f.fieldKey];
                if (!val && val !== 0 && val !== false) return null;
                return (
                  <div key={f.id}>
                    <span className="text-xs text-gray-400">{f.name}</span>
                    <p className="text-sm text-gray-700">{String(val)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Файлы */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Файлы</h2>
        <FileUpload
          entity="clients"
          entityId={id}
          files={client.files || []}
          onFilesChange={async (files) => {
            await api.put(`/clients/${id}`, { files });
            fetchClient();
          }}
        />
      </div>

      {/* История взаимодействий с аудиоплеером */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">История взаимодействий</h2>

        {/* Форма добавления */}
        <form onSubmit={addInteraction} className="mb-6">
          <div className="flex gap-2 mb-2">
            {interactionTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setNewInteraction({ ...newInteraction, type: t.value })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  newInteraction.type === t.value
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInteraction.content}
              onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })}
              placeholder="Добавить запись..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Список */}
        <div className="space-y-4">
          {client.interactions?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Нет записей</p>
          )}
          {client.interactions?.map((i) => {
            const typeInfo = interactionTypes.find((t) => t.value === i.type);
            const TypeIcon = typeInfo?.icon || MessageCircle;
            const isCallWithRecording = i.type === 'call' && i.recordingUrl;
            return (
              <div key={i.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  i.type === 'call' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <TypeIcon className={`w-4 h-4 ${i.type === 'call' ? 'text-green-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{i.author?.name}</span>
                    <span className="text-xs text-gray-400">
                      {typeInfo?.label}
                      {i.callStatus && i.callStatus !== 'completed' && (
                        <span className="text-red-400 ml-1">
                          ({i.callStatus === 'missed' ? 'пропущен' : i.callStatus === 'busy' ? 'занято' : 'нет ответа'})
                        </span>
                      )}
                      {' | '}{formatDate(i.date)}
                    </span>
                    {i.callDuration && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDuration(i.callDuration)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{i.content}</p>

                  {/* Аудиоплеер для записи разговора */}
                  {isCallWithRecording && (
                    <CallRecordPlayer url={i.recordingUrl} duration={i.callDuration} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Модалка редактирования */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Редактировать клиента" size="lg">
<ClientForm client={client} pipelines={pipelines} onSaved={() => { setShowEdit(false); fetchClient(); }} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
