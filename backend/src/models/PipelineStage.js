const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PipelineStage = sequelize.define('PipelineStage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pipelineId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'pipeline_id',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#6366f1',
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_default',
  },
}, {
  tableName: 'pipeline_stages',
  underscored: true,
});

module.exports = PipelineStage;
