// controllers/webhookController.js
// ТЗ: Webhook-система — отправка данных в сторонние сервисы

const axios = require('axios');
const crypto = require('crypto');
const { Webhook, WebhookDelivery } = require('../models');

/**
 * GET /api/webhooks
 */
const getWebhooks = async (req, res) => {
  const webhooks = await Webhook.findAll({
    where: { createdBy: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json(webhooks);
};

/**
 * POST /api/webhooks
 */
const createWebhook = async (req, res) => {
  const { url, events, secret, description } = req.body;

  if (!url) return res.status(400).json({ message: 'URL обязателен' });
  if (!events?.length) return res.status(400).json({ message: 'Выберите хотя бы одно событие' });

  // Валидация URL
  try { new URL(url); } catch {
    return res.status(400).json({ message: 'Неверный формат URL' });
  }

  const webhook = await Webhook.create({
    url,
    events,
    secret: secret || null,
    description: description || null,
    active: true,
    createdBy: req.user.id,
  });

  res.status(201).json(webhook);
};

/**
 * PATCH /api/webhooks/:id
 */
const updateWebhook = async (req, res) => {
  const webhook = await Webhook.findByPk(req.params.id);
  if (!webhook) return res.status(404).json({ message: 'Webhook не найден' });

  await webhook.update(req.body);
  res.json(webhook);
};

/**
 * DELETE /api/webhooks/:id
 */
const deleteWebhook = async (req, res) => {
  const webhook = await Webhook.findByPk(req.params.id);
  if (!webhook) return res.status(404).json({ message: 'Webhook не найден' });

  await webhook.destroy();
  res.json({ message: 'Webhook удалён' });
};

/**
 * POST /api/webhooks/:id/test
 */
const testWebhook = async (req, res) => {
  const webhook = await Webhook.findByPk(req.params.id);
  if (!webhook) return res.status(404).json({ message: 'Webhook не найден' });

  const payload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: { message: 'Тестовое событие из CRM Studio' },
  };

  const result = await deliverWebhook(webhook, payload);
  res.json({ success: result.success, status: result.status });
};

/**
 * Отправка события всем подходящим webhooks
 * Вызывается из других контроллеров
 */
const triggerWebhooks = async (event, data) => {
  try {
    const { Op } = require('sequelize');
    const webhooks = await Webhook.findAll({
      where: {
        active: true,
        events: { [Op.contains]: [event] },
      },
    });

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Отправляем все параллельно
    await Promise.allSettled(webhooks.map((wh) => deliverWebhook(wh, payload)));
  } catch (e) {
    console.error('triggerWebhooks error:', e.message);
  }
};

/**
 * Отправка одного webhook с логированием
 */
const deliverWebhook = async (webhook, payload) => {
  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };

  // Подпись если есть секрет
  if (webhook.secret) {
    const sig = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');
    headers['X-CRM-Signature'] = `sha256=${sig}`;
  }

  let success = false;
  let statusCode = 0;
  let error = null;

  try {
    const response = await axios.post(webhook.url, payload, {
      headers,
      timeout: 10000, // 10 сек таймаут
    });
    success = true;
    statusCode = response.status;
  } catch (e) {
    success = false;
    statusCode = e.response?.status || 0;
    error = e.message;
  }

  // Логируем доставку
  try {
    await WebhookDelivery.create({
      webhookId: webhook.id,
      event: payload.event,
      success,
      statusCode,
      error,
      payload: payload,
    });

    // Обновляем lastDelivery в webhook
    await webhook.update({
      lastDelivery: { success, at: new Date(), status: statusCode },
    });
  } catch (e) {
    console.error('WebhookDelivery log error:', e.message);
  }

  return { success, status: statusCode, error };
};

module.exports = {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  triggerWebhooks,
};
