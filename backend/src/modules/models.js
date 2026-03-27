// backend/models/index.js
const { sequelize } = require('../../config/database');
const { DataTypes } = require('sequelize');

// Import models
const SuperAdmin = require('./superadmin/SuperAdmin.model.js');
const Organization = require('./organizations/Organization.model.js');
const OrgRegistration = require('./organizations/OrgRegistration.model.js');
const Admin = require('./admin/Admin.model.js');
const User = require('./users/User.model.js');
const Card = require('./cards/Card.model.js');
const Memory = require('./memories/Memory.model.js');
const MemoryReaction = require('./memories/MemoryReaction.model.js');
const Notification = require('./notifications/Notification.model.js');
const Payment = require('./billing/Payment.model.js');
const AuditLog = require('./admin/AuditLog.model.js');
const CardScanEvent = require('./cards/CardScanEvent.model.js');
const AlumniRequest = require('./alumni/AlumniRequest.model.js');

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

