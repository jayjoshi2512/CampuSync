// backend/controllers/profile.js
const User = require('../models/User');
const Organization = require('../models/Organization');
const Card = require('../models/Card');
const { uploadStream, deleteAsset } = require('../utils/cloudinaryHelpers');
const { logger } = require('../config/database');

/**
 * GET /api/user/profile
 */
async function getProfile(req, res) {
  try {
    const user = await User.findByPk(req.actor.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const org = await Organization.findByPk(user.organization_id, {
      attributes: ['id', 'name', 'slug', 'brand_color', 'brand_color_rgb', 'logo_url'],
    });

    const userData = user.toJSON();
    const has_password = !!userData.password_hash;
    delete userData.password_hash;

    res.json({ user: userData, organization: org, has_password });
  } catch (err) {
    logger.error('getProfile error:', err.message);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
}

/**
 * PATCH /api/user/profile
 */
async function updateProfile(req, res) {
  try {
    const user = await User.findByPk(req.actor.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updates = {};
    const allowedFields = ['name', 'bio', 'linkedin_url', 'instagram_url', 'github_url', 'twitter_url', 'website_url'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Handle password setting (for first-time users)
    if (req.body.password && !user.password_hash) {
      updates.password_hash = req.body.password; // Hook will hash it
    }

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar
      if (user.avatar_public_id) {
        deleteAsset(user.avatar_public_id).catch(() => {});
      }

      const result = await uploadStream(req.file.buffer, {
        folder: `org_${user.organization_id}/avatars`,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      updates.avatar_url = result.secure_url;
      updates.avatar_public_id = result.public_id;
    }

    await user.update(updates);

    // Also update card front_data_json if name changed
    if (updates.name) {
      const card = await Card.findOne({ where: { user_id: user.id } });
      if (card && card.front_data_json) {
        const frontData = typeof card.front_data_json === 'string'
          ? JSON.parse(card.front_data_json)
          : card.front_data_json;
        frontData.name = updates.name;
        await card.update({ front_data_json: frontData });
      }
    }

    const updated = await User.findByPk(req.actor.id, {
      attributes: { exclude: ['password_hash'] },
    });

    res.json({ message: 'Profile updated.', user: updated });
  } catch (err) {
    logger.error('updateProfile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}

module.exports = { getProfile, updateProfile };
