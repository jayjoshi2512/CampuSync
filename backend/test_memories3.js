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
    const r1 = await Memory.findAll({ where, include: [{ model: User, as: 'uploader' }] });
    console.log("With uploader include:", r1.length);
    const r2 = await Memory.findAll({ where, include: [{ model: MemoryReaction }] });
    console.log("With reaction include:", r2.length);
  } catch(e) { console.error(e) }
  process.exit();
}
test();
