// backend/utils/cloudinaryHelpers.js
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const { logger } = require('../config/database');

/**
 * Upload a buffer to Cloudinary via stream
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadStream(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error.message);
          return reject(error);
        }
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete an asset from Cloudinary by public_id
 * @param {string} publicId
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 * @returns {Promise<object>}
 */
async function deleteAsset(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    logger.info(`Cloudinary asset deleted: ${publicId} (${result.result})`);
    return result;
  } catch (err) {
    logger.error(`Cloudinary delete error for ${publicId}:`, err.message);
    throw err;
  }
}

/**
 * Get Cloudinary usage report (storage, bandwidth, etc.)
 * @returns {Promise<object>}
 */
async function getUsageReport() {
  try {
    const usage = await cloudinary.api.usage();
    return {
      storage_bytes: usage.storage?.usage || 0,
      storage_gb: ((usage.storage?.usage || 0) / (1024 * 1024 * 1024)).toFixed(4),
      bandwidth_bytes: usage.bandwidth?.usage || 0,
      bandwidth_gb: ((usage.bandwidth?.usage || 0) / (1024 * 1024 * 1024)).toFixed(4),
      transformations: usage.transformations?.usage || 0,
      objects: usage.objects?.usage || 0,
      plan: usage.plan || 'unknown',
    };
  } catch (err) {
    logger.error('Cloudinary usage report error:', err.message);
    throw err;
  }
}

/**
 * Generate a download URL for a card image
 * @param {string} publicId
 * @returns {string} Cloudinary URL for download
 */
function generateCardDownloadUrl(publicId) {
  return cloudinary.url(publicId, {
    flags: 'attachment',
    format: 'png',
    quality: 'auto:best',
  });
}

module.exports = {
  uploadStream,
  deleteAsset,
  getUsageReport,
  generateCardDownloadUrl,
};
