require('dotenv').config();
const { sequelize } = require('./config/database');
const Notification = require('./models/Notification');

async function test() {
  await sequelize.authenticate();
  try {
    const res = await Notification.create({
      user_id: 5,
      type: 'system',
      title: 'Welcome to the Platform',
      body: 'Your account has been setup.',
      action_url: '/portal',
    });
    console.log("Success! ID:", res.id);
  } catch(e) {
    console.error("FAIL:", e.message);
  }
  process.exit();
}
test();
