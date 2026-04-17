// controllers/searchController.js
// ТЗ: Глобальный поиск по всем сущностям (лиды, контакты, задачи, документы)

const { Op } = require('sequelize');
const { Client, Project, Task, User } = require('../models');

/**
 * GET /api/search?q=текст
 * Возвращает результаты по всем сущностям
 */
const globalSearch = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ message: 'Минимум 2 символа для поиска' });
  }

  const query = q.trim();
  const userId = req.user.id;
  const role = req.user.role;
  const projectId = req.user.projectId;

  const like = { [Op.iLike]: `%${query}%` };

  // Базовый where для клиентов
  const clientWhere = {
    [Op.or]: [
      { name: like },
      { email: like },
      { phone: like },
      { company: like },
    ],
  };

  // Менеджер видит только свой проект
  if (role === 'manager' && projectId) {
    clientWhere.projectId = projectId;
  }

  // Базовый where для задач
  const taskWhere = {
    [Op.or]: [
      { title: like },
      { description: like },
    ],
  };

  if (role === 'manager' && projectId) {
    taskWhere.projectId = projectId;
  }

  const projectWhere = {
    [Op.or]: [
      { name: like },
      { description: like },
    ],
  };

  // Маркетолог и менеджер видят только свои проекты
  if (['manager', 'marketer'].includes(role) && projectId) {
    projectWhere.id = projectId;
  }

  const LIMIT = 8;

  const [clients, projects, tasks] = await Promise.all([
    Client.findAll({
      where: clientWhere,
      limit: LIMIT,
      attributes: ['id', 'name', 'email', 'phone', 'company', 'status'],
      order: [['updatedAt', 'DESC']],
    }),

    Project.findAll({
      where: projectWhere,
      limit: LIMIT,
      attributes: ['id', 'name', 'status', 'stage'],
      order: [['updatedAt', 'DESC']],
    }),

    Task.findAll({
      where: taskWhere,
      limit: LIMIT,
      attributes: ['id', 'title', 'status', 'priority', 'projectId'],
      include: [{ model: Project, as: 'project', attributes: ['name'] }],
      order: [['updatedAt', 'DESC']],
    }),
  ]);

  // Нормализуем для фронтенда
  const formatClients = clients.map((c) => ({
    id: c.id,
    name: c.name,
    subtitle: [c.company, c.email, c.phone].filter(Boolean).join(' · '),
  }));

  const formatProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.status,
  }));

  const formatTasks = tasks.map((t) => ({
    id: t.id,
    name: t.title,
    subtitle: t.project?.name || '',
  }));

  res.json({
    clients: formatClients,
    projects: formatProjects,
    tasks: formatTasks,
  });
};

module.exports = { globalSearch };
