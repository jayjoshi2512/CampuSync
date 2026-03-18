const Memory = require('../models/Memory');
const { Op } = require('sequelize');

const FREE_LIMITS = {
    imageCount: 5,
    videoCount: 2,
    imageSizeMb: 50,
    videoSizeMb: 200,
};

function monthRange () {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
}

async function checkMemoryUploadLimits (req, res, next) {
    try {
        if(!req.file) {
            return res.status(400).json({ error: 'File is required.' });
        }

        const isVideo = req.file.mimetype.startsWith('video');
        const mediaType = isVideo ? 'video' : 'photo';
        const fileSizeMb = req.file.size / (1024 * 1024);

        // Per-file size guard
        const maxSizeMb = isVideo ? FREE_LIMITS.videoSizeMb : FREE_LIMITS.imageSizeMb;
        if(fileSizeMb > maxSizeMb) {
            return res.status(413).json({
                error: `${ isVideo ? 'Video' : 'Image' } exceeds ${ maxSizeMb }MB limit for free plan.`,
                details: {
                    media_type: mediaType,
                    file_size_mb: Number(fileSizeMb.toFixed(2)),
                    limit_mb: maxSizeMb,
                },
            });
        }

        // Only enforce monthly quantity limits for free-plan orgs
        const plan = (req.org?.plan || 'free').toLowerCase();
        if(plan !== 'free') {
            return next();
        }

        const { start, end } = monthRange();
        const baseWhere = {
            organization_id: req.actor.org,
            uploaded_by: req.actor.id,
            is_active: 1,
            created_at: {
                [ Op.gte ]: start,
                [ Op.lt ]: end,
            },
        };

        const [ photoCount, videoCount ] = await Promise.all([
            Memory.count({ where: { ...baseWhere, media_type: 'photo' } }),
            Memory.count({ where: { ...baseWhere, media_type: 'video' } }),
        ]);

        if(!isVideo && photoCount >= FREE_LIMITS.imageCount) {
            return res.status(429).json({
                error: 'Monthly image upload limit reached for free plan.',
                details: {
                    image_count: photoCount,
                    image_limit: FREE_LIMITS.imageCount,
                    remaining_images: 0,
                },
            });
        }

        if(isVideo && videoCount >= FREE_LIMITS.videoCount) {
            return res.status(429).json({
                error: 'Monthly video upload limit reached for free plan.',
                details: {
                    video_count: videoCount,
                    video_limit: FREE_LIMITS.videoCount,
                    remaining_videos: 0,
                },
            });
        }

        req.uploadUsage = {
            plan,
            image_count: photoCount,
            video_count: videoCount,
            image_limit: FREE_LIMITS.imageCount,
            video_limit: FREE_LIMITS.videoCount,
            remaining_images: Math.max(0, FREE_LIMITS.imageCount - photoCount - (isVideo ? 0 : 1)),
            remaining_videos: Math.max(0, FREE_LIMITS.videoCount - videoCount - (isVideo ? 1 : 0)),
            image_size_limit_mb: FREE_LIMITS.imageSizeMb,
            video_size_limit_mb: FREE_LIMITS.videoSizeMb,
        };

        next();
    } catch(err) {
        return res.status(500).json({ error: 'Failed to enforce upload limits.' });
    }
}

module.exports = {
    checkMemoryUploadLimits,
    FREE_LIMITS,
};
