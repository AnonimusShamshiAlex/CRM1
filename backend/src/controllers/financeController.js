const { Op, fn, col, literal } = require('sequelize');
const { Invoice, Expense, Client, Project, sequelize } = require('../models');
const { sanitizeData } = require('../utils/sanitizer');

// СЧЕТА
const getInvoices = async (req, res) => {
  try {
    const { status, clientId, projectId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;

    const invoices = await Invoice.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'companyName'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createInvoice = async (req, res) => {
  try {
    // Генерация номера счёта
    const count = await Invoice.count();
    const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const data = sanitizeData(req.body);
    const invoice = await Invoice.create({ ...data, number });
    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Счёт не найден' });

    const data = sanitizeData(req.body);
    await invoice.update(data);

    // Авто-статус при полной оплате
    if (invoice.paidAmount >= invoice.total) {
      await invoice.update({ status: 'paid', paidAt: new Date() });
    } else if (invoice.paidAmount > 0) {
      await invoice.update({ status: 'partial' });
    }

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { amount, comment } = req.body;
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Счёт не найден' });

    const total = parseFloat(invoice.total);
    const currentPaid = parseFloat(invoice.paidAmount || 0);
    const newPaid = currentPaid + parseFloat(amount);
    
    // Статус оплаты: если оплачено >= сумма счёта → "paid"
    const newStatus = newPaid >= total - 0.01 ? 'paid' : 'partial';

    await invoice.update({
      paidAmount: newPaid,
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt,
    });

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// РАСХОДЫ
const getExpenses = async (req, res) => {
  try {
    const { category, projectId, dateFrom, dateTo } = req.query;
    const where = {};

    if (category) where.category = category;
    if (projectId) where.projectId = projectId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date[Op.gte] = dateFrom;
      if (dateTo) where.date[Op.lte] = dateTo;
    }

    const expenses = await Expense.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createExpense = async (req, res) => {
  try {
    const data = sanitizeData(req.body);
    const expense = await Expense.create(data);
    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ОТЧЁТЫ
const getReport = async (req, res) => {
  try {
    const { period, year, month } = req.query;
    let dateFrom, dateTo;
    const now = new Date();

    if (period === 'month') {
      const m = parseInt(month) || now.getMonth() + 1;
      const y = parseInt(year) || now.getFullYear();
      dateFrom = new Date(y, m - 1, 1);
      dateTo = new Date(y, m, 0);
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      dateFrom = new Date(now.getFullYear(), q * 3, 1);
      dateTo = new Date(now.getFullYear(), q * 3 + 3, 0);
    } else {
      const y = parseInt(year) || now.getFullYear();
      dateFrom = new Date(y, 0, 1);
      dateTo = new Date(y, 11, 31);
    }

    const fromStr = dateFrom.toISOString().split('T')[0];
    const toStr = dateTo.toISOString().split('T')[0];

    // Выручка (оплаченные счета)
    const revenueResult = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['paid', 'partial'] },
        paidAt: { [Op.between]: [fromStr, toStr] },
      },
      attributes: [
        [fn('SUM', col('paid_amount')), 'total'],
      ],
      raw: true,
    });

    // Расходы по категориям
    const expensesByCategory = await Expense.findAll({
      where: { date: { [Op.between]: [fromStr, toStr] } },
      attributes: [
        'category',
        [fn('SUM', col('amount')), 'total'],
      ],
      group: ['category'],
      raw: true,
    });

    // Дебиторка
    const receivables = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['sent', 'partial', 'overdue'] },
      },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
      ],
      attributes: ['id', 'number', 'total', 'paidAmount', 'dueDate', 'status'],
    });

    const revenue = parseFloat(revenueResult[0]?.total || 0);
    const totalExpenses = expensesByCategory.reduce(
      (sum, e) => sum + parseFloat(e.total), 0
    );

    res.json({
      period: { from: fromStr, to: toStr },
      revenue,
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      profit: revenue - totalExpenses,
      receivables,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  recordPayment,
  getExpenses,
  createExpense,
  getReport,
};