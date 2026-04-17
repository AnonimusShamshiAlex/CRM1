// middleware/roles.js
// ТЗ: Доступ к данным ограничен на уровне API, не только на фронте

const { ActivityLog } = require('../models');

/**
 * Проверяет роль пользователя. Использовать ПОСЛЕ middleware auth.js
 * Пример: router.delete('/clients/:id', auth, requireRole('admin','rop'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const userRole = req.user.role;

    // Суперадмин всегда проходит
    if (userRole === 'superadmin') return next();

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: `Доступ запрещён. Требуется роль: ${roles.join(' или ')}`,
        yourRole: userRole,
        requiredRoles: roles,
      });
    }

    next();
  };
};

/**
 * Менеджер видит только свой проект.
 * Проверяет req.query.projectId или req.params.projectId
 */
const enforceManagerScope = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

  const role = req.user.role;

  // Суперадмин, Admin, РОП — видят всё
  if (['superadmin', 'admin', 'rop'].includes(role)) return next();

  // Маркетолог и Менеджер — только закреплённые проекты
  if (['manager', 'marketer'].includes(role)) {
    const userProjectId = req.user.projectId;

    // Если запрос указывает projectId — проверяем совпадение
    const requestedProjectId = req.query.projectId || req.params.projectId;
    if (requestedProjectId && String(requestedProjectId) !== String(userProjectId)) {
      return res.status(403).json({
        message: 'Доступ только к своему проекту',
      });
    }

    // Принудительно подставляем projectId менеджера в запрос
    req.query.projectId = userProjectId;
    req.scopedProjectId = userProjectId;
  }

  next();
};

/**
 * Запрет экспорта для менеджера и маркетолога
 * ТЗ: кнопка Export доступна только Админу и РОПу
 */
const requireExportPermission = requireRole('superadmin', 'admin', 'rop');

/**
 * Логирует действие в ActivityLog после успешного выполнения
 * Используется как middleware после handler
 */
const logActivity = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      originalJson(data);

      // Логируем только успешные ответы
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          await ActivityLog.create({
            userId: req.user.id,
            action,
            entity,
            entityId: data?.id || req.params?.id,
            entityName: data?.name || data?.title || null,
            description: null,
            changes: null,
            ip: req.ip,
          });
        } catch (e) {
          console.error('ActivityLog error:', e.message);
        }
      }
    };

    next();
  };
};

module.exports = {
  requireRole,
  enforceManagerScope,
  requireExportPermission,
  logActivity,
};
