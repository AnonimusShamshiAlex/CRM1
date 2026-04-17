// controllers/metricsController.js
// ТЗ: Сквозная аналитика — UTM-трекинг, ROI/ROMI, метрики проекта

const { Project, Client, Invoice, Expense, WorkLog, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * GET /api/projects/:id/metrics
 * Метрики рекламной кампании по проекту
 */
const getProjectMetrics = async (req, res) => {
  const project = await Project.findByPk(req.params.id, {
    attributes: ['id', 'name', 'metrics', 'stage'],
  });
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  // Считаем реальные данные из БД
  const [leadsCount, paidInvoices, expenses] = await Promise.all([
    Client.count({ where: { projectId: project.id } }),
    Invoice.sum('amount', {
      where: { projectId: project.id, status: 'paid' },
    }),
    Expense.sum('amount', {
      where: { projectId: project.id },
    }),
  ]);

  const revenue = paidInvoices || 0;
  const adBudget = project.metrics?.budget || 0;
  const totalExpenses = (expenses || 0) + adBudget;

  // ROI = (доход - расходы) / расходы * 100
  const roi = totalExpenses > 0
    ? Math.round(((revenue - totalExpenses) / totalExpenses) * 100)
    : 0;

  // CPL = бюджет / кол-во лидов
  const cpl = leadsCount > 0 ? Math.round(adBudget / leadsCount) : 0;

  // ROMI = (доход - рекламный бюджет) / рекламный бюджет * 100
  const romi = adBudget > 0
    ? Math.round(((revenue - adBudget) / adBudget) * 100)
    : 0;

  const stored = project.metrics || {};

  res.json({
    // Из БД (автоматически)
    leadsFromDb: leadsCount,
    revenueFromDb: revenue,
    expensesFromDb: expenses || 0,
    roiCalculated: roi,
    cplCalculated: cpl,
    romiCalculated: romi,

    // Вручную введённые маркетологом
    leads: stored.leads || leadsCount,
    cpl: stored.cpl || cpl,
    budget: stored.budget || 0,
    ctr: stored.ctr || 0,
    roi: stored.roi || roi,
    romi: stored.romi || romi,
    stage: project.stage || 0,
  });
};

/**
 * PUT /api/projects/:id/metrics
 * Сохранить метрики вручную (маркетолог)
 */
const updateProjectMetrics = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  const { leads, cpl, budget, ctr, roi, romi, stage } = req.body;

  const updatedMetrics = {
    ...(project.metrics || {}),
    ...(leads !== undefined && { leads: Number(leads) }),
    ...(cpl !== undefined && { cpl: Number(cpl) }),
    ...(budget !== undefined && { budget: Number(budget) }),
    ...(ctr !== undefined && { ctr: Number(ctr) }),
    ...(roi !== undefined && { roi: Number(roi) }),
    ...(romi !== undefined && { romi: Number(romi) }),
    updatedAt: new Date().toISOString(),
  };

  await project.update({
    metrics: updatedMetrics,
    ...(stage !== undefined && { stage: Number(stage) }),
  });

  res.json({ ...updatedMetrics, stage: project.stage });
};

/**
 * GET /api/projects/:id/worklogs
 * Лог выполненных работ маркетолога
 */
const getWorkLogs = async (req, res) => {
  const logs = await WorkLog.findAll({
    where: { projectId: req.params.id },
    include: [{ model: require('../models').User, as: 'author', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  res.json(logs);
};

/**
 * POST /api/projects/:id/worklogs
 */
const addWorkLog = async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Текст записи обязателен' });

  const log = await WorkLog.create({
    projectId: Number(req.params.id),
    authorId: req.user.id,
    text: text.trim(),
  });

  const withAuthor = await WorkLog.findByPk(log.id, {
    include: [{ model: require('../models').User, as: 'author', attributes: ['id', 'name'] }],
  });

  res.status(201).json(withAuthor);
};

/**
 * POST /api/clients/:id/utm
 * Сохранить UTM-метки лида
 * ТЗ: Трекинг источников — UTM-метки, рефереры, ClientID
 */
const saveClientUtm = async (req, res) => {
  const { utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, clientId: adClientId } = req.body;

  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });

  const utmData = {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    referrer,
    clientId: adClientId,
    savedAt: new Date().toISOString(),
  };

  await client.update({ utmData });
  res.json({ message: 'UTM-данные сохранены', utmData });
};

/**
 * GET /api/analytics/utm
 * Сводная аналитика по источникам трафика
 */
const getUtmAnalytics = async (req, res) => {
  const { projectId, dateFrom, dateTo } = req.query;

  const where = {};
  if (projectId) where.projectId = projectId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
  }

  // Получаем всех клиентов с UTM
  const clients = await Client.findAll({
    where: { ...where, utmData: { [Op.ne]: null } },
    attributes: ['id', 'utmData', 'status', 'projectId'],
  });

  // Группируем по источникам
  const bySource = {};
  clients.forEach((c) => {
    const src = c.utmData?.utm_source || 'Прямой';
    if (!bySource[src]) bySource[src] = { source: src, leads: 0, won: 0 };
    bySource[src].leads++;
    if (c.status === 'active') bySource[src].won++;
  });

  const sources = Object.values(bySource).sort((a, b) => b.leads - a.leads);

  res.json({
    totalLeads: clients.length,
    sources,
    topSource: sources[0]?.source || '—',
  });
};

/**
 * GET /api/analytics/romi-calculator
 * Встроенный калькулятор ROMI в разрезе клиента
 */
const getRomiByClient = async (req, res) => {
  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ message: 'clientId обязателен' });

  const [invoices, expenses] = await Promise.all([
    Invoice.findAll({ where: { clientId, status: 'paid' }, attributes: ['amount'] }),
    Expense.findAll({ where: { clientId }, attributes: ['amount'] }),
  ]);

  const revenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const costs = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = revenue - costs;
  const romi = costs > 0 ? Math.round((profit / costs) * 100) : 0;
  const roi = costs > 0 ? Math.round(((revenue - costs) / costs) * 100) : 0;

  res.json({
    clientId: Number(clientId),
    revenue,
    costs,
    profit,
    roi,
    romi,
    invoicesCount: invoices.length,
  });
};

module.exports = {
  getProjectMetrics,
  updateProjectMetrics,
  getWorkLogs,
  addWorkLog,
  saveClientUtm,
  getUtmAnalytics,
  getRomiByClient,
};
