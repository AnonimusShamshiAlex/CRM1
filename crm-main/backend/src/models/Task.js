const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  projectId: {
    type: DataTypes.UUID,
    field: 'project_id',
  },
  parentId: {
    type: DataTypes.UUID,
    field: 'parent_id',
  },
  assigneeId: {
    type: DataTypes.UUID,
    field: 'assignee_id',
  },
  createdById: {
    type: DataTypes.UUID,
    field: 'created_by_id',
  },
  status: {
    type: DataTypes.ENUM(
      'open',
      'in_progress',
      'on_pause',
      'review',
      'done',
      'rejected'
    ),
    defaultValue: 'open',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  deadline: {
    type: DataTypes.DATEONLY,
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(6, 2),
    field: 'estimated_hours',
  },
  trackedSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'tracked_seconds',
  },
  timerStartedAt: {
    type: DataTypes.DATE,
    field: 'timer_started_at',
  },
  checklist: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  googleEventId: {
    type: DataTypes.STRING,
    field: 'google_event_id',
  },
}, {
  tableName: 'tasks',
  underscored: true,
});

module.exports = Task;