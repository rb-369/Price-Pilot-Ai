const axios = require('axios');

async function test() {
  try {
    console.log('Logging in to https://price-pilot-ai.onrender.com/api/auth/login ...');
    const loginRes = await axios.post('https://price-pilot-ai.onrender.com/api/auth/login', {
      email: 'rb1@gmail.com',
      password: '12345678'
    }, { timeout: 25000 });
    
    const token = loginRes.data.token;
    console.log('Login successful! User:', loginRes.data.user?.name);
    
    const t0 = Date.now();
    console.log('Fetching competitor-prices/latest...');
    const compRes = await axios.get('https://price-pilot-ai.onrender.com/api/competitor-prices/latest', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000
    });
    console.log(`Competitor prices fetched in ${Date.now() - t0}ms, status: ${compRes.status}, count: ${compRes.data.length}`);
    if (compRes.data.length > 0) {
      console.log('First competitor price item:', JSON.stringify(compRes.data[0], null, 2));
    } else {
      console.log('Competitor prices returned empty array []');
    }

    const t1 = Date.now();
    console.log('Fetching products...');
    const prodRes = await axios.get('https://price-pilot-ai.onrender.com/api/products?page=1&limit=20', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000
    });
    const prods = prodRes.data.data || prodRes.data;
    console.log(`Products fetched in ${Date.now() - t1}ms, count: ${prods.length}`);

  } catch (err) {
    console.error('Error during test:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status, 'data:', err.response.data);
    }
  }
}

test();
