// backend/models/OrgRegistration.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const OrgRegistration = sequelize.define('OrgRegistration', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  organization_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
  },
  contact_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  institution_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  submitted_data_json: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  email_verified: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
  },
  otp_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('email_pending', 'pending', 'approved', 'rejected'),
    defaultValue: 'email_pending',
  },
  super_admin_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'organization_registrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    where: { is_active: 1 },
  },
  scopes: {
    withInactive: { where: {} },
  },
});

/**
 * Find all pending registrations
 */
OrgRegistration.findPending = function () {
  return this.findAll({
    where: { status: 'pending' },
    order: [['created_at', 'DESC']],
  });
};

module.exports = OrgRegistration;
