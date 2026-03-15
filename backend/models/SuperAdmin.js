// backend/models/SuperAdmin.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const SuperAdmin = sequelize.define('SuperAdmin', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  current_otp_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'super_admins',
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
 * Verify a raw OTP against the stored bcrypt hash
 */
SuperAdmin.prototype.isOtpValid = async function (rawOtp) {
  if (!this.current_otp_hash) return false;
  if (this.otp_expires_at && new Date() > new Date(this.otp_expires_at)) return false;
  return bcrypt.compare(rawOtp, this.current_otp_hash);
};

module.exports = SuperAdmin;
