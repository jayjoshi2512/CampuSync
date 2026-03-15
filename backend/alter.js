require('dotenv').config();
const { sequelize } = require('./config/database');

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE organizations ADD COLUMN card_back_image_url VARCHAR(512);').catch(e => console.log(e.message));
    await sequelize.query('ALTER TABLE organizations ADD COLUMN card_back_public_id VARCHAR(255);').catch(e => console.log(e.message));
    console.log('Migration complete');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
