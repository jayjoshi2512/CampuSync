// backend/src/modules/models.js
// Central export for all Mongoose models — no Sequelize associations needed;
// relationships are expressed via ObjectId refs in each schema.

const SuperAdmin    = require('./superadmin/SuperAdmin.model.js');
const Organization  = require('./organizations/Organization.model.js');
const OrgRegistration = require('./organizations/OrgRegistration.model.js');
const Admin         = require('./admin/Admin.model.js');
const User          = require('./users/User.model.js');
const Card          = require('./cards/Card.model.js');
const Memory        = require('./memories/Memory.model.js');
const MemoryReaction = require('./memories/MemoryReaction.model.js');
const Notification  = require('./notifications/Notification.model.js');
const Payment       = require('./billing/Payment.model.js');
const AuditLog      = require('./admin/AuditLog.model.js');
const CardScanEvent = require('./cards/CardScanEvent.model.js');
const AlumniRequest = require('./alumni/AlumniRequest.model.js');

module.exports = {
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
