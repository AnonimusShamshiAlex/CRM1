// middleware/auth.js — JWT верификация
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.userId, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
    });

    if (!user) return res.status(401).json({ message: 'Пользователь не найден' });
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Учётная запись деактивирована' });
    }

    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Сессия истекла. Войдите снова.' });
    }
    return res.status(401).json({ message: 'Недействительный токен' });
  }
};

module.exports = { auth };
