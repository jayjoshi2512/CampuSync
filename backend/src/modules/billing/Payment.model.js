// backend/models/Payment.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  organization_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  razorpay_payment_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  razorpay_subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  razorpay_order_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  amount_paise: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('created', 'captured', 'failed', 'refunded'),
    allowNull: false,
  },
  plan: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  invoice_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  defaultScope: {
    where: { is_active: 1 },
  },
  scopes: {
    withInactive: { where: {} },
  },
});

module.exports = Payment;
