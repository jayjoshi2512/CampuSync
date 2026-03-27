// backend/models/Memory.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Memory = sequelize.define('Memory', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  organization_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  uploaded_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  media_type: {
    type: DataTypes.ENUM('photo', 'video'),
    allowNull: false,
  },
  cloudinary_url: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  public_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  thumbnail_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  width: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: true,
  },
  height: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: true,
  },
  duration_sec: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: true,
  },
  file_size_mb: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: true,
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  album: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'General',
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
  },
  is_flagged: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'memories',
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

module.exports = Memory;
