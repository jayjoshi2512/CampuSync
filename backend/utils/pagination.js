// backend/utils/pagination.js
// Mongoose-compatible cursor-based pagination
// (replaces the old Sequelize cursorPaginate — kept for reference / legacy callers)
// NOTE: Most controllers now implement pagination inline.
// This utility is exported but callers should prefer inline Mongoose pagination.

async function cursorPaginate(Model, query = {}, cursor = null, limit = 20) {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    if (cursor) {
        try {
            query._id = { $lt: cursor };
        } catch (e) {
            // Invalid cursor — ignore and start from beginning
        }
    }

    const items = await Model.find(query).sort({ _id: -1 }).limit(parsedLimit + 1).lean();
    const hasMore = items.length > parsedLimit;
    if (hasMore) items.pop();

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id : null;
    return { items, nextCursor, hasMore };
}

module.exports = { cursorPaginate };
