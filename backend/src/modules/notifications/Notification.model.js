// backend/models/Notification.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('new_memory', 'announcement', 'magic_link', 'approval', 'system'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  action_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  is_read: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'notifications',
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

module.exports = Notification;
