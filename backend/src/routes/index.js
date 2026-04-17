const express = require('express');
const router = express.Router();

// Импорт моделей из models/index.js
const { User, Client, Project, Task, Invoice, Expense, Pipeline, PipelineStage, Interaction, TimeLog, Notification, ActivityLog } = require('../models');

// Импорт контроллеров (некоторые могут отсутствовать)
const authController = require('../controllers/authController');
let clientController, projectController, taskController, financeController, dashboardController;
let pipelineController, clientFieldController, telephonyController, fileController, exportController;
let searchController, webhookController, documentController, metricsController, twoFactorController;

try { clientController = require('../controllers/clientController'); } catch(e) { clientController = null; }
try { projectController = require('../controllers/projectController'); } catch(e) { projectController = null; }
try { taskController = require('../controllers/taskController'); } catch(e) { taskController = null; }
try { financeController = require('../controllers/financeController'); } catch(e) { financeController = null; }
try { dashboardController = require('../controllers/dashboardController'); } catch(e) { dashboardController = null; }
try { pipelineController = require('../controllers/pipelineController'); } catch(e) { pipelineController = null; }
try { clientFieldController = require('../controllers/clientFieldController'); } catch(e) { clientFieldController = null; }
try { telephonyController = require('../controllers/telephonyController'); } catch(e) { telephonyController = null; }
try { fileController = require('../controllers/fileController'); } catch(e) { fileController = null; }
try { exportController = require('../controllers/exportController'); } catch(e) { exportController = null; }
try { searchController = require('../controllers/searchController'); } catch(e) { searchController = null; }
try { webhookController = require('../controllers/webhookController'); } catch(e) { webhookController = null; }
try { documentController = require('../controllers/documentController'); } catch(e) { documentController = null; }
try { metricsController = require('../controllers/metricsController'); } catch(e) { metricsController = null; }
try { twoFactorController = require('../controllers/twoFactorController'); } catch(e) { twoFactorController = null; }

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

// ==================== CLIENTS (с заглушками) ====================
const clientHandler = (method) => clientController && clientController[method] 
  ? clientController[method] 
  : (req, res) => res.status(501).json({ message: 'Endpoint временно недоступен' });

router.get('/clients', auth, clientHandler('getAll'));
router.get('/clients/:id', auth, clientHandler('getOne'));
router.post('/clients', auth, requireRole('admin', 'manager'), clientHandler('create'));
router.put('/clients/:id', auth, requireRole('admin', 'manager'), clientHandler('update'));
router.delete('/clients/:id', auth, requireRole('admin', 'director'), clientHandler('delete'));
router.patch('/clients/:id/pipeline-stage', auth, clientHandler('updatePipelineStage'));
router.post('/clients/:id/interactions', auth, clientHandler('addInteraction'));
router.post('/clients/distribute', auth, requireRole('admin', 'head_of_sales'), clientHandler('distribute'));

// ==================== PROJECTS ====================
const projectHandler = (method) => projectController && projectController[method] 
  ? projectController[method] 
  : (req, res) => res.status(501).json({ message: 'Endpoint временно недоступен' });

router.get('/projects', auth, projectHandler('getAll'));
router.get('/projects/:id', auth, projectHandler('getOne'));
router.post('/projects', auth, requireRole('admin', 'manager'), projectHandler('create'));
router.put('/projects/:id', auth, requireRole('admin', 'manager'), projectHandler('update'));
router.delete('/projects/:id', auth, requireRole('admin'), projectHandler('delete'));

// ==================== TASKS ====================
const taskHandler = (method) => taskController && taskController[method] 
  ? taskController[method] 
  : (req, res) => res.status(501).json({ message: 'Endpoint временно недоступен' });

router.get('/tasks', auth, taskHandler('getAll'));
router.get('/tasks/:id', auth, taskHandler('getOne'));
router.post('/tasks', auth, taskHandler('create'));
router.put('/tasks/:id', auth, taskHandler('update'));
router.delete('/tasks/:id', auth, taskHandler('delete'));
router.post('/tasks/:id/timer/start', auth, taskHandler('startTimer'));
router.post('/tasks/:id/timer/stop', auth, taskHandler('stopTimer'));
router.post('/tasks/:id/time', auth, taskHandler('addManualTime'));

// ==================== FINANCE ====================
const financeHandler = (method) => financeController && financeController[method] 
  ? financeController[method] 
  : (req, res) => res.status(501).json({ message: 'Endpoint временно недоступен' });

router.get('/invoices', auth, financeHandler('getInvoices'));
router.post('/invoices', auth, requireRole('admin', 'manager'), financeHandler('createInvoice'));
router.put('/invoices/:id', auth, requireRole('admin', 'manager'), financeHandler('updateInvoice'));
router.post('/invoices/:id/payment', auth, financeHandler('addPayment'));
router.get('/expenses', auth, financeHandler('getExpenses'));
router.post('/expenses', auth, requireRole('admin', 'manager'), financeHandler('createExpense'));
router.get('/reports/finance', auth, requireRole('admin', 'manager'), financeHandler('getFinanceReport'));

// ==================== PIPELINES ====================
const pipelineHandler = (method) => pipelineController && pipelineController[method] 
  ? pipelineController[method] 
  : (req, res) => res.status(501).json({ message: 'Endpoint временно недоступен' });

router.get('/pipelines', auth, pipelineHandler('getAll'));
router.get('/pipelines/:id', auth, pipelineHandler('getOne'));
router.post('/pipelines', auth, requireRole('admin', 'director'), pipelineHandler('create'));
router.put('/pipelines/:id', auth, requireRole('admin', 'director'), pipelineHandler('update'));
router.delete('/pipelines/:id', auth, requireRole('admin', 'director'), pipelineHandler('delete'));
router.get('/pipelines/:id/stages', auth, pipelineHandler('getStages'));
router.post('/pipelines/:id/stages', auth, requireRole('admin', 'director'), pipelineHandler('addStage'));
router.put('/pipelines/:id/stages/reorder', auth, requireRole('admin', 'director'), pipelineHandler('reorderStages'));
router.put('/pipelines/:pid/stages/:sid', auth, requireRole('admin', 'director'), pipelineHandler('updateStage'));
router.delete('/pipelines/:pid/stages/:sid', auth, requireRole('admin', 'director'), pipelineHandler('deleteStage'));

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', auth, dashboardController ? dashboardController.getStats : (req, res) => res.status(501).json({ message: 'Dashboard временно недоступен' }));

// ==================== CLIENT FIELDS ====================
const clientFieldHandler = (method) => clientFieldController && clientFieldController[method] 
  ? clientFieldController[method] 
  : (req, res) => res.status(501).json({ message: 'Endpoint временно недоступен' });

router.get('/client-fields', auth, clientFieldHandler('getAll'));
router.post('/client-fields', auth, requireRole('admin', 'director'), clientFieldHandler('create'));
router.put('/client-fields/:id', auth, requireRole('admin', 'director'), clientFieldHandler('update'));
router.delete('/client-fields/:id', auth, requireRole('admin', 'director'), clientFieldHandler('delete'));

// ==================== TELEPHONY ====================
router.post('/calls/initiate', auth, telephonyController ? telephonyController.initiateCall : (req, res) => res.status(501).json({ message: 'Telephony временно недоступна' }));
router.post('/calls/webhook', telephonyController ? telephonyController.webhook : (req, res) => res.status(501).json({ message: 'Telephony webhook временно недоступен' }));

// ==================== FILES ====================
router.post('/files/:entity/:entityId', auth, upload.array('files', 10), fileController ? fileController.upload : (req, res) => res.status(501).json({ message: 'File upload временно недоступен' }));
router.delete('/files/:entity/:filename', auth, fileController ? fileController.delete : (req, res) => res.status(501).json({ message: 'File delete временно недоступен' }));

// ==================== EXPORT ====================
const exportHandler = (method) => exportController && exportController[method] 
  ? exportController[method] 
  : (req, res) => res.status(501).json({ message: 'Export временно недоступен' });

router.get('/export/clients', auth, requireRole('admin', 'manager'), exportHandler('exportClients'));
router.get('/export/invoices/:id/pdf', auth, exportHandler('exportInvoicePDF'));
router.get('/export/reports/pdf', auth, exportHandler('exportReportPDF'));
router.get('/export/reports/excel', auth, exportHandler('exportReportExcel'));

// ==================== SEARCH ====================
router.get('/search', auth, searchController ? searchController.globalSearch : (req, res) => res.status(501).json({ message: 'Search временно недоступен' }));

// ==================== WEBHOOKS ====================
const webhookHandler = (method) => webhookController && webhookController[method] 
  ? webhookController[method] 
  : (req, res) => res.status(501).json({ message: 'Webhooks временно недоступны' });

router.get('/webhooks', auth, webhookHandler('getAll'));
router.post('/webhooks', auth, webhookHandler('create'));
router.put('/webhooks/:id', auth, webhookHandler('update'));
router.delete('/webhooks/:id', auth, webhookHandler('delete'));

// ==================== DOCUMENTS ====================
const documentHandler = (method) => documentController && documentController[method] 
  ? documentController[method] 
  : (req, res) => res.status(501).json({ message: 'Documents временно недоступны' });

router.get('/documents/templates', auth, documentHandler('getTemplates'));
router.post('/documents/generate', auth, documentHandler('generateDocument'));
router.get('/documents/:id', auth, documentHandler('getDocument'));
router.delete('/documents/:id', auth, documentHandler('deleteDocument'));

// ==================== METRICS ====================
const metricsHandler = (method) => metricsController && metricsController[method] 
  ? metricsController[method] 
  : (req, res) => res.status(501).json({ message: 'Metrics временно недоступны' });

router.get('/metrics/ltv', auth, metricsHandler('getLTV'));
router.get('/metrics/cac', auth, metricsHandler('getCAC'));
router.get('/metrics/romi', auth, metricsHandler('getROMI'));

// ==================== 2FA ====================
const twoFactorHandler = (method) => twoFactorController && twoFactorController[method] 
  ? twoFactorController[method] 
  : (req, res) => res.status(501).json({ message: '2FA временно недоступна' });

router.post('/2fa/setup', auth, twoFactorHandler('setup'));
router.post('/2fa/verify', auth, twoFactorHandler('verify'));
router.post('/2fa/disable', auth, twoFactorHandler('disable'));

module.exports = router;