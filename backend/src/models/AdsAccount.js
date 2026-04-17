const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdsAccount = sequelize.define('AdsAccount', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    platform: {
      type: DataTypes.ENUM('meta', 'google', 'yandex'),
      allowNull: false,
    },
    accountId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'account_id',
    },
    accountName: {
      type: DataTypes.STRING(200),
      field: 'account_name',
    },
    accessToken: {
      type: DataTypes.TEXT,
      field: 'access_token',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
    },
  }, {
    tableName: 'ads_accounts',
    underscored: true,
    timestamps: true,
  });

  return AdsAccount;
};