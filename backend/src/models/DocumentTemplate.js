const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DocumentTemplate = sequelize.define('DocumentTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('contract', 'invoice', 'act', 'report'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  }, {
    tableName: 'document_templates',
    underscored: true,
    timestamps: true,
  });

  return DocumentTemplate;
};