require('dotenv').config();
const { sequelize } = require('./config/database');
require('./models'); // Loads associations
const Memory = require('./models/Memory');
const User = require('./models/User');

async function test() {
  await sequelize.authenticate();
  try {
    const where = { organization_id: 2, is_active: 1 };
    const r1 = await Memory.findAll({ where, include: [{ model: User, as: 'uploader', required: false }] });
    console.log("With required: false", r1.length);
  } catch(e) { console.error(e) }
  process.exit();
}
test();
