export const CLIENT_STAGES = [
  { value: 'new', label: 'Новый лид', color: 'blue' },
  { value: 'negotiation', label: 'Переговоры', color: 'purple' },
  { value: 'proposal_sent', label: 'КП отправлено', color: 'yellow' },
  { value: 'contract_signed', label: 'Договор подписан', color: 'indigo' },
  { value: 'in_progress', label: 'В работе', color: 'green' },
  { value: 'completed', label: 'Завершён', color: 'gray' },
];

export const PROJECT_STATUSES = [
  { value: 'new', label: 'Новый', color: 'blue' },
  { value: 'in_progress', label: 'В работе', color: 'green' },
  { value: 'on_pause', label: 'На паузе', color: 'yellow' },
  { value: 'review', label: 'На сдаче', color: 'purple' },
  { value: 'completed', label: 'Завершён', color: 'gray' },
  { value: 'archived', label: 'Архив', color: 'gray' },
];

export const TASK_STATUSES = [
  { value: 'open', label: 'Открыта', color: 'blue' },
  { value: 'in_progress', label: 'В работе', color: 'yellow' },
  { value: 'on_pause', label: 'Остановлено', color: 'gray' },
  { value: 'review', label: 'На проверке', color: 'purple' },
  { value: 'done', label: 'Выполнена', color: 'green' },
  { value: 'rejected', label: 'Отклонена', color: 'red' },
];

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Низкий', color: 'gray' },
  { value: 'medium', label: 'Средний', color: 'blue' },
  { value: 'high', label: 'Высокий', color: 'yellow' },
  { value: 'critical', label: 'Критический', color: 'red' },
];

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Черновик', color: 'gray' },
  { value: 'sent', label: 'Выставлен', color: 'blue' },
  { value: 'partial', label: 'Частично оплачен', color: 'yellow' },
  { value: 'paid', label: 'Оплачен', color: 'green' },
  { value: 'overdue', label: 'Просрочен', color: 'red' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'salary', label: 'Зарплаты' },
  { value: 'contractor', label: 'Подрядчики' },
  { value: 'hosting', label: 'Хостинг/Домены' },
  { value: 'advertising', label: 'Реклама' },
  { value: 'other', label: 'Прочее' },
];

export const CLIENT_SOURCES = [
  { value: 'website', label: 'Сайт' },
  { value: 'referral', label: 'Рекомендация' },
  { value: 'cold_call', label: 'Холодный звонок' },
  { value: 'social', label: 'Соцсети' },
  { value: 'utm', label: 'UTM-метка' },
  { value: 'other', label: 'Другое' },
];

export const EMPLOYEE_TYPES = [
  { value: 'staff', label: 'Штатный' },
  { value: 'contractor', label: 'Подрядчик' },
  { value: 'freelancer', label: 'Фрилансер' },
];

export const ROLES = [
  { value: 'admin', label: 'Администратор' },
  { value: 'director', label: 'Директор' },
  { value: 'head_of_sales', label: 'Руководитель отдела продаж (РОП)' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'executor', label: 'Исполнитель' },
];

export const LEAD_TAGS = [
  '#inst', '#fb', '#olx', '#vk', '#tg', '#ok', '#avito', '#yt', '#site', '#ref',
];

export const formatMoney = (amount) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount || 0) + ' сум';
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}ч ${m}м`;
};

export const getStatusInfo = (list, value) => {
  return list.find((s) => s.value === value) || { label: value, color: 'gray' };
};
