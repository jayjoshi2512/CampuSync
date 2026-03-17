const Organization = require('../models/Organization');
const User = require('../models/User');
const { logger } = require('../config/database');

async function getFeatures(req, res) {
  try {
    const orgId = req.actor.org;
    const org = await Organization.findByPk(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    
    res.json({ features: org.features_data || {} });
  } catch (err) {
    logger.error('getFeatures error:', err.message);
    res.status(500).json({ error: 'Failed to get features' });
  }
}

async function updateFeatures(req, res) {
  try {
    const orgId = req.actor.org;
    const org = await Organization.findByPk(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    
    const currentFeatures = org.features_data || {};
    // Full merge instead of replacement allows adding single items
    const newFeatures = { ...currentFeatures, ...req.body };
    
    await org.update({ features_data: newFeatures });
    res.json({ features: org.features_data });
  } catch (err) {
    logger.error('updateFeatures error:', err.message);
    res.status(500).json({ error: 'Failed to update features' });
  }
}

async function getDirectory(req, res) {
  try {
    const orgId = req.actor.org;
    const users = await User.findAll({ 
      where: { organization_id: orgId, is_active: 1 },
      attributes: ['id', 'name', 'email', 'avatar_url', 'branch', 'batch_year', 'role', 'linkedin_url', 'bio']
    });
    res.json({ directory: users });
  } catch (err) {
    logger.error('getDirectory error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve directory' });
  }
}

module.exports = { getFeatures, updateFeatures, getDirectory };
