const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimeLog = sequelize.define('TimeLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'task_id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  seconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at',
  },
  endedAt: {
    type: DataTypes.DATE,
    field: 'ended_at',
  },
  comment: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'time_logs',
  underscored: true,
});

module.exports = TimeLog;