const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pipeline = sequelize.define(
  "Pipeline",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_default",
    },
    createdById: {
      type: DataTypes.UUID,
      field: "created_by_id",
    },
  },
  {
    tableName: "pipelines",
    underscored: true,
  },
);

module.exports = Pipeline;
