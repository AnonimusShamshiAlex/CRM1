const { Op } = require('sequelize');
const { Client, User, Interaction, Pipeline, PipelineStage } = require('../models');
const { sanitizeData } = require('../utils/sanitizer');

// GET /api/clients
const getClients = async (req, res) => {
  try {
    const {
      search,
      stage,
      type,
      managerId,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (stage) where.stage = stage;
    if (type) where.type = type;
    if (managerId) where.managerId = managerId;
    if (req.query.pipelineId) where.pipelineId = req.query.pipelineId;

    // Менеджер видит только своих клиентов (и только из назначенных воронок)
    const managerRoles = ['manager'];
    if (managerRoles.includes(req.user.role)) {
      where.managerId = req.user.id;
      // Если у менеджера есть назначенные воронки и фильтр воронки не задан — показываем только из его воронок
      if (!req.query.pipelineId && req.user.assignedPipelineIds?.length > 0) {
        where.pipelineId = { [Op.in]: req.user.assignedPipelineIds };
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Client.findAndCountAll({
      where,
      include: [
        { model: User, as: 'manager', attributes: ['id', 'name', 'avatar'] },
        { model: Pipeline, as: 'pipeline', attributes: ['id', 'name'] },
        { model: PipelineStage, as: 'pipelineStage', attributes: ['id', 'name', 'color'] },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      clients: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// GET /api/clients/:id
const getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [
        { model: User, as: 'manager', attributes: ['id', 'name', 'avatar'] },
        { model: Pipeline, as: 'pipeline', attributes: ['id', 'name'] },
        { model: PipelineStage, as: 'pipelineStage', attributes: ['id', 'name', 'color'] },
        {
          model: Interaction,
          as: 'interactions',
          include: [
            { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
          ],
          order: [['date', 'DESC']],
        },
      ],
    });

    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// POST /api/clients
const createClient = async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Проверка дубликатов
    const duplicates = [];
    if (email) {
      const byEmail = await Client.findOne({ where: { email } });
      if (byEmail) duplicates.push({ field: 'email', client: byEmail });
    }
    if (phone) {
      const byPhone = await Client.findOne({ where: { phone } });
      if (byPhone) duplicates.push({ field: 'phone', client: byPhone });
    }

    if (duplicates.length > 0 && !req.body.forceSave) {
      return res.status(409).json({
        warning: 'Возможный дубликат',
        duplicates,
      });
    }

    const data = sanitizeData(req.body);
    const client = await Client.create({
      ...data,
      managerId: data.managerId || req.user.id,
    });

    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// PUT /api/clients/:id
const updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });

    const data = sanitizeData(req.body);
    await client.update(data);
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// PATCH /api/clients/:id/stage
const updateStage = async (req, res) => {
  try {
    const { stage, stageOrder } = req.body;
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });

    await client.update({ stage, stageOrder });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// DELETE /api/clients/:id
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });

    await client.destroy();
    res.json({ message: 'Клиент удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// POST /api/clients/:id/interactions
const addInteraction = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });

    const interaction = await Interaction.create({
      ...req.body,
      clientId: req.params.id,
      authorId: req.user.id,
    });

    const full = await Interaction.findByPk(interaction.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }],
    });

    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  updateStage,
  deleteClient,
  addInteraction,
};