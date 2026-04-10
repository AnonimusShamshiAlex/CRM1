const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');

let bot = null;

/**
 * Инициализация Telegram-бота
 * Запускается только если TELEGRAM_BOT_TOKEN задан в .env
 */
const initBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN не задан — Telegram-бот отключён');
    return;
  }

  bot = new TelegramBot(token, { polling: true });

  // Команда /start — привязка аккаунта
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      'Добро пожаловать в CRM Studio бот!\n\n' +
      'Чтобы привязать аккаунт, отправьте свой email командой:\n' +
      '/link ваш@email.com'
    );
  });

  // Команда /link — привязка email к chatId
  bot.onText(/\/link (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1].trim().toLowerCase();

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        await bot.sendMessage(chatId, '❌ Пользователь с таким email не найден в CRM.');
        return;
      }

      await user.update({ telegramChatId: String(chatId) });
      await bot.sendMessage(
        chatId,
        `✅ Аккаунт привязан!\nПривет, ${user.name}! Теперь вы будете получать уведомления здесь.`
      );
    } catch (err) {
      console.error('Telegram /link error:', err);
      await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
    }
  });

  // Команда /unlink — отвязка аккаунта
  bot.onText(/\/unlink/, async (msg) => {
    const chatId = String(msg.chat.id);

    try {
      const user = await User.findOne({ where: { telegramChatId: chatId } });
      if (!user) {
        await bot.sendMessage(chatId, 'Аккаунт не привязан.');
        return;
      }

      await user.update({ telegramChatId: null });
      await bot.sendMessage(chatId, '✅ Аккаунт отвязан. Уведомления больше не будут приходить.');
    } catch (err) {
      console.error('Telegram /unlink error:', err);
      await bot.sendMessage(chatId, '❌ Произошла ошибка.');
    }
  });

  // Команда /status — проверка статуса привязки
  bot.onText(/\/status/, async (msg) => {
    const chatId = String(msg.chat.id);

    try {
      const user = await User.findOne({ where: { telegramChatId: chatId } });
      if (user) {
        await bot.sendMessage(chatId, `✅ Аккаунт привязан: ${user.name} (${user.email})`);
      } else {
        await bot.sendMessage(chatId, '❌ Аккаунт не привязан. Используйте /link email');
      }
    } catch (err) {
      await bot.sendMessage(chatId, '❌ Ошибка проверки.');
    }
  });

  console.log('✅ Telegram-бот запущен');
};

/**
 * Отправка уведомления пользователю по userId
 */
const sendTelegramNotification = async (userId, text) => {
  if (!bot) return;

  try {
    const user = await User.findByPk(userId);
    if (!user?.telegramChatId) return;

    await bot.sendMessage(user.telegramChatId, text, { parse_mode: 'HTML' });
  } catch (err) {
    console.error(`Telegram send error (userId: ${userId}):`, err.message);
  }
};

/**
 * Отправка напрямую по chatId
 */
const sendTelegramMessage = async (chatId, text) => {
  if (!bot || !chatId) return;

  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (err) {
    console.error(`Telegram send error (chatId: ${chatId}):`, err.message);
  }
};

/**
 * Шаблоны уведомлений
 */
const notifyTaskAssigned = async (userId, taskTitle, assignerName) => {
  const text = `📋 <b>Новая задача</b>\n\n` +
    `Вам назначена задача: <b>${taskTitle}</b>\n` +
    `Назначил: ${assignerName}`;
  await sendTelegramNotification(userId, text);
};

const notifyTaskStatusChanged = async (userId, taskTitle, oldStatus, newStatus) => {
  const text = `🔄 <b>Статус задачи изменён</b>\n\n` +
    `Задача: <b>${taskTitle}</b>\n` +
    `${oldStatus} → ${newStatus}`;
  await sendTelegramNotification(userId, text);
};

const notifyDeadlineReminder = async (userId, taskTitle, deadline) => {
  const text = `⏰ <b>Напоминание о дедлайне</b>\n\n` +
    `Задача: <b>${taskTitle}</b>\n` +
    `Дедлайн: ${deadline}`;
  await sendTelegramNotification(userId, text);
};

const notifyNewComment = async (userId, taskTitle, authorName, comment) => {
  const shortComment = comment.length > 100 ? comment.substring(0, 100) + '...' : comment;
  const text = `💬 <b>Новый комментарий</b>\n\n` +
    `Задача: <b>${taskTitle}</b>\n` +
    `${authorName}: ${shortComment}`;
  await sendTelegramNotification(userId, text);
};

module.exports = {
  initBot,
  sendTelegramNotification,
  sendTelegramMessage,
  notifyTaskAssigned,
  notifyTaskStatusChanged,
  notifyDeadlineReminder,
  notifyNewComment,
};
