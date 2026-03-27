// backend/models/MemoryReaction.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const MemoryReaction = sequelize.define('MemoryReaction', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  memory_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  emoji: {
    type: DataTypes.ENUM('❤️', '🔥', '😂', '😮', '😢'),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'memory_reactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  defaultScope: {
    where: { is_active: 1 },
  },
  scopes: {
    withInactive: { where: {} },
  },
  indexes: [
    {
      unique: true,
      fields: ['memory_id', 'user_id', 'emoji'],
      name: 'uq_reaction',
    },
  ],
});

module.exports = MemoryReaction;
