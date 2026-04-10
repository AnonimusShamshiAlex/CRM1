const sequelize = require('../config/database');

const User = require('./User');
const Client = require('./Client');
const Interaction = require('./Interaction');
const Project = require('./Project');
const Task = require('./Task');
const TimeLog = require('./TimeLog');
const Invoice = require('./Invoice');
const Expense = require('./Expense');
const Notification = require('./Notification');
const ActivityLog = require('./ActivityLog');
const Pipeline = require('./Pipeline');
const PipelineStage = require('./PipelineStage');
const ClientFieldDefinition = require('./ClientFieldDefinition');

// ProjectMembers — связующая таблица
const ProjectMember = sequelize.define('ProjectMember', {}, {
  tableName: 'project_members',
  underscored: true,
  timestamps: false,
});

// ─── Связи User ────────────────────────────────────────
User.hasMany(Client, { foreignKey: 'manager_id', as: 'managedClients' });
User.hasMany(Task, { foreignKey: 'assignee_id', as: 'assignedTasks' });
User.hasMany(TimeLog, { foreignKey: 'user_id', as: 'timeLogs' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
User.hasMany(Project, { foreignKey: 'manager_id', as: 'managedProjects' });
User.hasMany(Pipeline, { foreignKey: 'created_by_id', as: 'createdPipelines' });
User.hasMany(Interaction, { foreignKey: 'author_id', as: 'interactions' });

// ─── Связи Client ─────────────────────────────────────
Client.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
Client.hasMany(Interaction, { foreignKey: 'client_id', as: 'interactions' });
Client.hasMany(Project, { foreignKey: 'client_id', as: 'projects' });
Client.hasMany(Invoice, { foreignKey: 'client_id', as: 'invoices' });
Client.belongsTo(Pipeline, { foreignKey: 'pipeline_id', as: 'pipeline' });
Client.belongsTo(PipelineStage, { foreignKey: 'pipeline_stage_id', as: 'pipelineStage' });

// ─── Связи Interaction ────────────────────────────────
Interaction.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Interaction.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// ─── Связи Project ────────────────────────────────────
Project.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Project.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Project.hasMany(Invoice, { foreignKey: 'project_id', as: 'invoices' });
Project.hasMany(Expense, { foreignKey: 'project_id', as: 'expenses' });
Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: 'project_id',
  as: 'members',
});

// ─── Связи Task ───────────────────────────────────────
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Task.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'created_by_id', as: 'createdBy' });
Task.belongsTo(Task, { foreignKey: 'parent_id', as: 'parent' });
Task.hasMany(Task, { foreignKey: 'parent_id', as: 'subtasks' });
Task.hasMany(TimeLog, { foreignKey: 'task_id', as: 'timeLogs' });

// ─── Связи TimeLog ────────────────────────────────────
TimeLog.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
TimeLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Связи Invoice ────────────────────────────────────
Invoice.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Invoice.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// ─── Связи Expense ────────────────────────────────────
Expense.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// ─── Связи Notification ───────────────────────────────
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Связи ActivityLog ────────────────────────────────
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Связи ProjectMember ──────────────────────────────
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: 'user_id',
  as: 'projects',
});

// ─── Связи Pipeline ───────────────────────────────────
Pipeline.belongsTo(User, { foreignKey: 'created_by_id', as: 'createdBy' });
Pipeline.hasMany(PipelineStage, { foreignKey: 'pipeline_id', as: 'stages', onDelete: 'CASCADE' });
Pipeline.hasMany(Client, { foreignKey: 'pipeline_id', as: 'clients' });

// ─── Связи PipelineStage ──────────────────────────────
PipelineStage.belongsTo(Pipeline, { foreignKey: 'pipeline_id', as: 'pipeline' });
PipelineStage.hasMany(Client, { foreignKey: 'pipeline_stage_id', as: 'clients' });

module.exports = {
  sequelize,
  User,
  Client,
  Interaction,
  Project,
  ProjectMember,
  Task,
  TimeLog,
  Invoice,
  Expense,
  Notification,
  ActivityLog,
  Pipeline,
  PipelineStage,
  ClientFieldDefinition,
};