const { Op } = require('sequelize');
const { Task, User, Project, TimeLog, Notification } = require('../models');
const { sendTaskAssigned, sendTaskStatusChanged } = require('../services/emailService');
const { notifyTaskAssigned, notifyTaskStatusChanged } = require('../services/telegramBot');
const { sanitizeData } = require('../utils/sanitizer');

const getTasks = async (req, res) => {
  try {
    const { projectId, assigneeId, status, priority } = req.query;
    const where = { parentId: null };

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (assigneeId) {
      where.assigneeId = assigneeId;
    } else if (req.user.role === 'executor') {
      where.assigneeId = req.user.id;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        {
          model: Task,
          as: 'subtasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
          ],
        },
      ],
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        {
          model: Task,
          as: 'subtasks',
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] }],
        },
        {
          model: TimeLog,
          as: 'timeLogs',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        },
      ],
    });

    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createTask = async (req, res) => {
  try {
    const data = sanitizeData(req.body);
    const task = await Task.create({
      ...data,
      createdById: req.user.id,
    });

    // Уведомление исполнителю (in-app + email)
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      const assignee = await User.findByPk(task.assigneeId);
      await Notification.create({
        userId: task.assigneeId,
        type: 'task_assigned',
        title: 'Новая задача',
        message: `Вам назначена задача: ${task.title}`,
        link: `/tasks/${task.id}`,
        payload: { taskId: task.id },
      });
      if (assignee) sendTaskAssigned(assignee, task);
      notifyTaskAssigned(task.assigneeId, task.title, req.user.name || 'Менеджер');
    }

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    const oldStatus = task.status;
    const oldAssigneeId = task.assigneeId;

    const data = sanitizeData(req.body);
    await task.update(data);

    // Уведомление при смене статуса (in-app + email)
    if (req.body.status && req.body.status !== oldStatus && task.assigneeId) {
      const assignee = await User.findByPk(task.assigneeId);
      await Notification.create({
        userId: task.assigneeId,
        type: 'task_status_changed',
        title: 'Статус задачи изменён',
        message: `Задача "${task.title}" изменила статус`,
        link: `/tasks/${task.id}`,
        payload: { taskId: task.id, newStatus: req.body.status },
      });
      if (assignee) sendTaskStatusChanged(assignee, task, req.body.status);
      notifyTaskStatusChanged(task.assigneeId, task.title, oldStatus, req.body.status);
    }

    // Уведомление при переназначении (in-app + email + telegram)
    if (req.body.assigneeId && req.body.assigneeId !== oldAssigneeId) {
      const newAssignee = await User.findByPk(req.body.assigneeId);
      await Notification.create({
        userId: req.body.assigneeId,
        type: 'task_assigned',
        title: 'Новая задача',
        message: `Вам назначена задача: ${task.title}`,
        link: `/tasks/${task.id}`,
        payload: { taskId: task.id },
      });
      if (newAssignee) sendTaskAssigned(newAssignee, task);
      notifyTaskAssigned(req.body.assigneeId, task.title, req.user.name || 'Менеджер');
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    await task.destroy();
    res.json({ message: 'Задача удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Трекер времени
const startTimer = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    if (task.timerStartedAt) {
      return res.status(400).json({ error: 'Таймер уже запущен' });
    }

    await task.update({ 
      timerStartedAt: new Date(),
      status: 'in_progress'
    });
    res.json({ timerStartedAt: task.timerStartedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const stopTimer = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    if (!task.timerStartedAt) {
      return res.status(400).json({ error: 'Таймер не запущен' });
    }

    const now = new Date();
    const seconds = Math.floor((now - new Date(task.timerStartedAt)) / 1000);

    await TimeLog.create({
      taskId: task.id,
      userId: req.user.id,
      seconds,
      startedAt: task.timerStartedAt,
      endedAt: now,
    });

    await task.update({
      trackedSeconds: task.trackedSeconds + seconds,
      timerStartedAt: null,
      status: 'on_pause'
    });

    res.json({ seconds, totalTrackedSeconds: task.trackedSeconds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const addTimeManually = async (req, res) => {
  try {
    const { hours, comment } = req.body;
    const seconds = Math.round(hours * 3600);

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    await TimeLog.create({
      taskId: task.id,
      userId: req.user.id,
      seconds,
      comment,
    });

    await task.update({ trackedSeconds: task.trackedSeconds + seconds });

    res.json({ message: 'Время добавлено', seconds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  startTimer,
  stopTimer,
  addTimeManually,
};