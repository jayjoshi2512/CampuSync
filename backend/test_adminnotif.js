require('dotenv').config();
const axios = require('axios');
const { signAdminToken, signUserToken } = require('./utils/jwtFactory');

async function test() {
  // 1. Test admin JWT
  const adminToken = signAdminToken({ id: 1, organization_id: 2 });
  try {
    const r = await axios.get('http://localhost:5000/api/notifications', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log("[PASS] Admin JWT -> status", r.status, "items:", r.data.notifications.length);
  } catch(e) {
    console.error("[FAIL] Admin JWT ->", e.response?.status, e.response?.data);
  }
  // 2. Test user JWT
  const userToken = signUserToken({ id: 5, organization_id: 2 });
  try {
    const r = await axios.get('http://localhost:5000/api/notifications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log("[PASS] User JWT -> status", r.status, "items:", r.data.notifications.length);
  } catch(e) {
    console.error("[FAIL] User JWT ->", e.response?.status, e.response?.data);
  }
}
test();
