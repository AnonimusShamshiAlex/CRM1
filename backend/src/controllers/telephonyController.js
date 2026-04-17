// controllers/telephonyController.js
const { Interaction, Client, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/telephony/calls
const getCalls = async (req, res) => {
  const { page=1, limit=20, managerId } = req.query;
  const where = { type: 'call' };
  if (managerId) where.authorId = managerId;

  const { count, rows } = await Interaction.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client',  attributes: ['id','name','phone'] },
      { model: User,   as: 'author',  attributes: ['id','name'] },
    ],
    order: [['createdAt','DESC']],
    limit: Number(limit),
    offset: (Number(page)-1)*Number(limit),
  });
  res.json({ calls: rows, total: count });
};

// POST /api/telephony/webhook — входящий звонок от IP-телефонии
const handleWebhook = async (req, res) => {
  const { phone, duration, recordingUrl, managerId, outcome } = req.body;
  if (!phone) return res.status(400).json({ message: 'phone обязателен' });

  // Ищем клиента по телефону
  const client = await Client.findOne({ where: { phone } });

  await Interaction.create({
    clientId:    client?.id || null,
    authorId:    managerId  || null,
    type:        'call',
    duration:    duration   || 0,
    recordingUrl: recordingUrl || null,
    outcome:     outcome    || null,
    content:     `Звонок ${phone}${outcome ? ' — ' + outcome : ''}`,
  });

  // Обновляем lastInteractionAt
  if (client) {
    await client.update({ lastInteractionAt: new Date() });
  }

  res.json({ message: 'ok' });
};

// GET /api/telephony/stats — аналитика менеджеров по звонкам
const getManagerStats = async (req, res) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const managers = await User.findAll({
    where: { role: { [Op.in]: ['manager','rop'] }, status: 'active' },
    attributes: ['id','name'],
  });

  const stats = await Promise.all(managers.map(async (mgr) => {
    const calls = await Interaction.findAll({
      where: { authorId: mgr.id, type: 'call', createdAt: { [Op.gte]: start } },
      attributes: ['duration','outcome'],
    });
    const total    = calls.length;
    const avgDur   = total ? Math.round(calls.reduce((s,c) => s + (c.duration||0), 0) / total) : 0;
    const positive = calls.filter((c) => c.outcome === 'positive').length;
    return { managerId: mgr.id, name: mgr.name, total, avgDuration: avgDur, positive };
  }));

  res.json(stats);
};

module.exports = { getCalls, handleWebhook, getManagerStats };
