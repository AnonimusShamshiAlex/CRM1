// services/telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const { User } = require('../models');

let bot;

const getBot = () => {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  }
  return bot;
};

const initBot = () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN не задан — Telegram-бот отключён');
    return;
  }
  try {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log('✅ Telegram бот запущен');
  } catch (err) {
    console.error('❌ Ошибка запуска Telegram бота:', err.message);
  }
};

// Отправить уведомление пользователю по его telegramChatId
const sendToUser = async (userId, text) => {
  try {
    const user = await User.findByPk(userId);
    if (!user?.telegramChatId) return;
    const b = getBot();
    if (b) await b.sendMessage(user.telegramChatId, text, { parse_mode: 'HTML' });
  } catch (e) {
    console.error('[Telegram] Ошибка:', e.message);
  }
};

// Webhook для привязки Telegram аккаунта
const handleTelegramWebhook = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/link ')) {
    const token = text.replace('/link ', '').trim();
    const user = await User.findOne({ where: { telegramLinkToken: token } });
    if (user) {
      await user.update({ telegramChatId: String(chatId) });
      const b = getBot();
      if (b) await b.sendMessage(chatId, `✅ Telegram привязан к аккаунту ${user.name}`);
    } else {
      const b = getBot();
      if (b) await b.sendMessage(chatId, '❌ Неверный токен. Проверьте код в настройках профиля.');
    }
  }

  res.sendStatus(200);
};

module.exports = { initBot, sendToUser, handleTelegramWebhook };