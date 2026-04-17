// controllers/clientController.js
const { Op } = require('sequelize');
const { Client, Project, Pipeline, PipelineStage, User, Interaction } = require('../models');
const { triggerWebhooks } = require('./webhookController');

const getClients = async (req, res) => {
  const { page = 1, limit = 20, search, status, projectId, pipelineId } = req.query;
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (pipelineId) where.pipelineId = pipelineId;

  const { count, rows } = await Client.findAndCountAll({
    where,
    include: [
      { model: Project,       as: 'project',       attributes: ['id', 'name'] },
      { model: Pipeline,      as: 'pipeline',      attributes: ['id', 'name'] },
      { model: PipelineStage, as: 'pipelineStage', attributes: ['id', 'name', 'color'] },
      { model: User,          as: 'assignee',      attributes: ['id', 'name'] },
    ],
    order: [['updatedAt', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({ clients: rows, total: count, page: Number(page) });
};

const getClient = async (req, res) => {
  const client = await Client.findByPk(req.params.id, {
    include: [
      { model: Project,       as: 'project' },
      { model: Pipeline,      as: 'pipeline' },
      { model: PipelineStage, as: 'pipelineStage' },
      { model: User,          as: 'assignee', attributes: ['id', 'name', 'position'] },
    ],
  });
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });
  res.json(client);
};

const createClient = async (req, res) => {
  // Проверка дублей по email и телефону
  if (req.body.email || req.body.phone) {
    const dup = await Client.findOne({
      where: {
        [Op.or]: [
          req.body.email ? { email: req.body.email } : null,
          req.body.phone ? { phone: req.body.phone } : null,
        ].filter(Boolean),
      },
    });
    if (dup) {
      return res.status(409).json({
        message: `Клиент с таким ${dup.email === req.body.email ? 'email' : 'телефоном'} уже существует`,
        existingId: dup.id,
      });
    }
  }

  const client = await Client.create(req.body);

  // Webhook: новый лид
  await triggerWebhooks('client.created', {
    id: client.id, name: client.name, email: client.email, phone: client.phone,
  });

  res.status(201).json(client);
};

const updateClient = async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });

  const oldStatus = client.status;
  await client.update(req.body);

  // Webhook: смена статуса
  if (req.body.status && req.body.status !== oldStatus) {
    await triggerWebhooks('client.status_changed', {
      id: client.id, name: client.name,
      oldStatus, newStatus: req.body.status,
    });
    // Webhook: сделка выиграна/проиграна
    if (req.body.status === 'active') await triggerWebhooks('deal.won', { id: client.id, name: client.name });
    if (req.body.status === 'lost')   await triggerWebhooks('deal.lost', { id: client.id, name: client.name });
  }

  // Обновляем lastInteractionAt
  await client.update({ lastInteractionAt: new Date() });

  res.json(client);
};

const deleteClient = async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });
  await client.destroy();
  res.json({ message: 'Клиент удалён' });
};

// Взаимодействия
const getInteractions = async (req, res) => {
  const list = await Interaction.findAll({
    where: { clientId: req.params.id },
    include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(list);
};

const addInteraction = async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });

  const interaction = await Interaction.create({
    ...req.body,
    clientId: Number(req.params.id),
    authorId: req.user.id,
  });

  // Обновляем дату последнего взаимодействия — используется в Lead Scoring
  await client.update({ lastInteractionAt: new Date() });

  res.status(201).json(interaction);
};

// Импорт — предпросмотр файла
const importPreview = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  let rows = [], columns = [];

  try {
    if (ext === 'csv') {
      const csv = require('fs').readFileSync(req.file.path, 'utf-8');
      const lines = csv.split('\n').filter(Boolean);
      columns = lines[0].split(',').map((c) => c.trim().replace(/"/g, ''));
      rows = lines.slice(1, 6).map((line) => {
        const vals = line.split(',').map((v) => v.trim().replace(/"/g, ''));
        const obj = {};
        columns.forEach((col, i) => { obj[col] = vals[i] || ''; });
        return obj;
      });
    } else {
      const xlsx = require('xlsx');
      const wb = xlsx.readFile(req.file.path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
      columns = (data[0] || []).map(String);
      rows = data.slice(1, 6).map((row) => {
        const obj = {};
        columns.forEach((col, i) => { obj[col] = row[i] !== undefined ? String(row[i]) : ''; });
        return obj;
      });
    }

    // Считаем дубли
    const allRows = rows;
    let duplicates = 0;
    for (const row of allRows) {
      if (row.email || row.phone) {
        const dup = await Client.findOne({
          where: {
            [Op.or]: [
              row.email ? { email: row.email } : null,
              row.phone ? { phone: String(row.phone) } : null,
            ].filter(Boolean),
          },
        });
        if (dup) duplicates++;
      }
    }

    res.json({ columns, rows, totalRows: rows.length, duplicates });
  } catch (e) {
    res.status(400).json({ message: 'Ошибка чтения файла: ' + e.message });
  }
};

// Импорт — реальный
const importClients = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

  const columnMap = JSON.parse(req.body.columnMap || '{}');
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  let allRows = [];

  try {
    if (ext === 'csv') {
      const csv = require('fs').readFileSync(req.file.path, 'utf-8');
      const lines = csv.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map((c) => c.trim().replace(/"/g, ''));
      allRows = lines.slice(1).map((line) => {
        const vals = line.split(',').map((v) => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((col, i) => { obj[col] = vals[i] || ''; });
        return obj;
      });
    } else {
      const xlsx = require('xlsx');
      const wb = xlsx.readFile(req.file.path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
      const headers = (data[0] || []).map(String);
      allRows = data.slice(1).map((row) => {
        const obj = {};
        headers.forEach((col, i) => { obj[col] = row[i] !== undefined ? String(row[i]) : ''; });
        return obj;
      });
    }

    let imported = 0, skipped = 0, errors = 0;

    for (const row of allRows) {
      try {
        const name  = row[columnMap.name]  || '';
        const email = row[columnMap.email] || null;
        const phone = row[columnMap.phone] ? String(row[columnMap.phone]) : null;
        if (!name) { errors++; continue; }

        // Проверка дублей
        if (email || phone) {
          const dup = await Client.findOne({
            where: {
              [Op.or]: [
                email ? { email } : null,
                phone ? { phone } : null,
              ].filter(Boolean),
            },
          });
          if (dup) { skipped++; continue; }
        }

        await Client.create({
          name,
          email,
          phone,
          company:   row[columnMap.company]   || null,
          status:    row[columnMap.status]     || 'lead',
          projectId: row[columnMap.projectId]  || null,
        });
        imported++;
      } catch (e) {
        errors++;
      }
    }

    res.json({ imported, skipped, errors, total: allRows.length });
  } catch (e) {
    res.status(400).json({ message: 'Ошибка импорта: ' + e.message });
  } finally {
    require('fs').unlinkSync(req.file.path);
  }
};

// Распределение лидов по менеджерам — ТЗ: «в один клик»
const distributeLeads = async (req, res) => {
  const { assignments } = req.body;
  if (!assignments?.length) return res.status(400).json({ message: 'assignments обязателен' });

  let updated = 0;
  for (const { clientId, managerId } of assignments) {
    await Client.update({ assignedTo: managerId }, { where: { id: clientId } });
    updated++;
  }

  res.json({ message: `Назначено ${updated} лидов`, updated });
};

module.exports = {
  getClients, getClient, createClient, updateClient, deleteClient,
  getInteractions, addInteraction,
  importPreview, importClients, distributeLeads,
};
