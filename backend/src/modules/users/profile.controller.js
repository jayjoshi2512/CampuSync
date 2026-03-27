// backend/src/modules/users/profile.controller.js
const { User, Organization, Card } = require('../models');
const { uploadStream, deleteAsset } = require('../../../utils/cloudinaryHelpers');
const { logger } = require('../../../config/database');

async function getProfile(req, res) {
    try {
        const user = await User.findById(req.actor.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const org = await Organization.findById(user.organization_id).select('_id name slug brand_color brand_color_rgb logo_url');

        const userData = user.toJSON();
        const has_password = !!userData.password_hash;
        delete userData.password_hash;

        res.json({ user: userData, organization: org, has_password });
    } catch (err) {
        logger.error('getProfile error:', err.message);
        res.status(500).json({ error: 'Failed to load profile.' });
    }
}

async function updateProfile(req, res) {
    try {
        const user = await User.findById(req.actor.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const allowedFields = ['name', 'bio', 'linkedin_url', 'instagram_url', 'github_url', 'twitter_url', 'website_url'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) user[field] = req.body[field];
        }

        if (req.body.password && !user.password_hash) {
            user.password_hash = req.body.password; // pre-save hook will hash it
        }

        if (req.file) {
            if (user.avatar_public_id) deleteAsset(user.avatar_public_id).catch(() => {});
            const result = await uploadStream(req.file.buffer, {
                folder: `org_${user.organization_id}/avatars`,
                resource_type: 'image',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
            });
            user.avatar_url = result.secure_url;
            user.avatar_public_id = result.public_id;
        }

        await user.save();

        if (req.body.name) {
            const card = await Card.findOne({ user_id: user._id });
            if (card && card.front_data_json) {
                card.front_data_json = { ...card.front_data_json, name: req.body.name };
                await card.save();
            }
        }

        const updated = await User.findById(req.actor.id).select('-password_hash');
        res.json({ message: 'Profile updated.', user: updated });
    } catch (err) {
        logger.error('updateProfile error:', err.message);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
}

module.exports = { getProfile, updateProfile };
