const { ActivityLog } = require('../models');

const logAction = (action, entity) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          await ActivityLog.create({
            userId: req.user.id,
            action,
            entity,
            entityId: req.params.id || null,
            details: {
              method: req.method,
              path: req.path,
              body: req.method !== 'GET' ? req.body : undefined,
            },
            ip: req.ip,
          });
        } catch (e) {
          // Не блокируем запрос если логирование упало
          console.error('ActivityLog error:', e.message);
        }
      }
    });
    next();
  };
};

module.exports = { logAction };