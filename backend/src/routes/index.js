const express = require('express');
const router = express.Router();

// Импорт моделей из models/index.js
const { User, Client, Project, Task, Invoice, Expense, Pipeline, PipelineStage, Interaction, TimeLog, Notification, ActivityLog } = require('../models');

// Импорт контроллеров (только authController точно существует)
const authController = require('../controllers/authController');

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

// ==================== CLIENTS (временные заглушки) ====================
router.get('/clients', auth, (req, res) => res.json({ message: 'Clients endpoint - временно недоступен' }));
router.get('/clients/:id', auth, (req, res) => res.json({ message: 'Client detail - временно недоступен' }));
router.post('/clients', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Create client - временно недоступен' }));
router.put('/clients/:id', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Update client - временно недоступен' }));
router.delete('/clients/:id', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Delete client - временно недоступен' }));
router.patch('/clients/:id/pipeline-stage', auth, (req, res) => res.json({ message: 'Update pipeline stage - временно недоступен' }));
router.post('/clients/:id/interactions', auth, (req, res) => res.json({ message: 'Add interaction - временно недоступен' }));
router.post('/clients/distribute', auth, requireRole('admin', 'head_of_sales'), (req, res) => res.json({ message: 'Distribute clients - временно недоступен' }));

// ==================== PROJECTS (временные заглушки) ====================
router.get('/projects', auth, (req, res) => res.json({ message: 'Projects endpoint - временно недоступен' }));
router.get('/projects/:id', auth, (req, res) => res.json({ message: 'Project detail - временно недоступен' }));
router.post('/projects', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Create project - временно недоступен' }));
router.put('/projects/:id', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Update project - временно недоступен' }));
router.delete('/projects/:id', auth, requireRole('admin'), (req, res) => res.json({ message: 'Delete project - временно недоступен' }));

// ==================== TASKS (временные заглушки) ====================
router.get('/tasks', auth, (req, res) => res.json({ message: 'Tasks endpoint - временно недоступен' }));
router.get('/tasks/:id', auth, (req, res) => res.json({ message: 'Task detail - временно недоступен' }));
router.post('/tasks', auth, (req, res) => res.json({ message: 'Create task - временно недоступен' }));
router.put('/tasks/:id', auth, (req, res) => res.json({ message: 'Update task - временно недоступен' }));
router.delete('/tasks/:id', auth, (req, res) => res.json({ message: 'Delete task - временно недоступен' }));
router.post('/tasks/:id/timer/start', auth, (req, res) => res.json({ message: 'Start timer - временно недоступен' }));
router.post('/tasks/:id/timer/stop', auth, (req, res) => res.json({ message: 'Stop timer - временно недоступен' }));
router.post('/tasks/:id/time', auth, (req, res) => res.json({ message: 'Add manual time - временно недоступен' }));

// ==================== FINANCE (временные заглушки) ====================
router.get('/invoices', auth, (req, res) => res.json({ message: 'Invoices endpoint - временно недоступен' }));
router.post('/invoices', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Create invoice - временно недоступен' }));
router.put('/invoices/:id', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Update invoice - временно недоступен' }));
router.post('/invoices/:id/payment', auth, (req, res) => res.json({ message: 'Add payment - временно недоступен' }));
router.get('/expenses', auth, (req, res) => res.json({ message: 'Expenses endpoint - временно недоступен' }));
router.post('/expenses', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Create expense - временно недоступен' }));
router.get('/reports/finance', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Finance report - временно недоступен' }));

// ==================== PIPELINES (временные заглушки) ====================
router.get('/pipelines', auth, (req, res) => res.json({ message: 'Pipelines endpoint - временно недоступен' }));
router.get('/pipelines/:id', auth, (req, res) => res.json({ message: 'Pipeline detail - временно недоступен' }));
router.post('/pipelines', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Create pipeline - временно недоступен' }));
router.put('/pipelines/:id', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Update pipeline - временно недоступен' }));
router.delete('/pipelines/:id', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Delete pipeline - временно недоступен' }));
router.get('/pipelines/:id/stages', auth, (req, res) => res.json({ message: 'Pipeline stages - временно недоступен' }));
router.post('/pipelines/:id/stages', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Add stage - временно недоступен' }));
router.put('/pipelines/:id/stages/reorder', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Reorder stages - временно недоступен' }));
router.put('/pipelines/:pid/stages/:sid', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Update stage - временно недоступен' }));
router.delete('/pipelines/:pid/stages/:sid', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Delete stage - временно недоступен' }));

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', auth, (req, res) => res.json({ message: 'Dashboard stats - временно недоступен' }));

// ==================== CLIENT FIELDS ====================
router.get('/client-fields', auth, (req, res) => res.json({ message: 'Client fields - временно недоступен' }));
router.post('/client-fields', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Create client field - временно недоступен' }));
router.put('/client-fields/:id', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Update client field - временно недоступен' }));
router.delete('/client-fields/:id', auth, requireRole('admin', 'director'), (req, res) => res.json({ message: 'Delete client field - временно недоступен' }));

// ==================== TELEPHONY ====================
router.post('/calls/initiate', auth, (req, res) => res.json({ message: 'Initiate call - временно недоступен' }));
router.post('/calls/webhook', (req, res) => res.json({ message: 'Call webhook - временно недоступен' }));

// ==================== FILES ====================
router.post('/files/:entity/:entityId', auth, upload.array('files', 10), (req, res) => res.json({ message: 'Upload files - временно недоступен' }));
router.delete('/files/:entity/:filename', auth, (req, res) => res.json({ message: 'Delete file - временно недоступен' }));

// ==================== EXPORT ====================
router.get('/export/clients', auth, requireRole('admin', 'manager'), (req, res) => res.json({ message: 'Export clients - временно недоступен' }));
router.get('/export/invoices/:id/pdf', auth, (req, res) => res.json({ message: 'Export invoice PDF - временно недоступен' }));
router.get('/export/reports/pdf', auth, (req, res) => res.json({ message: 'Export report PDF - временно недоступен' }));
router.get('/export/reports/excel', auth, (req, res) => res.json({ message: 'Export report Excel - временно недоступен' }));

// ==================== SEARCH ====================
router.get('/search', auth, (req, res) => res.json({ message: 'Global search - временно недоступен' }));

// ==================== WEBHOOKS ====================
router.get('/webhooks', auth, (req, res) => res.json({ message: 'Webhooks - временно недоступен' }));
router.post('/webhooks', auth, (req, res) => res.json({ message: 'Create webhook - временно недоступен' }));
router.put('/webhooks/:id', auth, (req, res) => res.json({ message: 'Update webhook - временно недоступен' }));
router.delete('/webhooks/:id', auth, (req, res) => res.json({ message: 'Delete webhook - временно недоступен' }));

// ==================== DOCUMENTS ====================
router.get('/documents/templates', auth, (req, res) => res.json({ message: 'Document templates - временно недоступен' }));
router.post('/documents/generate', auth, (req, res) => res.json({ message: 'Generate document - временно недоступен' }));
router.get('/documents/:id', auth, (req, res) => res.json({ message: 'Get document - временно недоступен' }));
router.delete('/documents/:id', auth, (req, res) => res.json({ message: 'Delete document - временно недоступен' }));

// ==================== METRICS ====================
router.get('/metrics/ltv', auth, (req, res) => res.json({ message: 'LTV metric - временно недоступен' }));
router.get('/metrics/cac', auth, (req, res) => res.json({ message: 'CAC metric - временно недоступен' }));
router.get('/metrics/romi', auth, (req, res) => res.json({ message: 'ROMI metric - временно недоступен' }));

// ==================== 2FA ====================
router.post('/2fa/setup', auth, (req, res) => res.json({ message: '2FA setup - временно недоступен' }));
router.post('/2fa/verify', auth, (req, res) => res.json({ message: '2FA verify - временно недоступен' }));
router.post('/2fa/disable', auth, (req, res) => res.json({ message: '2FA disable - временно недоступен' }));

module.exports = router;