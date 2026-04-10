const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interaction = sequelize.define('Interaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id',
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: true,  // webhook от провайдера может не иметь автора
    field: 'author_id',
  },
  type: {
    type: DataTypes.ENUM('call', 'meeting', 'email', 'comment'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // IP-телефония: URL записи разговора
  recordingUrl: {
    type: DataTypes.STRING,
    field: 'recording_url',
  },
  // Длительность звонка в секундах
  callDuration: {
    type: DataTypes.INTEGER,
    field: 'call_duration',
  },
  // Статус звонка
  callStatus: {
    type: DataTypes.ENUM('completed', 'missed', 'busy', 'no_answer'),
    field: 'call_status',
  },
  // Внешний ID звонка от провайдера телефонии
  externalCallId: {
    type: DataTypes.STRING(100),
    field: 'external_call_id',
  },
}, {
  tableName: 'interactions',
  underscored: true,
});

module.exports = Interaction;