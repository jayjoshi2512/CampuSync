const axios = require('axios');
require('dotenv').config();
const { signUserToken } = require('./utils/jwtFactory');

async function test() {
  const token = signUserToken({ id: 5, organization_id: 2 });
  try {
    const res = await axios.get('http://localhost:5000/api/memories?limit=20', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Memory API Returned:", res.data.items.length, "items");
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
