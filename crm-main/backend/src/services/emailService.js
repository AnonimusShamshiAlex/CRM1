const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  // Если настройки SMTP не заданы — не отправляем
  if (!process.env.SMTP_HOST) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email] SMTP не настроен. Пропускаем отправку: "${subject}" -> ${to}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || '"CRM Studio" <noreply@crm-studio.local>',
      to,
      subject,
      html,
    });
    console.log(`[Email] Отправлено: "${subject}" -> ${to}`);
    return true;
  } catch (err) {
    console.error(`[Email] Ошибка отправки:`, err.message);
    return false;
  }
};

// Шаблоны
const sendTaskAssigned = async (user, task) => {
  return sendEmail({
    to: user.email,
    subject: `Новая задача: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #2563EB;">Вам назначена задача</h2>
        <p><b>${task.title}</b></p>
        ${task.description ? `<p style="color: #6B7280;">${task.description}</p>` : ''}
        ${task.deadline ? `<p>Дедлайн: <b>${new Date(task.deadline).toLocaleDateString('ru-RU')}</b></p>` : ''}
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">CRM Studio</p>
      </div>
    `,
  });
};

const sendTaskStatusChanged = async (user, task, newStatus) => {
  const statusLabels = {
    open: 'Открыта', in_progress: 'В работе', review: 'На проверке',
    done: 'Выполнена', rejected: 'Отклонена',
  };

  return sendEmail({
    to: user.email,
    subject: `Статус задачи изменён: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #2563EB;">Статус задачи изменён</h2>
        <p><b>${task.title}</b></p>
        <p>Новый статус: <b>${statusLabels[newStatus] || newStatus}</b></p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">CRM Studio</p>
      </div>
    `,
  });
};

const sendDeadlineReminder = async (user, task) => {
  return sendEmail({
    to: user.email,
    subject: `Приближается дедлайн: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #D97706;">Приближается дедлайн</h2>
        <p><b>${task.title}</b></p>
        <p>Дедлайн: <b>${new Date(task.deadline).toLocaleDateString('ru-RU')}</b></p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">CRM Studio</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendTaskAssigned,
  sendTaskStatusChanged,
  sendDeadlineReminder,
};
