// controllers/authController.js
// Регистрация, логин, одобрение — с поддержкой 2FA

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Notification } = require('../models');
const { emailService } = require('../services/emailService');

/**
 * Регистрация
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }

  // Валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Неверный формат email' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Пароль минимум 6 символов' });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
  }

  const totalUsers = await User.count();
  const isFirst = totalUsers === 0;

  const hashed = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role: isFirst ? 'superadmin' : 'manager',
    status: isFirst ? 'active' : 'pending',
    isSuperAdmin: isFirst,
  });

  if (!isFirst) {
    // Уведомляем всех админов
    const admins = await User.findAll({ where: { role: ['admin', 'superadmin'], status: 'active' } });
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        title: 'Новая заявка на регистрацию',
        body: `${name} (${email}) ожидает одобрения`,
        type: 'registration',
        link: '/team',
      });
    }
  }

  if (isFirst) {
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      isSuperAdmin: true,
    });
  }

  res.status(201).json({
    status: 'pending',
    message: 'Заявка отправлена. Дождитесь одобрения администратора.',
  });
};

/**
 * Вход
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Введите email и пароль' });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({
      status: 'pending',
      message: 'Ваша учётная запись ожидает одобрения администратором',
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ message: 'Учётная запись деактивирована' });
  }

  // ТЗ: Если 2FA включена — выдаём временный токен, требуем код
  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign(
      { userId: user.id, type: '2fa_pending' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } // 5 минут на ввод кода
    );

    return res.json({
      requires2FA: true,
      tempToken,
      message: 'Введите код из приложения-аутентификатора',
    });
  }

  // Обычный логин без 2FA
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      isSuperAdmin: user.isSuperAdmin,
    },
  });
};

/**
 * Обновить профиль (имя, email, должность, телефон)
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  const { name, email, position, phone } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

  // Проверяем что email не занят другим
  if (email && email !== user.email) {
    const taken = await User.findOne({ where: { email } });
    if (taken) return res.status(409).json({ message: 'Этот email уже используется' });
  }

  await user.update({
    name: name || user.name,
    email: email || user.email,
    position: position !== undefined ? position : user.position,
    phone: phone !== undefined ? phone : user.phone,
  });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    position: user.position,
    phone: user.phone,
    twoFactorEnabled: user.twoFactorEnabled,
  });
};

/**
 * Смена пароля
 * PUT /api/users/password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Новый пароль минимум 6 символов' });
  }

  const user = await User.findByPk(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ message: 'Неверный текущий пароль' });

  const hashed = await bcrypt.hash(newPassword, 12);
  await user.update({ password: hashed });

  res.json({ message: 'Пароль успешно изменён' });
};

/**
 * Одобрить пользователя
 * POST /api/users/:id/approve
 */
const approveUser = async (req, res) => {
  const { role } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

  // Только суперадмин может назначить роль admin
  if (role === 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Только суперадмин может назначить роль admin' });
  }

  await user.update({ status: 'active', role: role || 'manager' });

  await Notification.create({
    userId: user.id,
    title: 'Доступ одобрен',
    body: 'Ваша учётная запись активирована. Добро пожаловать в CRM!',
    type: 'system',
  });

  res.json({ message: 'Пользователь одобрен', user });
};

/**
 * Пригласить пользователя (сразу active)
 * POST /api/users/invite
 */
const inviteUser = async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Заполните имя, email и роль' });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Пользователь уже существует' });

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashed = await bcrypt.hash(tempPassword, 12);

  const user = await User.create({
    name, email, role,
    password: hashed,
    status: 'active',
  });

  // Отправляем письмо с временным паролем
  try {
    await emailService.sendInvite(email, name, tempPassword);
  } catch (e) {
    console.error('Email send error:', e.message);
  }

  res.status(201).json({
    message: `Пользователь приглашён. Временный пароль отправлен на ${email}`,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
  approveUser,
  inviteUser,
};
