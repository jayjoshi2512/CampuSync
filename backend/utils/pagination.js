// backend/utils/pagination.js

/**
 * Cursor-based pagination for Sequelize models
 * @param {object} Model - Sequelize model
 * @param {object} where - WHERE conditions
 * @param {string|null} cursor - Base64-encoded cursor (last item ID)
 * @param {number} limit - Items per page
 * @param {Array} order - Sequelize order array (default: [['id', 'DESC']])
 * @param {object} options - Additional findAll options (include, attributes, etc.)
 * @returns {Promise<{ items: Array, nextCursor: string|null, hasMore: boolean }>}
 */
async function cursorPaginate(Model, where = {}, cursor = null, limit = 20, order = [['id', 'DESC']], options = {}) {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  // Decode cursor — it's a base64-encoded ID
  if (cursor) {
    try {
      const decodedId = parseInt(Buffer.from(cursor, 'base64').toString('utf-8'), 10);
      if (!isNaN(decodedId)) {
        const { Op } = require('sequelize');
        // For DESC order, get items with ID less than cursor
        // For ASC order, get items with ID greater than cursor
        const isDesc = order[0] && order[0][1] && order[0][1].toUpperCase() === 'DESC';
        where.id = { [isDesc ? Op.lt : Op.gt]: decodedId };
      }
    } catch (e) {
      // Invalid cursor — ignore and start from beginning
    }
  }

  const items = await Model.findAll({
    where,
    order,
    limit: parsedLimit + 1, // Fetch one extra to determine hasMore
    ...options,
  });

  const hasMore = items.length > parsedLimit;
  if (hasMore) {
    items.pop(); // Remove the extra item
  }

  const nextCursor = hasMore && items.length > 0
    ? Buffer.from(String(items[items.length - 1].id)).toString('base64')
    : null;

  return { items, nextCursor, hasMore };
}

module.exports = { cursorPaginate };
