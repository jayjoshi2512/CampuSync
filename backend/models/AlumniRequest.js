const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlumniRequest = sequelize.define('AlumniRequest', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    organization_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
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
    branch: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    batch_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    linkedin_url: {
        type: DataTypes.STRING(512),
        allowNull: true,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
    },
    rejection_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    reviewed_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'alumni_requests',
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
        { fields: [ 'organization_id' ] },
        { fields: [ 'email' ] },
        { fields: [ 'status' ] },
        { fields: [ 'user_id' ] },
    ],
});

module.exports = AlumniRequest;
