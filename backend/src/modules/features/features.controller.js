// backend/src/modules/features/features.controller.js
const { Organization, User } = require('../models');
const { logger } = require('../../../config/database');

async function getFeatures(req, res) {
    try {
        const org = await Organization.findById(req.actor.org);
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json({ features: org.features_data || {} });
    } catch (err) {
        logger.error('getFeatures error:', err.message);
        res.status(500).json({ error: 'Failed to get features' });
    }
}

async function updateFeatures(req, res) {
    try {
        const org = await Organization.findById(req.actor.org);
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        org.features_data = { ...(org.features_data || {}), ...req.body };
        await org.save();
        res.json({ features: org.features_data });
    } catch (err) {
        logger.error('updateFeatures error:', err.message);
        res.status(500).json({ error: 'Failed to update features' });
    }
}

async function getDirectory(req, res) {
    try {
        const users = await User.find({ organization_id: req.actor.org, is_active: true })
            .select('_id name email avatar_url branch batch_year role linkedin_url bio')
            .lean();
        res.json({ directory: users });
    } catch (err) {
        logger.error('getDirectory error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve directory' });
    }
}

module.exports = { getFeatures, updateFeatures, getDirectory };
