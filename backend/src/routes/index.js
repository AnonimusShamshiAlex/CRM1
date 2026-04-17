const express = require('express');
const router = express.Router();

// Импорт моделей
const { User } = require('../models');

// Импорт контроллеров (только существующие)
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

// ==================== ВСЕ ОСТАЛЬНЫЕ МАРШРУТЫ (ВРЕМЕННЫЕ ЗАГЛУШКИ) ====================
router.get('/clients', auth, (req, res) => res.json({ message: 'Clients - временно' }));
router.get('/clients/:id', auth, (req, res) => res.json({ message: 'Client detail - временно' }));
router.post('/clients', auth, (req, res) => res.json({ message: 'Create client - временно' }));
router.put('/clients/:id', auth, (req, res) => res.json({ message: 'Update client - временно' }));
router.delete('/clients/:id', auth, (req, res) => res.json({ message: 'Delete client - временно' }));

router.get('/projects', auth, (req, res) => res.json({ message: 'Projects - временно' }));
router.get('/tasks', auth, (req, res) => res.json({ message: 'Tasks - временно' }));
router.get('/invoices', auth, (req, res) => res.json({ message: 'Invoices - временно' }));
router.get('/expenses', auth, (req, res) => res.json({ message: 'Expenses - временно' }));
router.get('/pipelines', auth, (req, res) => res.json({ message: 'Pipelines - временно' }));
router.get('/dashboard/stats', auth, (req, res) => res.json({ message: 'Dashboard - временно' }));
router.get('/search', auth, (req, res) => res.json({ message: 'Search - временно' }));

module.exports = router;