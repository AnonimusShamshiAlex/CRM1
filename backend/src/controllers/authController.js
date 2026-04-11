const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Notification } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, position } = req.body;

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email уже используется' });
    }

    const userCount = await User.count();
    const isFirstUser = userCount === 0;

    const hash = await bcrypt.hash(password, 12);

    if (isFirstUser) {
      // Первый пользователь — суперадмин, сразу активен
      const user = await User.create({
        name,
        email,
        password: hash,
        role: 'admin',
        isSuperAdmin: true,
        isActive: true,
        position,
      });

      const token = generateToken(user);
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          position: user.position,
          isSuperAdmin: user.isSuperAdmin,
        },
      });
    }

    // Остальные — создаём с isActive: false, ждут одобрения
    const user = await User.create({
      name,
      email,
      password: hash,
      role: 'executor',
      isActive: false,
      position,
    });

    // Уведомляем всех админов (безопасная версия)
    const admins = await User.findAll({
      where: { role: 'admin', isActive: true },
    });

    for (const admin of admins) {
      try {
        await Notification.create({
          userId: admin.id,
          type: 'new_user_pending',
          title: 'Новый пользователь ожидает одобрения',
          message: `${name} (${email}) зарегистрировался и ожидает активации`,
          link: '/team',
          payload: { userId: user.id, userName: name, userEmail: email },
        });
      } catch (notifErr) {
        console.error('Ошибка создания уведомления в БД:', notifErr.message);
      }

      // WebSocket уведомление — только если всё инициализировано
      try {
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        if (io && connectedUsers && typeof connectedUsers.get === 'function') {
          const adminSocketId = connectedUsers.get(admin.id);
          if (adminSocketId) {
            io.to(adminSocketId).emit('notification', {
              type: 'new_user_pending',
              title: 'Новый пользователь ожидает одобрения',
              message: `${name} (${email}) зарегистрировался`,
            });
          }
        }
      } catch (wsErr) {
        console.error('WebSocket уведомление не отправлено:', wsErr.message);
      }
    }

    return res.status(201).json({
      pending: true,
      message: 'Регистрация отправлена. Ожидайте одобрения администратора.',
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем статус ПОСЛЕ проверки пароля
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Аккаунт ожидает одобрения администратора',
        pending: true,
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      position: req.user.position,
      avatar: req.user.avatar,
      phone: req.user.phone,
      isSuperAdmin: req.user.isSuperAdmin,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Новый пароль должен быть не менее 6 символов' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный текущий пароль' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Ошибка сервера при смене пароля' });
  }
};

module.exports = { register, login, me, changePassword };