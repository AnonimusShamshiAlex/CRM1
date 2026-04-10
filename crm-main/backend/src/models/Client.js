const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('lead', 'client'),
    defaultValue: 'lead',
  },
  // Поле совместимости — используется если клиент не привязан к воронке
  stage: {
    type: DataTypes.STRING(50),
    defaultValue: 'new',
  },
  // Привязка к воронке продаж
  pipelineId: {
    type: DataTypes.UUID,
    field: 'pipeline_id',
  },
  pipelineStageId: {
    type: DataTypes.UUID,
    field: 'pipeline_stage_id',
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING(200),
    field: 'company_name',
  },
  email: {
    type: DataTypes.STRING(150),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  telegram: {
    type: DataTypes.STRING(100),
  },
  whatsapp: {
    type: DataTypes.STRING(20),
  },
  inn: {
    type: DataTypes.STRING(12),
  },
  legalName: {
    type: DataTypes.STRING(200),
    field: 'legal_name',
  },
  legalAddress: {
    type: DataTypes.TEXT,
    field: 'legal_address',
  },
  source: {
    type: DataTypes.STRING(100),
    comment: 'Источник лида: website, referral, cold_call, social, utm, other или кастомный',
  },
  utmSource: {
    type: DataTypes.STRING(100),
    field: 'utm_source',
  },
  // Теги источника лида (#inst, #fb, #olx и т.д.)
  leadTags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'lead_tags',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  category: {
    type: DataTypes.STRING(50),
  },
  managerId: {
    type: DataTypes.UUID,
    field: 'manager_id',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  firstContactDate: {
    type: DataTypes.DATEONLY,
    field: 'first_contact_date',
    defaultValue: DataTypes.NOW,
  },
  stageOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'stage_order',
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Кастомные поля карточки
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'custom_fields',
  },
  // Сумма сделки для плана-факта
  dealAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'deal_amount',
  },
}, {
  tableName: 'clients',
  underscored: true,
});

module.exports = Client;