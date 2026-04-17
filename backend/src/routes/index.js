const express = require('express');
const router = express.Router();

// Импорт моделей из models/index.js
const { User, Client, Project, Task, Invoice, Expense, Pipeline, PipelineStage, Interaction, TimeLog, Notification, ActivityLog } = require('../models');

// Импорт контроллеров
const authController = require('../controllers/authController');
const clientController = require('../controllers/clientController');
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const financeController = require('../controllers/financeController');
const dashboardController = require('../controllers/dashboardController');
const pipelineController = require('../controllers/pipelineController');
const clientFieldController = require('../controllers/clientFieldController');
const telephonyController = require('../controllers/telephonyController');
const fileController = require('../controllers/fileController');
const exportController = require('../controllers/exportController');
const searchController = require('../controllers/searchController');
const webhookController = require('../controllers/webhookController');
const documentController = require('../controllers/documentController');
const metricsController = require('../controllers/metricsController');
const twoFactorController = require('../controllers/twoFactorController');

// Мидлвары
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ==================== AUTH ====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.me);
router.post('/auth/change-password', auth, authController.changePassword);

// ==================== USERS ====================
router.get('/users', auth, requireRole('admin', 'director'), async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});
router.get('/users/pending', auth, requireRole('admin'), async (req, res) => {
  const users = await User.findAll({ where: { isActive: false }, attributes: { exclude: ['password'] } });
  res.json(users);
});
router.patch('/users/:id/approve', auth, requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  await User.update({ isActive: true, role }, { where: { id: req.params.id } });
  res.json({ message: 'Пользователь одобрен' });
});
router.patch('/users/:id/role', auth, requireRole('admin', 'director'), async (req, res) => {
  await User.update({ role: req.body.role }, { where: { id: req.params.id } });
  res.json({ message: 'Роль обновлена' });
});
router.put('/users/profile', auth, async (req, res) => {
  await User.update(req.body, { where: { id: req.user.id } });
  const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
  res.json(updated);
});
router.put('/users/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  const bcrypt = require('bcryptjs');
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Неверный текущий пароль' });
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: 'Пароль изменён' });
});

// ==================== CLIENTS ====================
router.get('/clients', auth, clientController.getAll);
router.get('/clients/:id', auth, clientController.getOne);
router.post('/clients', auth, requireRole('admin', 'manager'), clientController.create);
router.put('/clients/:id', auth, requireRole('admin', 'manager'), clientController.update);
router.delete('/clients/:id', auth, requireRole('admin', 'director'), clientController.delete);
router.patch('/clients/:id/pipeline-stage', auth, clientController.updatePipelineStage);
router.post('/clients/:id/interactions', auth, clientController.addInteraction);
router.post('/clients/distribute', auth, requireRole('admin', 'head_of_sales'), clientController.distribute);

// ==================== PROJECTS ====================
router.get('/projects', auth, projectController.getAll);
router.get('/projects/:id', auth, projectController.getOne);
router.post('/projects', auth, requireRole('admin', 'manager'), projectController.create);
router.put('/projects/:id', auth, requireRole('admin', 'manager'), projectController.update);
router.delete('/projects/:id', auth, requireRole('admin'), projectController.delete);

// ==================== TASKS ====================
router.get('/tasks', auth, taskController.getAll);
router.get('/tasks/:id', auth, taskController.getOne);
router.post('/tasks', auth, taskController.create);
router.put('/tasks/:id', auth, taskController.update);
router.delete('/tasks/:id', auth, taskController.delete);
router.post('/tasks/:id/timer/start', auth, taskController.startTimer);
router.post('/tasks/:id/timer/stop', auth, taskController.stopTimer);
router.post('/tasks/:id/time', auth, taskController.addManualTime);

// ==================== FINANCE ====================
router.get('/invoices', auth, financeController.getInvoices);
router.post('/invoices', auth, requireRole('admin', 'manager'), financeController.createInvoice);
router.put('/invoices/:id', auth, requireRole('admin', 'manager'), financeController.updateInvoice);
router.post('/invoices/:id/payment', auth, financeController.addPayment);
router.get('/expenses', auth, financeController.getExpenses);
router.post('/expenses', auth, requireRole('admin', 'manager'), financeController.createExpense);
router.get('/reports/finance', auth, requireRole('admin', 'manager'), financeController.getFinanceReport);

// ==================== PIPELINES ====================
router.get('/pipelines', auth, pipelineController.getAll);
router.get('/pipelines/:id', auth, pipelineController.getOne);
router.post('/pipelines', auth, requireRole('admin', 'director'), pipelineController.create);
router.put('/pipelines/:id', auth, requireRole('admin', 'director'), pipelineController.update);
router.delete('/pipelines/:id', auth, requireRole('admin', 'director'), pipelineController.delete);
router.get('/pipelines/:id/stages', auth, pipelineController.getStages);
router.post('/pipelines/:id/stages', auth, requireRole('admin', 'director'), pipelineController.addStage);
router.put('/pipelines/:id/stages/reorder', auth, requireRole('admin', 'director'), pipelineController.reorderStages);
router.put('/pipelines/:pid/stages/:sid', auth, requireRole('admin', 'director'), pipelineController.updateStage);
router.delete('/pipelines/:pid/stages/:sid', auth, requireRole('admin', 'director'), pipelineController.deleteStage);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', auth, dashboardController.getStats);

// ==================== CLIENT FIELDS ====================
router.get('/client-fields', auth, clientFieldController.getAll);
router.post('/client-fields', auth, requireRole('admin', 'director'), clientFieldController.create);
router.put('/client-fields/:id', auth, requireRole('admin', 'director'), clientFieldController.update);
router.delete('/client-fields/:id', auth, requireRole('admin', 'director'), clientFieldController.delete);

// ==================== TELEPHONY ====================
router.post('/calls/initiate', auth, telephonyController.initiateCall);
router.post('/calls/webhook', telephonyController.webhook);

// ==================== FILES ====================
router.post('/files/:entity/:entityId', auth, upload.array('files', 10), fileController.upload);
router.delete('/files/:entity/:filename', auth, fileController.delete);

// ==================== EXPORT ====================
router.get('/export/clients', auth, requireRole('admin', 'manager'), exportController.exportClients);
router.get('/export/invoices/:id/pdf', auth, exportController.exportInvoicePDF);
router.get('/export/reports/pdf', auth, exportController.exportReportPDF);
router.get('/export/reports/excel', auth, exportController.exportReportExcel);

// ==================== SEARCH ====================
router.get('/search', auth, searchController.globalSearch);

// ==================== WEBHOOKS ====================
router.get('/webhooks', auth, webhookController.getAll);
router.post('/webhooks', auth, webhookController.create);
router.put('/webhooks/:id', auth, webhookController.update);
router.delete('/webhooks/:id', auth, webhookController.delete);

// ==================== DOCUMENTS ====================
router.get('/documents/templates', auth, documentController.getTemplates);
router.post('/documents/generate', auth, documentController.generateDocument);
router.get('/documents/:id', auth, documentController.getDocument);
router.delete('/documents/:id', auth, documentController.deleteDocument);

// ==================== METRICS ====================
router.get('/metrics/ltv', auth, metricsController.getLTV);
router.get('/metrics/cac', auth, metricsController.getCAC);
router.get('/metrics/romi', auth, metricsController.getROMI);

// ==================== 2FA ====================
router.post('/2fa/setup', auth, twoFactorController.setup);
router.post('/2fa/verify', auth, twoFactorController.verify);
router.post('/2fa/disable', auth, twoFactorController.disable);

module.exports = router;