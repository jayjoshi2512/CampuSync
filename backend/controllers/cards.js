// backend/controllers/cards.js
const Card = require('../models/Card');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateCardDownloadUrl } = require('../utils/cloudinaryHelpers');
const { logger } = require('../config/database');

/**
 * GET /api/cards/mine
 */
async function getMyCard(req, res) {
  try {
    const card = await Card.findOne({
      where: { user_id: req.actor.id },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'roll_number', 'branch', 'batch_year', 'avatar_url', 'bio', 'linkedin_url', 'instagram_url'],
      }],
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found. Contact your administrator.' });
    }

    res.json({ card });
  } catch (err) {
    logger.error('getMyCard error:', err.message);
    res.status(500).json({ error: 'Failed to load card.' });
  }
}

/**
 * PATCH /api/cards/mine/share-toggle
 */
async function toggleShare(req, res) {
  try {
    const card = await Card.findOne({ where: { user_id: req.actor.id } });
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    await card.update({ share_enabled: card.share_enabled ? 0 : 1 });
    res.json({ message: `Card sharing ${card.share_enabled ? 'enabled' : 'disabled'}.`, share_enabled: card.share_enabled });
  } catch (err) {
    logger.error('toggleShare error:', err.message);
    res.status(500).json({ error: 'Failed to update sharing.' });
  }
}

/**
 * GET /api/cards/share/:slug (PUBLIC)
 */
async function getPublicCard(req, res) {
  try {
    const { slug } = req.params;
    const card = await Card.findOne({
      where: { share_slug: slug },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    if (!card.share_enabled) {
      return res.status(403).json({ error: 'This card is private.' });
    }

    const user = await User.findByPk(card.user_id, {
      attributes: ['name', 'branch', 'batch_year', 'avatar_url', 'bio', 'linkedin_url', 'instagram_url', 'organization_id'],
    });

    const org = await Organization.findByPk(user?.organization_id, {
      attributes: ['name', 'logo_url', 'brand_color', 'brand_color_rgb'],
    });

    res.json({
      card: {
        template_id: card.template_id,
        front_data_json: card.front_data_json,
        back_image_url: card.back_image_url,
        scan_count: card.scan_count,
      },
      user: user ? {
        name: user.name,
        branch: user.branch,
        batch_year: user.batch_year,
        avatar_url: user.avatar_url,
        bio: user.bio,
        linkedin_url: user.linkedin_url,
        instagram_url: user.instagram_url,
      } : null,
      organization: org ? {
        name: org.name,
        logo_url: org.logo_url,
        brand_color: org.brand_color,
        brand_color_rgb: org.brand_color_rgb,
      } : null,
    });
  } catch (err) {
    logger.error('getPublicCard error:', err.message);
    res.status(500).json({ error: 'Failed to load card.' });
  }
}

/**
 * POST /api/cards/mine/download
 */
async function downloadCard(req, res) {
  try {
    const card = await Card.findOne({ where: { user_id: req.actor.id } });
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    // If download URL exists and is recent, return it
    if (card.card_download_url) {
      return res.json({ download_url: card.card_download_url });
    }

    // For now, generate a basic download URL from the card's data
    // Full Puppeteer rendering would happen here in production
    if (card.card_download_public_id) {
      const downloadUrl = generateCardDownloadUrl(card.card_download_public_id);
      return res.json({ download_url: downloadUrl });
    }

    res.status(404).json({
      error: 'Card download not yet generated. This feature requires server-side rendering setup.',
      hint: 'The card will be rendered and available for download once the system administrator configures the card rendering service.',
    });
  } catch (err) {
    logger.error('downloadCard error:', err.message);
    res.status(500).json({ error: 'Failed to generate download.' });
  }
}

module.exports = { getMyCard, toggleShare, getPublicCard, downloadCard };
