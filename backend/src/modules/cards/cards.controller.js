// backend/src/modules/cards/cards.controller.js
const { Card, User, Organization } = require('../models');
const { generateCardDownloadUrl } = require('../../../utils/cloudinaryHelpers');
const { logger } = require('../../../config/database');

async function getMyCard(req, res) {
    try {
        const card = await Card.findOne({ user_id: req.actor.id, is_active: true }).lean();
        if (!card) return res.status(404).json({ error: 'Card not found. Contact your administrator.' });

        const user = await User.findById(card.user_id).select('_id name email roll_number branch batch_year avatar_url bio linkedin_url instagram_url').lean();
        res.json({ card: { ...card, User: user } });
    } catch (err) {
        logger.error('getMyCard error:', err.message);
        res.status(500).json({ error: 'Failed to load card.' });
    }
}

async function toggleShare(req, res) {
    try {
        const card = await Card.findOne({ user_id: req.actor.id, is_active: true });
        if (!card) return res.status(404).json({ error: 'Card not found.' });

        card.share_enabled = !card.share_enabled;
        await card.save();
        res.json({ message: `Card sharing ${card.share_enabled ? 'enabled' : 'disabled'}.`, share_enabled: card.share_enabled });
    } catch (err) {
        logger.error('toggleShare error:', err.message);
        res.status(500).json({ error: 'Failed to update sharing.' });
    }
}

async function getPublicCard(req, res) {
    try {
        const { slug } = req.params;
        const card = await Card.findOne({ share_slug: slug, is_active: true }).lean();
        if (!card) return res.status(404).json({ error: 'Card not found.' });
        if (!card.share_enabled) return res.status(403).json({ error: 'This card is private.' });

        const user = await User.findById(card.user_id).select('name branch batch_year avatar_url bio linkedin_url instagram_url organization_id').lean();
        const org = await Organization.findById(user?.organization_id).select('name logo_url brand_color brand_color_rgb').lean();

        res.json({
            card: { template_id: card.template_id, front_data_json: card.front_data_json, back_image_url: card.back_image_url, scan_count: card.scan_count },
            user: user ? { name: user.name, branch: user.branch, batch_year: user.batch_year, avatar_url: user.avatar_url, bio: user.bio, linkedin_url: user.linkedin_url, instagram_url: user.instagram_url } : null,
            organization: org ? { name: org.name, logo_url: org.logo_url, brand_color: org.brand_color, brand_color_rgb: org.brand_color_rgb } : null,
        });
    } catch (err) {
        logger.error('getPublicCard error:', err.message);
        res.status(500).json({ error: 'Failed to load card.' });
    }
}

async function downloadCard(req, res) {
    try {
        const card = await Card.findOne({ user_id: req.actor.id, is_active: true });
        if (!card) return res.status(404).json({ error: 'Card not found.' });

        if (card.card_download_url) return res.json({ download_url: card.card_download_url });

        if (card.card_download_public_id) {
            const downloadUrl = generateCardDownloadUrl(card.card_download_public_id);
            return res.json({ download_url: downloadUrl });
        }

        res.status(404).json({ error: 'Card download not yet generated. This feature requires server-side rendering setup.', hint: 'The card will be rendered and available for download once the system administrator configures the card rendering service.' });
    } catch (err) {
        logger.error('downloadCard error:', err.message);
        res.status(500).json({ error: 'Failed to generate download.' });
    }
}

module.exports = { getMyCard, toggleShare, getPublicCard, downloadCard };
