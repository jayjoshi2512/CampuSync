// backend/models/Card.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const Card = sequelize.define('Card', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true,
  },
  qr_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  qr_signed_token: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  template_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'tmpl_midnight',
  },
  front_data_json: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  back_image_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  back_image_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  card_download_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  card_download_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  share_slug: {
    type: DataTypes.STRING(32),
    allowNull: true,
    unique: true,
  },
  share_enabled: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
  },
  scan_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
  },
  last_scanned_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'cards',
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
    beforeValidate: (card) => {
      // Generate share_slug — 8-char random hex
      if (!card.share_slug) {
        card.share_slug = crypto.randomBytes(4).toString('hex');
      }
      // Generate qr_hash if not set
      if (!card.qr_hash) {
        card.qr_hash = crypto.randomBytes(32).toString('hex');
      }
    },
  },
});

module.exports = Card;
