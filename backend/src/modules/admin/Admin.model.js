// backend/models/Admin.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  organization_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('owner', 'co_admin'),
    defaultValue: 'owner',
  },
  onboarding_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  onboarding_token_expires_at: {
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
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    where: { is_active: 1 },
  },
  scopes: {
    withInactive: { where: {} },
  },
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password_hash && !admin.password_hash.startsWith('$2')) {
        admin.password_hash = await bcrypt.hash(admin.password_hash, 12);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password_hash') && admin.password_hash && !admin.password_hash.startsWith('$2')) {
        admin.password_hash = await bcrypt.hash(admin.password_hash, 12);
      }
    },
  },
});

/**
 * Validate a raw password against the stored bcrypt hash
 */
Admin.prototype.validatePassword = async function (rawPassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(rawPassword, this.password_hash);
};

module.exports = Admin;
