// backend/models/AuditLog.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

// NOTE: AuditLog does NOT have defaultScope filter on is_active
// Audit logs are never soft-deleted by the app
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  actor_type: {
    type: DataTypes.ENUM('super_admin', 'admin', 'user', 'system'),
    allowNull: false,
  },
  actor_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  target_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  target_id: {
    type: DataTypes.INTEGER.UNSIGNED,
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
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  // NO defaultScope on is_active — audit logs are always visible
  indexes: [
    { fields: ['actor_type', 'actor_id'], name: 'idx_actor' },
    { fields: ['action'], name: 'idx_action' },
    { fields: ['created_at'], name: 'idx_created' },
  ],
});

module.exports = AuditLog;
