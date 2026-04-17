// controllers/dashboardController.js
const { Op, fn, col, literal } = require('sequelize');
const { Client, Project, Task, Invoice, Expense, User } = require('../models');

const getStats = async (req, res) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth()+1, 0);

  const [
    activeDeals, newLeads, closedDeals,
    invoiced, paid, overdueTasks,
    totalPaid, totalClients, totalExpenses,
  ] = await Promise.all([
    Client.count({ where: { status: 'active' } }),
    Client.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
    Client.count({ where: { status: 'active', updatedAt: { [Op.between]: [start, end] } } }),
    Invoice.sum('total', { where: { status: { [Op.in]:['draft','sent'] }, createdAt: { [Op.between]: [start, end] } } }),
    Invoice.sum('total', { where: { status: 'paid', createdAt: { [Op.between]: [start, end] } } }),
    Task.count({ where: { deadline: { [Op.lt]: now }, status: { [Op.ne]: 'done' } } }),
    Invoice.sum('total', { where: { status: 'paid' } }),
    Client.count({ where: { status: 'active' } }),
    Expense.sum('amount'),
  ]);

  // LTV = суммарная выручка / кол-во активных клиентов
  const ltv = totalClients > 0 ? Math.round((totalPaid||0) / totalClients) : 0;

  // CAC = суммарные расходы / кол-во новых клиентов этого месяца
  const cac = newLeads > 0 ? Math.round((totalExpenses||0) / newLeads) : 0;

  // Прогноз выручки = оплачено + ожидает оплаты (50% конверсия)
  const revenueforecast = Math.round((paid||0) + (invoiced||0) * 0.5);

  res.json({
    activeDeals,
    newLeads,
    closedDeals,
    invoiced:        invoiced        || 0,
    paid:            paid            || 0,
    overdueTasks,
    ltv,
    cac,
    revenueforecast,
    ltvTrend:     5,
    cacTrend:     -3,
    dealsTrend:   12,
    revenueTrend: 8,
  });
};

const getManagerStats = async (req, res) => {
  const userId = req.user.id;
  const now    = new Date();
  const start  = new Date(now.getFullYear(), now.getMonth(), 1);

  const [myTasks, myClients, myDeals] = await Promise.all([
    Task.count({ where: { assigneeId: userId, status: { [Op.ne]:'done' } } }),
    Client.count({ where: { assignedTo: userId } }),
    Client.count({ where: { assignedTo: userId, status: 'active', updatedAt: { [Op.gte]: start } } }),
  ]);

  res.json({ myTasks, myClients, myDeals });
};

const getManagersRating = async (req, res) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const managers = await User.findAll({
    where: { role: { [Op.in]: ['manager', 'rop'] }, status: 'active' },
    attributes: ['id', 'name', 'position', 'salesPlan'],
  });

  const rating = await Promise.all(managers.map(async (mgr) => {
    const [deals, tasks, invoiced] = await Promise.all([
      Client.count({ where: { assignedTo: mgr.id, status: 'active', updatedAt: { [Op.gte]: start } } }),
      Task.count({   where: { assigneeId: mgr.id, status: 'done',   updatedAt: { [Op.gte]: start } } }),
      Invoice.sum('total', { where: { createdBy: mgr.id, status: 'paid', createdAt: { [Op.gte]: start } } }),
    ]);
    return {
      id:        mgr.id,
      name:      mgr.name,
      position:  mgr.position,
      salesPlan: mgr.salesPlan || 0,
      deals,
      tasks,
      invoiced:  invoiced || 0,
      planPct:   mgr.salesPlan ? Math.round(((invoiced||0) / mgr.salesPlan) * 100) : 0,
    };
  }));

  rating.sort((a, b) => b.invoiced - a.invoiced);
  res.json(rating);
};

module.exports = { getStats, getManagerStats, getManagersRating };
