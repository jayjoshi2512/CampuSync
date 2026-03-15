require('dotenv').config();
const { sequelize } = require('./config/database');
require('./models'); // Loads associations
const Memory = require('./models/Memory');

async function test() {
  await sequelize.authenticate();
  try {
    const mems = await Memory.findAll({ where: { organization_id: 2, is_active: 1 } });
    console.log("Found raw mems:", mems.length);
    console.log(mems.map(m => m.toJSON()));
  } catch(e) { console.error(e) }
  process.exit();
}
test();
