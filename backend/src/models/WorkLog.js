const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkLog = sequelize.define('WorkLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'project_id',
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'author_id',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'work_logs',
    underscored: true,
    timestamps: true,
  });

  return WorkLog;
};