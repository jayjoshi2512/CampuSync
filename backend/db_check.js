const { sequelize } = require('./config/database');
const User = require('./models/User');
const Memory = require('./models/Memory');

async function run() {
  await sequelize.authenticate();
  const users = await User.findAll({ limit: 5 });
  const mems = await Memory.findAll({ limit: 5 });
  console.log("USERS:", users.map(u => ({ id: u.id, org: u.organization_id, active: u.is_active })));
  console.log("MEMS:", mems.map(m => ({ id: m.id, org: m.organization_id, active: m.is_active, user: m.uploaded_by })));
  process.exit();
}
run();
