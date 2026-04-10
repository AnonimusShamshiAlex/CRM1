const { Op } = require('sequelize');
const { Project, Task, Invoice, Client, ActivityLog, User } = require('../models');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    // Активные проекты
    const activeProjects = await Project.findAll({
      where: { status: { [Op.in]: ['new', 'in_progress', 'review'] } },
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'avatar'] },
      ],
      limit: 5,
      order: [['deadline', 'ASC']],
    });

    // Мои задачи на сегодня
    const myTasks = await Task.findAll({
      where: {
        assigneeId: userId,
        status: { [Op.in]: ['open', 'in_progress'] },
        deadline: { [Op.lte]: today },
      },
      limit: 10,
      order: [['priority', 'DESC']],
    });

    // Просроченные задачи
    const overdueTasks = await Task.findAll({
      where: {
        deadline: { [Op.lt]: today },
        status: { [Op.notIn]: ['done', 'rejected'] },
        ...(req.user.role === 'executor' ? { assigneeId: userId } : {}),
      },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
      ],
      limit: 10,
    });

    // Выручка текущего месяца
    const revenueResult = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['paid', 'partial'] },
        paidAt: { [Op.gte]: monthStart },
      },
      attributes: ['paidAmount'],
      raw: true,
    });
    const monthRevenue = revenueResult.reduce(
      (sum, i) => sum + parseFloat(i.paidAmount || 0), 0
    );

    // Неоплаченные счета
    const unpaidInvoices = await Invoice.findAll({
      where: { status: { [Op.in]: ['sent', 'partial', 'overdue'] } },
      attributes: ['id', 'number', 'total', 'paidAmount', 'dueDate'],
      limit: 5,
    });

    // Новые лиды за неделю
    const newLeads = await Client.count({
      where: {
        type: 'lead',
        createdAt: { [Op.gte]: weekAgo },
      },
    });

    // Лента последних действий
    const activityFeed = await ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: 15,
    });

    res.json({
      activeProjects,
      myTasks,
      overdueTasks,
      finance: {
        monthRevenue,
        unpaidInvoices,
        unpaidTotal: unpaidInvoices.reduce(
          (sum, i) => sum + parseFloat(i.total) - parseFloat(i.paidAmount), 0
        ),
      },
      newLeads,
      activityFeed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = { getDashboard };