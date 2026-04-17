const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, position } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email уже используется' });
    }

    const userCount = await User.count();
    const isFirstUser = userCount === 0;

    const hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hash,
      role: isFirstUser ? 'admin' : 'executor',
      isSuperAdmin: isFirstUser,
      isActive: isFirstUser,
      position,
    });

    const token = generateToken(user);

    res.status(201).json({
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
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Аккаунт ожидает одобрения' });
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
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
};

const me = async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    position: req.user.position,
    isSuperAdmin: req.user.isSuperAdmin,
  });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный текущий пароль' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Пароль изменён' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = { register, login, me, changePassword };