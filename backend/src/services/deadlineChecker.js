// services/deadlineChecker.js — Cron проверки дедлайнов каждый час
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Task, User, Notification } = require('../models');
const { emailService } = require('./emailService');

const checkDeadlines = async () => {
  const now      = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const overdue = await Task.findAll({
    where: {
      deadline: { [Op.between]: [now, tomorrow] },
      status:   { [Op.ne]: 'done' },
    },
    include: [{ model: User, as: 'assignee', attributes: ['id','name','email'] }],
  });

  for (const task of overdue) {
    if (!task.assignee) continue;

    // Не дублируем уведомления
    const exists = await Notification.findOne({
      where: {
        userId:    task.assignee.id,
        type:      'deadline',
        link:      `/tasks/${task.id}`,
        createdAt: { [Op.gte]: new Date(Date.now() - 20 * 60 * 60 * 1000) }, // за последние 20ч
      },
    });
    if (exists) continue;

    await Notification.create({
      userId: task.assignee.id,
      title:  'Дедлайн скоро',
      body:   `Задача «${task.title}» — дедлайн ${new Date(task.deadline).toLocaleDateString('ru-RU')}`,
      type:   'deadline',
      link:   `/tasks/${task.id}`,
    });

    if (task.assignee.email) {
      await emailService.sendDeadlineReminder(
        task.assignee.email,
        task.assignee.name,
        task.title,
        task.deadline,
      );
    }
  }

  if (overdue.length) {
    console.log(`[DeadlineChecker] Отправлено напоминаний: ${overdue.length}`);
  }
};

const startDeadlineChecker = () => {
  cron.schedule('0 * * * *', checkDeadlines, { timezone: 'Asia/Tashkent' });
  console.log('[DeadlineChecker] Cron запущен — проверка каждый час');
};

module.exports = { startDeadlineChecker, checkDeadlines };
