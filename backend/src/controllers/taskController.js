// controllers/taskController.js
const { Op } = require('sequelize');
const { Task, User, Project, Client, TimeLog, Notification } = require('../models');
const { triggerWebhooks } = require('./webhookController');

const getTasks = async (req, res) => {
  const { page = 1, limit = 50, status, priority, assigneeId, projectId, deadline, search } = req.query;
  const where = {};

  if (status)     where.status     = status;
  if (priority)   where.priority   = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (projectId)  where.projectId  = projectId;
  if (search)     where.title = { [Op.iLike]: `%${search}%` };

  // ТЗ: горящие задачи — дедлайн сегодня
  if (deadline === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.deadline = { [Op.between]: [today, tomorrow] };
    where.status   = { [Op.ne]: 'done' };
  }

  // ТЗ: Приватность задач — менеджер видит только свой проект
  if (req.scopedProjectId) where.projectId = req.scopedProjectId;

  const { count, rows } = await Task.findAndCountAll({
    where,
    include: [
      { model: User,    as: 'assignee', attributes: ['id', 'name'] },
      { model: Project, as: 'project',  attributes: ['id', 'name'] },
      { model: Client,  as: 'client',   attributes: ['id', 'name'] },
    ],
    order: [['deadline', 'ASC NULLS LAST'], ['priority', 'DESC'], ['createdAt', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({ tasks: rows, total: count });
};

const getTask = async (req, res) => {
  const task = await Task.findByPk(req.params.id, {
    include: [
      { model: User,    as: 'assignee', attributes: ['id', 'name', 'position'] },
      { model: User,    as: 'creator',  attributes: ['id', 'name'] },
      { model: Project, as: 'project',  attributes: ['id', 'name'] },
      { model: Client,  as: 'client',   attributes: ['id', 'name'] },
      { model: TimeLog, as: 'timeLogs',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
    ],
  });
  if (!task) return res.status(404).json({ message: 'Задача не найдена' });
  res.json(task);
};

const createTask = async (req, res) => {
  const task = await Task.create({ ...req.body, createdBy: req.user.id });

  // Уведомление исполнителю
  if (task.assigneeId && task.assigneeId !== req.user.id) {
    await Notification.create({
      userId: task.assigneeId,
      title:  'Новая задача',
      body:   `Вам назначена задача: «${task.title}»`,
      type:   'task',
      link:   `/tasks/${task.id}`,
    });
  }

  await triggerWebhooks('task.created', { id: task.id, title: task.title });
  res.status(201).json(task);
};

const updateTask = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Задача не найдена' });

  const wasDone = task.status === 'done';
  await task.update(req.body);

  // Webhook при завершении
  if (!wasDone && req.body.status === 'done') {
    await triggerWebhooks('task.done', { id: task.id, title: task.title });
  }

  res.json(task);
};

const deleteTask = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Задача не найдена' });
  await task.destroy();
  res.json({ message: 'Задача удалена' });
};

// ТЗ: Time-tracking — старт таймера
const startTimer = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Задача не найдена' });
  if (task.timerStartedAt) return res.status(400).json({ message: 'Таймер уже запущен' });

  await task.update({ timerStartedAt: new Date(), status: 'in_progress' });

  await TimeLog.create({
    taskId:    task.id,
    userId:    req.user.id,
    startedAt: new Date(),
  });

  res.json({ message: 'Таймер запущен', startedAt: task.timerStartedAt });
};

// ТЗ: Time-tracking — стоп таймера
const stopTimer = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Задача не найдена' });
  if (!task.timerStartedAt) return res.status(400).json({ message: 'Таймер не запущен' });

  const now = new Date();
  const seconds = Math.round((now - new Date(task.timerStartedAt)) / 1000);
  const total = (task.timeSpent || 0) + seconds;

  await task.update({ timerStartedAt: null, timeSpent: total });

  // Обновляем лог
  const log = await TimeLog.findOne({
    where: { taskId: task.id, userId: req.user.id, stoppedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (log) {
    await log.update({ stoppedAt: now, duration: seconds });
  }

  res.json({
    message: 'Таймер остановлен',
    sessionSeconds: seconds,
    totalSeconds: total,
    totalFormatted: formatDuration(total),
  });
};

const formatDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, startTimer, stopTimer };
