// services/emailService.js
const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const FROM = process.env.SMTP_FROM || 'CRM Studio <noreply@crm.com>';

const send = async ({ to, subject, html }) => {
  try {
    await getTransporter().sendMail({ from: FROM, to, subject, html });
  } catch (e) {
    console.error('[Email] Ошибка отправки:', e.message);
  }
};

const sendInvite = (email, name, tempPassword) =>
  send({
    to: email,
    subject: 'Приглашение в CRM Studio',
    html: `
      <h2>Привет, ${name}!</h2>
      <p>Вас пригласили в CRM Studio.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Временный пароль:</strong> <code>${tempPassword}</code></p>
      <p>Войдите и смените пароль в настройках профиля.</p>
    `,
  });

const sendBackupError = (email, error) =>
  send({
    to: email,
    subject: '⚠️ Ошибка бэкапа CRM Studio',
    html: `<h2>Ошибка резервного копирования</h2><pre>${error}</pre>`,
  });

const sendDeadlineReminder = (email, name, taskTitle, deadline) =>
  send({
    to: email,
    subject: `⏰ Дедлайн завтра: ${taskTitle}`,
    html: `
      <h2>Напоминание о дедлайне</h2>
      <p>Привет, ${name}!</p>
      <p>Завтра истекает срок задачи <strong>«${taskTitle}»</strong> — ${new Date(deadline).toLocaleDateString('ru-RU')}.</p>
    `,
  });

module.exports = {
  emailService: { sendInvite, sendBackupError, sendDeadlineReminder },
};
