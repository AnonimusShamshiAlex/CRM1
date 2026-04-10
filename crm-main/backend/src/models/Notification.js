const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
  },
  link: {
    type: DataTypes.STRING,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
  payload: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'notifications',
  underscored: true,
});

module.exports = Notification;