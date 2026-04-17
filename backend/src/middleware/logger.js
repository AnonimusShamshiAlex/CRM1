// middleware/logger.js — Автологирование действий
const { ActivityLog } = require('../models');

// Маппинг HTTP методов → action
const METHOD_ACTION = {
  POST:   'create',
  PUT:    'update',
  PATCH:  'update',
  DELETE: 'delete',
};

// Маппинг путей → entity
const getEntity = (path) => {
  if (path.includes('/clients'))   return 'Client';
  if (path.includes('/projects'))  return 'Project';
  if (path.includes('/tasks'))     return 'Task';
  if (path.includes('/invoices'))  return 'Invoice';
  if (path.includes('/expenses'))  return 'Expense';
  if (path.includes('/users'))     return 'User';
  if (path.includes('/pipelines')) return 'Pipeline';
  if (path.includes('/documents')) return 'Document';
  if (path.includes('/webhooks'))  return 'Webhook';
  return null;
};

const activityLogger = (req, res, next) => {
  const action = METHOD_ACTION[req.method];
  if (!action || !req.user) return next();

  const entity = getEntity(req.path);
  if (!entity) return next();

  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    originalJson(data);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await ActivityLog.create({
          userId: req.user.id,
          action,
          entity,
          entityId:   data?.id || req.params?.id || null,
          entityName: data?.name || data?.title || null,
          ip: req.ip,
        });
      } catch (e) {
        // Не ломаем запрос если лог не записался
      }
    }
  };
  next();
};

module.exports = { activityLogger };
