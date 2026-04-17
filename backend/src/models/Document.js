const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.UUID,
      field: 'client_id',
    },
    projectId: {
      type: DataTypes.UUID,
      field: 'project_id',
    },
    templateId: {
      type: DataTypes.UUID,
      field: 'template_id',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      field: 'file_url',
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'signed', 'cancelled'),
      defaultValue: 'draft',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
    },
  }, {
    tableName: 'documents',
    underscored: true,
    timestamps: true,
  });

  return Document;
};