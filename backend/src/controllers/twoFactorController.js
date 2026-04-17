// controllers/twoFactorController.js
// ТЗ: Реализация двухфакторной аутентификации (2FA)

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { User } = require('../models');

/**
 * Шаг 1: Генерация секрета и QR-кода для Google Authenticator
 * GET /api/auth/2fa/setup
 */
const setup2FA = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

  if (user.twoFactorEnabled) {
    return res.status(400).json({ message: '2FA уже включена' });
  }

  // Генерируем секрет
  const secret = speakeasy.generateSecret({
    name: `CRM Studio (${user.email})`,
    length: 20,
  });

  // Временно сохраняем секрет (до подтверждения)
  await user.update({ twoFactorSecret: secret.base32, twoFactorEnabled: false });

  // Генерируем QR-код
  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

  res.json({
    secret: secret.base32,
    qrCode: qrDataUrl,
    message: 'Отсканируйте QR-код в Google Authenticator и введите код для подтверждения',
  });
};

/**
 * Шаг 2: Подтверждение включения 2FA кодом из приложения
 * POST /api/auth/2fa/enable
 * body: { code }
 */
const enable2FA = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Введите код из приложения' });

  const user = await User.findByPk(req.user.id);
  if (!user?.twoFactorSecret) {
    return res.status(400).json({ message: 'Сначала пройдите настройку 2FA (/2fa/setup)' });
  }

  // Верифицируем код
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: String(code),
    window: 1, // допуск ±30 сек
  });

  if (!verified) {
    return res.status(400).json({ message: 'Неверный код. Проверьте время на устройстве' });
  }

  await user.update({ twoFactorEnabled: true });

  res.json({ message: '2FA успешно включена', twoFactorEnabled: true });
};

/**
 * Отключение 2FA
 * POST /api/auth/2fa/disable
 * body: { code }
 */
const disable2FA = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Введите текущий код из приложения' });

  const user = await User.findByPk(req.user.id);
  if (!user?.twoFactorEnabled) {
    return res.status(400).json({ message: '2FA не включена' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: String(code),
    window: 1,
  });

  if (!verified) {
    return res.status(400).json({ message: 'Неверный код' });
  }

  await user.update({
    twoFactorEnabled: false,
    twoFactorSecret: null,
  });

  res.json({ message: '2FA отключена', twoFactorEnabled: false });
};

/**
 * Верификация кода 2FA при входе
 * POST /api/auth/2fa/verify
 * body: { tempToken, code }
 * Используется в authController при логине если 2FA включена
 */
const verify2FALogin = async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ message: 'Требуется tempToken и code' });
  }

  // Декодируем временный токен
  const jwt = require('jsonwebtoken');
  let payload;
  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Токен истёк или недействителен' });
  }

  if (payload.type !== '2fa_pending') {
    return res.status(400).json({ message: 'Неверный тип токена' });
  }

  const user = await User.findByPk(payload.userId);
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: String(code),
    window: 1,
  });

  if (!verified) {
    return res.status(400).json({ message: 'Неверный код 2FA' });
  }

  // Выдаём полноценный JWT
  const fullToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token: fullToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
};

/**
 * Статус 2FA текущего пользователя
 * GET /api/auth/2fa/status
 */
const get2FAStatus = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'twoFactorEnabled'],
  });
  res.json({ twoFactorEnabled: user?.twoFactorEnabled || false });
};

module.exports = {
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FALogin,
  get2FAStatus,
};
