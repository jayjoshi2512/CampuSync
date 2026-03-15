// backend/models/CardScanEvent.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CardScanEvent = sequelize.define('CardScanEvent', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  card_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  scanned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'card_scan_events',
  timestamps: false,
  defaultScope: {
    where: { is_active: 1 },
  },
  scopes: {
    withInactive: { where: {} },
  },
});

module.exports = CardScanEvent;
