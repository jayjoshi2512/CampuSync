// backend/src/utils/seedSuperAdmin.js
const { SuperAdmin } = require('../modules/models');
const { logger } = require('../../config/database');

async function seedSuperAdmin() {
    try {
        const count = await SuperAdmin.countDocuments();
        if (count === 0) {
            const email = process.env.SUPER_ADMIN_EMAIL || 'admin@campusync.com';
            
            await SuperAdmin.create({
                email,
                is_active: true
            });
            logger.info(`🌱 Seeded initial SuperAdmin: ${email}`);
        } else {
            logger.info(`✅ SuperAdmin already exists. Skipping seed.`);
        }
    } catch (err) {
        logger.error('Failed to seed SuperAdmin:', err.message);
    }
}

module.exports = seedSuperAdmin;
