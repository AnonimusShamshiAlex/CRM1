const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  clientId: {
    type: DataTypes.UUID,
    field: 'client_id',
  },
  managerId: {
    type: DataTypes.UUID,
    field: 'manager_id',
  },
  status: {
    type: DataTypes.ENUM(
      'new',
      'in_progress',
      'on_pause',
      'review',
      'completed',
      'archived'
    ),
    defaultValue: 'new',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date',
  },
  deadline: {
    type: DataTypes.DATEONLY,
  },
  budgetPlan: {
    type: DataTypes.DECIMAL(12, 2),
    field: 'budget_plan',
  },
  budgetFact: {
    type: DataTypes.DECIMAL(12, 2),
    field: 'budget_fact',
    defaultValue: 0,
  },
  repoUrl: {
    type: DataTypes.STRING,
    field: 'repo_url',
  },
  stagingUrl: {
    type: DataTypes.STRING,
    field: 'staging_url',
  },
  productionUrl: {
    type: DataTypes.STRING,
    field: 'production_url',
  },
  figmaUrl: {
    type: DataTypes.STRING,
    field: 'figma_url',
  },
  stages: {
    type: DataTypes.JSONB,
    defaultValue: [
      { id: 1, name: 'Дизайн', done: false },
      { id: 2, name: 'Вёрстка', done: false },
      { id: 3, name: 'Разработка', done: false },
      { id: 4, name: 'Тестирование', done: false },
      { id: 5, name: 'Сдача', done: false },
    ],
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'projects',
  underscored: true,
});

module.exports = Project;