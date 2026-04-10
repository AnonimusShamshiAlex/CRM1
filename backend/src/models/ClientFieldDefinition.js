const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClientFieldDefinition = sequelize.define('ClientFieldDefinition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  fieldKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'field_key',
  },
  fieldType: {
    type: DataTypes.ENUM('text', 'number', 'date', 'select', 'checkbox'),
    defaultValue: 'text',
    field: 'field_type',
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  options: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Список вариантов для поля типа select',
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'client_field_definitions',
  underscored: true,
});

module.exports = ClientFieldDefinition;
