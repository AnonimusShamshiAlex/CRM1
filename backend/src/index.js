// models/index.js — Все модели и связи между ними
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Импорт моделей
const User                 = require('./User')(sequelize);
const Client               = require('./Client')(sequelize);
const Project              = require('./Project')(sequelize);
const Task                 = require('./Task')(sequelize);
const Invoice              = require('./Invoice')(sequelize);
const Expense              = require('./Expense')(sequelize);
const Pipeline             = require('./Pipeline')(sequelize);
const PipelineStage        = require('./PipelineStage')(sequelize);
const Interaction          = require('./Interaction')(sequelize);
const TimeLog              = require('./TimeLog')(sequelize);
const Notification         = require('./Notification')(sequelize);
const ActivityLog          = require('./ActivityLog')(sequelize);
const ClientFieldDefinition = require('./ClientFieldDefinition')(sequelize);
const ProjectMember        = require('./ProjectMember')(sequelize);
const WorkLog              = require('./WorkLog')(sequelize);
const Webhook              = require('./Webhook')(sequelize);
const WebhookDelivery      = require('./WebhookDelivery')(sequelize);
const DocumentTemplate     = require('./DocumentTemplate')(sequelize);
const Document             = require('./Document')(sequelize);
const AdsAccount           = require('./AdsAccount')(sequelize);

// ─── USER связи ─────────────────────────────────
User.hasMany(Task,         { foreignKey: 'assigneeId', as: 'assignedTasks' });
User.hasMany(Task,         { foreignKey: 'createdBy',  as: 'createdTasks' });
User.hasMany(Notification, { foreignKey: 'userId',     as: 'notifications' });
User.hasMany(ActivityLog,  { foreignKey: 'userId',     as: 'activityLogs' });
User.hasMany(WorkLog,      { foreignKey: 'authorId',   as: 'workLogs' });
User.hasMany(Webhook,      { foreignKey: 'createdBy',  as: 'webhooks' });
User.hasMany(AdsAccount,   { foreignKey: 'createdBy',  as: 'adsAccounts' });
User.hasMany(ProjectMember,{ foreignKey: 'userId',     as: 'projectMemberships' });

ActivityLog.belongsTo(User, { foreignKey: 'userId',   as: 'user' });
Notification.belongsTo(User,{ foreignKey: 'userId',   as: 'user' });
WorkLog.belongsTo(User,     { foreignKey: 'authorId', as: 'author' });

// ─── CLIENT связи ────────────────────────────────
Client.belongsTo(Project,       { foreignKey: 'projectId',      as: 'project' });
Client.belongsTo(Pipeline,      { foreignKey: 'pipelineId',     as: 'pipeline' });
Client.belongsTo(PipelineStage, { foreignKey: 'pipelineStageId',as: 'pipelineStage' });
Client.belongsTo(User,          { foreignKey: 'assignedTo',     as: 'assignee' });
Client.hasMany(Task,            { foreignKey: 'clientId',       as: 'tasks' });
Client.hasMany(Invoice,         { foreignKey: 'clientId',       as: 'invoices' });
Client.hasMany(Expense,         { foreignKey: 'clientId',       as: 'expenses' });
Client.hasMany(Interaction,     { foreignKey: 'clientId',       as: 'interactions' });
Client.hasMany(Document,        { foreignKey: 'clientId',       as: 'documents' });

// ─── PROJECT связи ───────────────────────────────
Project.hasMany(Client,        { foreignKey: 'projectId', as: 'clients' });
Project.hasMany(Task,          { foreignKey: 'projectId', as: 'tasks' });
Project.hasMany(Invoice,       { foreignKey: 'projectId', as: 'invoices' });
Project.hasMany(Expense,       { foreignKey: 'projectId', as: 'expenses' });
Project.hasMany(WorkLog,       { foreignKey: 'projectId', as: 'workLogs' });
Project.hasMany(Document,      { foreignKey: 'projectId', as: 'documents' });
Project.belongsTo(User,        { foreignKey: 'managerId', as: 'manager' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'members' });
Project.belongsToMany(User,    { through: ProjectMember,  as: 'memberUsers', foreignKey: 'projectId' });
User.belongsToMany(Project,    { through: ProjectMember,  as: 'projects',    foreignKey: 'userId' });

// ─── TASK связи ──────────────────────────────────
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Task.belongsTo(Client,  { foreignKey: 'clientId',  as: 'client' });
Task.belongsTo(User,    { foreignKey: 'assigneeId',as: 'assignee' });
Task.belongsTo(User,    { foreignKey: 'createdBy', as: 'creator' });
Task.hasMany(TimeLog,   { foreignKey: 'taskId',    as: 'timeLogs' });

TimeLog.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
TimeLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ─── FINANCE связи ───────────────────────────────
Invoice.belongsTo(Client,  { foreignKey: 'clientId',  as: 'client' });
Invoice.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Invoice.belongsTo(User,    { foreignKey: 'createdBy', as: 'creator' });

Expense.belongsTo(Client,  { foreignKey: 'clientId',  as: 'client' });
Expense.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Expense.belongsTo(User,    { foreignKey: 'createdBy', as: 'creator' });

// ─── PIPELINE связи ──────────────────────────────
Pipeline.hasMany(PipelineStage, { foreignKey: 'pipelineId', as: 'stages', onDelete: 'CASCADE' });
Pipeline.hasMany(Client,        { foreignKey: 'pipelineId', as: 'clients' });
PipelineStage.belongsTo(Pipeline,{ foreignKey: 'pipelineId',as: 'pipeline' });
PipelineStage.hasMany(Client,   { foreignKey: 'pipelineStageId', as: 'clients' });

// ─── INTERACTION связи ───────────────────────────
Interaction.belongsTo(Client, { foreignKey: 'clientId',  as: 'client' });
Interaction.belongsTo(User,   { foreignKey: 'authorId',  as: 'author' });

// ─── WEBHOOK связи ───────────────────────────────
Webhook.hasMany(WebhookDelivery, { foreignKey: 'webhookId', as: 'deliveries', onDelete: 'CASCADE' });
WebhookDelivery.belongsTo(Webhook, { foreignKey: 'webhookId', as: 'webhook' });

// ─── DOCUMENT связи ──────────────────────────────
Document.belongsTo(Client,          { foreignKey: 'clientId',   as: 'client' });
Document.belongsTo(Project,         { foreignKey: 'projectId',  as: 'project' });
Document.belongsTo(DocumentTemplate,{ foreignKey: 'templateId', as: 'template' });
Document.belongsTo(User,            { foreignKey: 'createdBy',  as: 'creator' });

// ─── WORKLOG связи ───────────────────────────────
WorkLog.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Client,
  Project,
  Task,
  Invoice,
  Expense,
  Pipeline,
  PipelineStage,
  Interaction,
  TimeLog,
  Notification,
  ActivityLog,
  ClientFieldDefinition,
  ProjectMember,
  WorkLog,
  Webhook,
  WebhookDelivery,
  DocumentTemplate,
  Document,
  AdsAccount,
};