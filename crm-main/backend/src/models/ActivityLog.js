const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING(50),
  },
  entityId: {
    type: DataTypes.UUID,
    field: 'entity_id',
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  ip: {
    type: DataTypes.STRING(45),
  },
}, {
  tableName: 'activity_logs',
  underscored: true,
});

module.exports = ActivityLog;