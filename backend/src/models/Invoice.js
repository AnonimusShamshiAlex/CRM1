const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id',
  },
  projectId: {
    type: DataTypes.UUID,
    field: 'project_id',
  },
  status: {
    type: DataTypes.ENUM(
      'draft',
      'sent',
      'partial',
      'paid',
      'overdue'
    ),
    defaultValue: 'draft',
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: [],
    // [{ name, qty, price, total }]
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  vatPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'vat_percent',
  },
  vatAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'vat_amount',
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'paid_amount',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    field: 'due_date',
  },
  paidAt: {
    type: DataTypes.DATEONLY,
    field: 'paid_at',
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'invoices',
  underscored: true,
});

module.exports = Invoice;