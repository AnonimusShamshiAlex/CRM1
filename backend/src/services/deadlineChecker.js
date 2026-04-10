const { Op, literal } = require('sequelize');
const { Task, User, Notification } = require('../models');
const { sendDeadlineReminder } = require('./emailService');
const { notifyDeadlineReminder } = require('./telegramBot');

// Проверяет дедлайны задач (запускать раз в день или раз в час)
const checkDeadlines = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Задачи с дедлайном сегодня или завтра, которые ещё не завершены
    const tasks = await Task.findAll({
      where: {
        deadline: { [Op.in]: [today, tomorrow] },
        status: { [Op.notIn]: ['done', 'rejected'] },
        assigneeId: { [Op.ne]: null },
      },
      include: [
        { model: User, as: 'assignee' },
      ],
    });

    for (const task of tasks) {
      const isToday = task.deadline === today;
      const title = isToday
        ? `Дедлайн сегодня: ${task.title}`
        : `Дедлайн завтра: ${task.title}`;

      // Проверяем, что уведомление ещё не создавалось сегодня
const existing = await Notification.findOne({
  where: {
    userId: task.assigneeId,
    type: 'deadline_reminder',
    createdAt: { [Op.gte]: today },
    [Op.and]: [
      literal(`payload->>'taskId' = '${task.id}'`),
    ],
  },
});

      if (!existing) {
        await Notification.create({
          userId: task.assigneeId,
          type: 'deadline_reminder',
          title,
          message: `Задача "${task.title}" — дедлайн ${isToday ? 'сегодня' : 'завтра'}`,
          link: `/tasks/${task.id}`,
          payload: { taskId: task.id },
        });

        if (task.assignee) {
          sendDeadlineReminder(task.assignee, task);
          notifyDeadlineReminder(task.assigneeId, task.title, task.deadline);
        }
      }
    }

    console.log(`[DeadlineChecker] Проверено ${tasks.length} задач`);
  } catch (err) {
    console.error('[DeadlineChecker] Ошибка:', err.message);
  }
};

// Запуск раз в час
const startDeadlineChecker = () => {
  // Первая проверка через 10 секунд после старта
  setTimeout(checkDeadlines, 10000);
  // Далее каждый час
  setInterval(checkDeadlines, 60 * 60 * 1000);
};

module.exports = { checkDeadlines, startDeadlineChecker };
