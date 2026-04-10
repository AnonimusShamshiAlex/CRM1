// backend/src/routes/index.js

const router = require("express").Router();
const { body } = require("express-validator");
const { auth, requireRole } = require("../middleware/auth");

const authController = require("../controllers/authController");
const clientController = require("../controllers/clientController");
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
const financeController = require("../controllers/financeController");
const dashboardController = require("../controllers/dashboardController");
const exportController = require("../controllers/exportController");
const fileController = require("../controllers/fileController");
const pipelineController = require("../controllers/pipelineController");
const clientFieldController = require("../controllers/clientFieldController");
const telephonyController = require("../controllers/telephonyController");
const upload = require("../middleware/upload");
const { User, Notification, Task, Client } = require("../models");
const {
  getAuthUrl,
  getTokensFromCode,
  createCalendarEvent,
} = require("../services/googleCalendar");

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── AUTH ─────────────────────────────────────────────
router.post(
  "/auth/register",
  [
    body("name").notEmpty().withMessage("Имя обязательно"),
    body("email").isEmail().withMessage("Некорректный email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Пароль минимум 6 символов"),
  ],
  authController.register,
);

router.post(
  "/auth/login",
  [body("email").isEmail(), body("password").notEmpty()],
  authController.login,
);

router.get("/auth/me", auth, authController.me);
router.post("/auth/change-password", auth, authController.changePassword);

// ─── USERS ────────────────────────────────────────────
router.get("/users", auth, asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { isActive: true },
    attributes: [
      "id", "name", "email", "role", "position", "avatar", "employeeType",
      "phone", "assignedPipelineIds",
      "salesPlanMonth", "salesPlanWeek", "salesPlanDay",
      "isSuperAdmin", // ← ДОБАВИТЬ
    ],
  });
  res.json(users);
}));

router.patch("/users/:id/approve", auth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });

  const assignedRole = role || 'executor';

  // Только суперадмин может одобрить с ролью admin
  if (assignedRole === 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({
      error: "Только суперадминистратор может назначать роль Администратор",
    });
  }

  await user.update({ isActive: true, role: assignedRole });

  // Уведомить пользователя если подключён через WebSocket
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  if (io && connectedUsers) {
    const userSocketId = connectedUsers.get(user.id);
    if (userSocketId) {
      io.to(userSocketId).emit('account_approved', {
        message: 'Ваш аккаунт одобрен! Теперь вы можете войти в систему.',
      });
    }
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });
}));

// Получить список пользователей ожидающих одобрения — только admin
router.get("/users/pending", auth, requireRole("admin"), asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { isActive: false },
    attributes: ["id", "name", "email", "position", "createdAt"],
    order: [["createdAt", "ASC"]],
  });
  res.json(users);
}));

router.put("/users/:id", auth, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  const { password, role, ...data } = req.body;
  if (role && req.user.role === "admin") {
    data.role = role;
  }
  await user.update(data);
  res.json(user);
}));

router.patch("/users/:id/role", auth, requireRole("admin", "director"), asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["admin", "director", "head_of_sales", "manager", "executor"].includes(role)) {
    return res.status(400).json({ error: "Недопустимая роль" });
  }
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });

  // Только суперадмин может назначать роль admin
  if (role === "admin" && !req.user.isSuperAdmin) {
    return res.status(403).json({
      error: "Только суперадминистратор может назначать роль Администратор",
    });
  }

  // Нельзя менять роль суперадмина
  if (user.isSuperAdmin) {
    return res.status(403).json({
      error: "Нельзя изменить роль суперадминистратора",
    });
  }

  await user.update({ role });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    position: user.position,
    avatar: user.avatar,
    employeeType: user.employeeType,
    isSuperAdmin: user.isSuperAdmin,
  });
}));

router.patch("/users/:id/pipelines", auth, requireRole("admin", "director", "head_of_sales"), asyncHandler(async (req, res) => {
  const { pipelineIds } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  await user.update({ assignedPipelineIds: pipelineIds || [] });
  res.json({ id: user.id, assignedPipelineIds: user.assignedPipelineIds });
}));

router.patch("/users/:id/sales-plan", auth, requireRole("admin", "director", "head_of_sales"), asyncHandler(async (req, res) => {
  const { salesPlanMonth, salesPlanWeek, salesPlanDay } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  await user.update({ salesPlanMonth, salesPlanWeek, salesPlanDay });
  res.json({
    id: user.id,
    salesPlanMonth: user.salesPlanMonth,
    salesPlanWeek: user.salesPlanWeek,
    salesPlanDay: user.salesPlanDay,
  });
}));

router.post("/users/promote-admin", auth, asyncHandler(async (req, res) => {
  const adminCount = await User.count({ where: { role: "admin" } });
  if (adminCount > 0) {
    return res.status(400).json({ error: "Admin уже существует" });
  }
  const user = await User.findByPk(req.user.id);
  await user.update({ role: "admin" });
  res.json({ message: "Вы стали admin", role: "admin" });
}));

router.patch("/users/:id/deactivate", auth, requireRole("admin"), asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  await user.update({ isActive: false });
  res.json({ message: "Аккаунт деактивирован" });
}));

// ─── NOTIFICATIONS ────────────────────────────────────
router.get("/notifications", auth, asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [["createdAt", "DESC"]],
    limit: 30,
  });
  res.json(notifications);
}));

router.patch("/notifications/:id/read", auth, asyncHandler(async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: { id: req.params.id, userId: req.user.id } },
  );
  res.json({ ok: true });
}));

router.patch("/notifications/read-all", auth, asyncHandler(async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: { userId: req.user.id } },
  );
  res.json({ ok: true });
}));

// ─── CLIENTS ──────────────────────────────────────────
router.get("/clients", auth, clientController.getClients);
router.get("/clients/:id", auth, clientController.getClientById);
router.post(
  "/clients",
  auth,
  requireRole("admin", "manager"),
  clientController.createClient,
);
router.put(
  "/clients/:id",
  auth,
  requireRole("admin", "manager"),
  clientController.updateClient,
);
router.patch("/clients/:id/stage", auth, clientController.updateStage);

router.patch("/clients/:id/pipeline-stage", auth, asyncHandler(async (req, res) => {
  const { pipelineId, pipelineStageId, stageOrder } = req.body;
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ error: "Клиент не найден" });

  // Собираем только непустые поля для обновления
  const updateData = { stageOrder: stageOrder || 0 };

  // Если pipelineId передан — обновляем, если пустая строка — ставим null
  if (pipelineId !== undefined) {
    updateData.pipelineId = pipelineId || null;
  }
  if (pipelineStageId !== undefined) {
    updateData.pipelineStageId = pipelineStageId || null;
  }

  // Если стейдж задан но воронка нет — подтянуть воронку из стейджа
  if (updateData.pipelineStageId && !updateData.pipelineId) {
    const { PipelineStage } = require("../models");
    const stage = await PipelineStage.findByPk(updateData.pipelineStageId);
    if (stage) {
      updateData.pipelineId = stage.pipelineId;
    }
  }

  await client.update(updateData);
  res.json(client);
}));

router.delete(
  "/clients/:id",
  auth,
  requireRole("admin", "director"),
  clientController.deleteClient,
);
router.post("/clients/:id/interactions", auth, clientController.addInteraction);

// ─── PROJECTS ─────────────────────────────────────────
router.get("/projects", auth, projectController.getProjects);
router.get("/projects/:id", auth, projectController.getProjectById);
router.post(
  "/projects",
  auth,
  requireRole("admin", "manager"),
  projectController.createProject,
);
router.put(
  "/projects/:id",
  auth,
  requireRole("admin", "manager"),
  projectController.updateProject,
);
router.delete(
  "/projects/:id",
  auth,
  requireRole("admin"),
  projectController.deleteProject,
);

// ─── TASKS ────────────────────────────────────────────
router.get("/tasks", auth, taskController.getTasks);
router.get("/tasks/:id", auth, taskController.getTaskById);
router.post("/tasks", auth, taskController.createTask);
router.put("/tasks/:id", auth, taskController.updateTask);
router.delete("/tasks/:id", auth, taskController.deleteTask);
router.post("/tasks/:id/timer/start", auth, taskController.startTimer);
router.post("/tasks/:id/timer/stop", auth, taskController.stopTimer);
router.post("/tasks/:id/time", auth, taskController.addTimeManually);

// ─── FINANCE ──────────────────────────────────────────
router.get("/invoices", auth, requireRole("admin", "manager"), financeController.getInvoices);
router.post("/invoices", auth, requireRole("admin", "manager"), financeController.createInvoice);
router.put("/invoices/:id", auth, requireRole("admin", "manager"), financeController.updateInvoice);
router.post("/invoices/:id/payment", auth, requireRole("admin", "manager"), financeController.recordPayment);
router.get("/expenses", auth, requireRole("admin", "manager"), financeController.getExpenses);
router.post("/expenses", auth, requireRole("admin", "manager"), financeController.createExpense);
router.get("/reports/finance", auth, requireRole("admin", "manager"), financeController.getReport);

// ─── DASHBOARD ────────────────────────────────────────
router.get("/dashboard", auth, dashboardController.getDashboard);

// ─── PIPELINES ────────────────────────────────────────
router.get("/pipelines", auth, pipelineController.getPipelines);
router.get("/pipelines/:id", auth, pipelineController.getPipelineById);
router.post("/pipelines", auth, requireRole("admin", "director"), pipelineController.createPipeline);
router.put("/pipelines/:id", auth, requireRole("admin", "director"), pipelineController.updatePipeline);
router.delete("/pipelines/:id", auth, requireRole("admin", "director"), pipelineController.deletePipeline);
router.get("/pipelines/:id/stages", auth, pipelineController.getStages);
router.post("/pipelines/:id/stages", auth, requireRole("admin", "director"), pipelineController.createStage);
router.put("/pipelines/:id/stages/reorder", auth, requireRole("admin", "director"), pipelineController.reorderStages);
router.put("/pipelines/:pipelineId/stages/:stageId", auth, requireRole("admin", "director"), pipelineController.updateStage);
router.delete("/pipelines/:pipelineId/stages/:stageId", auth, requireRole("admin", "director"), pipelineController.deleteStage);

// ─── CLIENT FIELD DEFINITIONS ─────────────────────────
router.get("/client-fields", auth, clientFieldController.getFields);
router.post("/client-fields", auth, requireRole("admin", "director"), clientFieldController.createField);
router.put("/client-fields/:id", auth, requireRole("admin", "director"), clientFieldController.updateField);
router.delete("/client-fields/:id", auth, requireRole("admin", "director"), clientFieldController.deleteField);

// ─── TELEPHONY / IP CALLS ─────────────────────────────
router.post("/calls/initiate", auth, telephonyController.initiateCall);
router.post("/calls/webhook", telephonyController.callWebhook);
router.patch("/interactions/:id/recording", auth, telephonyController.updateRecording);

// ─── ANALYTICS ────────────────────────────────────────
router.get("/analytics/manager-stats", auth, telephonyController.getManagerStats);
router.get("/analytics/managers-rating", auth, requireRole("admin", "director", "head_of_sales"), telephonyController.getManagersRating);

// ─── EXPORT ──────────────────────────────────────────
router.get("/export/clients", auth, requireRole("admin", "manager"), exportController.exportClientsExcel);
router.get("/export/invoices/:id/pdf", auth, requireRole("admin", "manager"), exportController.exportInvoicePdf);
router.get("/export/reports/excel", auth, requireRole("admin", "manager"), exportController.exportReportExcel);
router.get("/export/reports/pdf", auth, requireRole("admin", "manager"), exportController.exportReportPdf);

// ─── FILES ───────────────────────────────────────────
router.post("/files/:entity/:entityId", auth, upload.array("files", 10), fileController.uploadFiles);
router.delete("/files/:entity/:filename", auth, fileController.deleteFile);

// ─── GOOGLE CALENDAR ─────────────────────────────────
router.get("/google/auth", auth, asyncHandler(async (req, res) => {
  const url = getAuthUrl(req.user.id);
  if (!url) {
    return res.status(400).json({
      error: "Google Calendar не настроен. Добавьте GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env",
    });
  }
  res.json({ url });
}));

router.get("/google/callback", asyncHandler(async (req, res) => {
  const { code, state: userId } = req.query;
  if (!code || !userId) {
    return res.status(400).send("Ошибка авторизации");
  }

  const tokens = await getTokensFromCode(code);
  if (!tokens?.refresh_token) {
    return res.status(400).send("Не удалось получить refresh token");
  }

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).send("Пользователь не найден");

  await user.update({ googleRefreshToken: tokens.refresh_token });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontendUrl}/team?google=connected`);
}));

router.delete("/google/disconnect", auth, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  await user.update({ googleRefreshToken: null });
  res.json({ message: "Google Calendar отключён" });
}));

router.post("/tasks/:id/google-calendar", auth, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user?.googleRefreshToken) {
    return res.status(400).json({
      error: "Google Calendar не подключён. Авторизуйтесь через настройки.",
    });
  }

  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ error: "Задача не найдена" });
  if (!task.deadline) {
    return res.status(400).json({ error: "У задачи нет дедлайна" });
  }

  const event = await createCalendarEvent(user.googleRefreshToken, task);
  if (event) {
    await task.update({ googleEventId: event.id });
    res.json({
      message: "Событие создано в Google Calendar",
      eventId: event.id,
    });
  } else {
    res.status(500).json({ error: "Не удалось создать событие" });
  }
}));

// Пригласить сотрудника (admin создаёт напрямую, сразу активен)
router.post("/users/invite", auth, requireRole("admin", "director"), asyncHandler(async (req, res) => {
  const { name, email, password, role, position, employeeType } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Имя, email и пароль обязательны' });
  }

  // Только суперадмин может приглашать с ролью admin
  if (role === 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Только суперадминистратор может создавать Администраторов' });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: 'Email уже используется' });
  }

  const hash = await require('bcryptjs').hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hash,
    role: role || 'executor',
    position,
    employeeType: employeeType || 'staff',
    isActive: true, // сразу активен
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });
}));

module.exports = router;