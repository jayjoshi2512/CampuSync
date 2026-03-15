// backend/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
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
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  roll_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  branch: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  batch_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  avatar_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  linkedin_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  instagram_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  bio: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('student', 'alumni'),
    defaultValue: 'student',
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    where: { is_active: 1 },
  },
  scopes: {
    withInactive: { where: {} },
  },
  indexes: [
    {
      unique: true,
      fields: ['organization_id', 'email'],
      name: 'uq_user_org_email',
    },
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && user.password_hash && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
  },
});

/**
 * Validate a raw password against the stored bcrypt hash
 */
User.prototype.validatePassword = async function (rawPassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(rawPassword, this.password_hash);
};

module.exports = User;
