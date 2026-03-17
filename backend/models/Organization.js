// backend/models/Organization.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('university', 'school', 'student_group', 'corporate'),
    allowNull: false,
  },

  // Registration & Approval
  contact_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  institution_website: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  registration_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  email_verified: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'suspended', 'rejected', 'trial'),
    defaultValue: 'pending',
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approved_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  password_set: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
  },

  // Branding
  selected_card_template: {
    type: DataTypes.STRING(50),
    defaultValue: 'tmpl_midnight',
  },
  brand_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6366F1',
  },
  brand_color_rgb: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  logo_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  logo_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  card_back_image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  card_back_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  custom_domain: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  features_data: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // Billing (Razorpay)
  razorpay_customer_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  razorpay_subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  plan: {
    type: DataTypes.ENUM('trial', 'starter', 'growth', 'enterprise'),
    defaultValue: 'trial',
  },
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  billing_cycle_anchor: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // Limits & Usage
  card_quota: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 100,
  },
  storage_limit_gb: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 2.00,
  },
  storage_used_gb: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0.0000,
  },

  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'organizations',
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
    beforeUpdate: (org) => {
      // Recompute brand_color_rgb when brand_color changes
      if (org.changed('brand_color') && org.brand_color) {
        const hex = org.brand_color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        org.brand_color_rgb = `${r},${g},${b}`;
      }
    },
    beforeCreate: (org) => {
      if (org.brand_color) {
        const hex = org.brand_color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        org.brand_color_rgb = `${r},${g},${b}`;
      }
    },
  },
});

module.exports = Organization;
