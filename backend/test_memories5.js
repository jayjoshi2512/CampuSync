require('dotenv').config();
const { sequelize } = require('./config/database');
require('./models'); // Loads associations
const Memory = require('./models/Memory');
const User = require('./models/User');
const MemoryReaction = require('./models/MemoryReaction');
const { cursorPaginate } = require('./utils/pagination');

async function test() {
  await sequelize.authenticate();
  try {
    const where = { organization_id: 2, is_active: 1 };
    const r = await cursorPaginate(Memory, where, null, 20, [['id', 'DESC']], {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'avatar_url'], required: false },
        { model: MemoryReaction, attributes: ['id', 'emoji', 'user_id'], required: false },
      ],
    });
    console.log("Found paginated:", r.items.length);
  } catch(e) { console.error(e) }
  process.exit();
}
test();
