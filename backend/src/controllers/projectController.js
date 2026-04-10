const { Op } = require('sequelize');
const { Project, User, Client, Task, ProjectMember } = require('../models');
const { sanitizeData } = require('../utils/sanitizer');

const getProjects = async (req, res) => {
  try {
    const { status, clientId, managerId, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (managerId) where.managerId = managerId;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const projects = await Project.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'companyName'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'manager', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar', 'position'] },
        {
          model: Task,
          as: 'tasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
          ],
          where: { parentId: null },
          required: false,
        },
      ],
    });

    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createProject = async (req, res) => {
  try {
    const { memberIds, ...rawData } = req.body;
    const data = sanitizeData(rawData);
    
    const project = await Project.create({
      ...data,
      managerId: data.managerId || req.user.id,
    });

    if (memberIds && memberIds.length > 0) {
      await project.setMembers(memberIds);
    }

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });

    const { memberIds, ...rawData } = req.body;
    const data = sanitizeData(rawData);
    await project.update(data);

    if (memberIds) {
      await project.setMembers(memberIds);
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });

    await project.update({ status: 'archived' });
    res.json({ message: 'Проект архивирован' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};