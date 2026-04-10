const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'director', 'head_of_sales', 'manager', 'executor'),
    defaultValue: 'executor',
  },
  position: {
    type: DataTypes.STRING(100),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  employeeType: {
    type: DataTypes.ENUM('staff', 'contractor', 'freelancer'),
    defaultValue: 'staff',
    field: 'employee_type',
  },
  rateType: {
    type: DataTypes.ENUM('hourly', 'fixed'),
    field: 'rate_type',
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  avatar: {
    type: DataTypes.STRING,
  },
  telegramChatId: {
    type: DataTypes.STRING,
    field: 'telegram_chat_id',
  },
  googleRefreshToken: {
    type: DataTypes.TEXT,
    field: 'google_refresh_token',
  },
  // Воронки продаж, доступные менеджеру
  assignedPipelineIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'assigned_pipeline_ids',
  },
  // Планы продаж
  salesPlanMonth: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'sales_plan_month',
  },
  salesPlanWeek: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'sales_plan_week',
  },
  salesPlanDay: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'sales_plan_day',
  },
  // Настройки IP-телефонии
  sipLogin: {
    type: DataTypes.STRING(100),
    field: 'sip_login',
  },
  sipPassword: {
    type: DataTypes.STRING(100),
    field: 'sip_password',
  },
  isSuperAdmin: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  field: 'is_super_admin',
},
}, {
  tableName: 'users',
  underscored: true,
});

module.exports = User;