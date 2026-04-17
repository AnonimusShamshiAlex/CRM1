// controllers/financeController.js
const { Op, fn, col, literal } = require('sequelize');
const { Invoice, Expense, Client, Project, User } = require('../models');
const { triggerWebhooks } = require('./webhookController');

// ── INVOICES ──────────────────────────────────────────

const getInvoices = async (req, res) => {
  const { page = 1, limit = 20, status, clientId, projectId } = req.query;
  const where = {};
  if (status)    where.status    = status;
  if (clientId)  where.clientId  = clientId;
  if (projectId) where.projectId = projectId;

  const { count, rows } = await Invoice.findAndCountAll({
    where,
    include: [
      { model: Client,  as: 'client',  attributes: ['id','name'] },
      { model: Project, as: 'project', attributes: ['id','name'] },
    ],
    order: [['createdAt','DESC']],
    limit: Number(limit),
    offset: (Number(page)-1)*Number(limit),
  });
  res.json({ invoices: rows, total: count });
};

const createInvoice = async (req, res) => {
  const { items = [], amount } = req.body;
  const vat = req.body.vat ?? 12;
  const base = Number(amount) || items.reduce((s,i) => s + Number(i.price||0)*Number(i.qty||1), 0);
  const total = base * (1 + vat/100);

  const num = `INV-${Date.now().toString().slice(-6)}`;
  const invoice = await Invoice.create({
    ...req.body,
    number: req.body.number || num,
    amount: base,
    vat,
    total,
    createdBy: req.user.id,
  });
  res.status(201).json(invoice);
};

const updateInvoice = async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Счёт не найден' });

  const wasPaid = invoice.status === 'paid';
  await invoice.update(req.body);

  // Webhook при оплате
  if (!wasPaid && req.body.status === 'paid') {
    await invoice.update({ paidAt: new Date() });
    await triggerWebhooks('invoice.paid', {
      id: invoice.id, number: invoice.number, amount: invoice.total,
    });
  }
  res.json(invoice);
};

const deleteInvoice = async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Счёт не найден' });
  await invoice.destroy();
  res.json({ message: 'Счёт удалён' });
};

// ── EXPENSES ──────────────────────────────────────────

const getExpenses = async (req, res) => {
  const { page=1, limit=20, category, projectId } = req.query;
  const where = {};
  if (category)  where.category  = category;
  if (projectId) where.projectId = projectId;

  const { count, rows } = await Expense.findAndCountAll({
    where,
    include: [{ model: Project, as: 'project', attributes: ['id','name'] }],
    order: [['date','DESC']],
    limit: Number(limit),
    offset: (Number(page)-1)*Number(limit),
  });
  res.json({ expenses: rows, total: count });
};

const createExpense = async (req, res) => {
  const expense = await Expense.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json(expense);
};

const updateExpense = async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Расход не найден' });
  await expense.update(req.body);
  res.json(expense);
};

const deleteExpense = async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Расход не найден' });
  await expense.destroy();
  res.json({ message: 'Расход удалён' });
};

// ── FINANCIAL REPORT ─────────────────────────────────

const getReport = async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const where = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo)   where.createdAt[Op.lte] = new Date(dateTo);
  }

  const [revenue, expenses, pending] = await Promise.all([
    Invoice.sum('total',  { where: { ...where, status: 'paid' } }),
    Expense.sum('amount', { where }),
    Invoice.sum('total',  { where: { ...where, status: ['draft','sent'] } }),
  ]);

  const profit = (revenue||0) - (expenses||0);

  res.json({
    revenue:  revenue  || 0,
    expenses: expenses || 0,
    profit,
    pending:  pending  || 0,
    margin: revenue ? Math.round((profit/(revenue||1))*100) : 0,
  });
};

module.exports = {
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getReport,
};
