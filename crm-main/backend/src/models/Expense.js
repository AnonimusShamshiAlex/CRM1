const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'salary',
      'contractor',
      'hosting',
      'advertising',
      'other'
    ),
    allowNull: false,
  },
  projectId: {
    type: DataTypes.UUID,
    field: 'project_id',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  isPeriodic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_periodic',
  },
  periodicity: {
    type: DataTypes.ENUM('monthly', 'yearly'),
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'expenses',
  underscored: true,
});

module.exports = Expense;