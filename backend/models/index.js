// backend/models/index.js
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import models
const SuperAdmin = require('./SuperAdmin');
const Organization = require('./Organization');
const OrgRegistration = require('./OrgRegistration');
const Admin = require('./Admin');
const User = require('./User');
const Card = require('./Card');
const Memory = require('./Memory');
const MemoryReaction = require('./MemoryReaction');
const Notification = require('./Notification');
const Payment = require('./Payment');
const AuditLog = require('./AuditLog');
const CardScanEvent = require('./CardScanEvent');
const AlumniRequest = require('./AlumniRequest');

// ============================================
// ASSOCIATIONS
// ============================================

// Organization ↔ SuperAdmin (approved_by)
Organization.belongsTo(SuperAdmin, { as: 'approver', foreignKey: 'approved_by' });

// OrgRegistration ↔ Organization
OrgRegistration.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(OrgRegistration, { foreignKey: 'organization_id' });

// Admin ↔ Organization
Admin.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(Admin, { foreignKey: 'organization_id' });

// User ↔ Organization
User.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(User, { foreignKey: 'organization_id' });

// Card ↔ User
Card.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Card, { foreignKey: 'user_id' });

// Memory ↔ Organization
Memory.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(Memory, { foreignKey: 'organization_id' });

// Memory ↔ User (uploader)
Memory.belongsTo(User, { as: 'uploader', foreignKey: 'uploaded_by' });
User.hasMany(Memory, { foreignKey: 'uploaded_by' });

// MemoryReaction ↔ Memory
MemoryReaction.belongsTo(Memory, { foreignKey: 'memory_id' });
Memory.hasMany(MemoryReaction, { foreignKey: 'memory_id' });

// MemoryReaction ↔ User
MemoryReaction.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(MemoryReaction, { foreignKey: 'user_id', as: 'reactions' });

// Notification ↔ User
Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

// Payment ↔ Organization
Payment.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(Payment, { foreignKey: 'organization_id' });

// CardScanEvent ↔ Card
CardScanEvent.belongsTo(Card, { foreignKey: 'card_id' });
Card.hasMany(CardScanEvent, { foreignKey: 'card_id' });

// AlumniRequest associations
AlumniRequest.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(AlumniRequest, { foreignKey: 'organization_id' });
AlumniRequest.belongsTo(User, { foreignKey: 'user_id', as: 'requester' });
User.hasMany(AlumniRequest, { foreignKey: 'user_id', as: 'alumniRequests' });
AlumniRequest.belongsTo(Admin, { foreignKey: 'reviewed_by', as: 'reviewer' });
Admin.hasMany(AlumniRequest, { foreignKey: 'reviewed_by', as: 'reviewedAlumniRequests' });

module.exports = {
    sequelize,
    SuperAdmin,
    Organization,
    OrgRegistration,
    Admin,
    User,
    Card,
    Memory,
    MemoryReaction,
    Notification,
    Payment,
    AuditLog,
    CardScanEvent,
    AlumniRequest,
};
