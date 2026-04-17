const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WebhookDelivery = sequelize.define('WebhookDelivery', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    webhookId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'webhook_id',
    },
    event: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSONB,
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      field: 'response_status',
    },
    responseBody: {
      type: DataTypes.TEXT,
      field: 'response_body',
    },
    error: {
      type: DataTypes.TEXT,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      field: 'delivered_at',
    },
  }, {
    tableName: 'webhook_deliveries',
    underscored: true,
    timestamps: true,
  });

  return WebhookDelivery;
};