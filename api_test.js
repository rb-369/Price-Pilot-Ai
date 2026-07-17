// Phase 1 testing script
const axios = require('axios');

async function testFlow() {
  console.log('--- Price Pilot Backend Test Flow ---');

  const backendUrl = 'https://price-pilot-ai.onrender.com/api';

  try {
    // 1. Unauthenticated request to /products
    try {
      await axios.get(`${backendUrl}/products`);
      console.log('❌ Unexpectedly succeeded getting products without auth');
    } catch (e) {
      console.log('✅ Auth protecting /products as expected:', e.response?.status);
    }

    // 2. Try to register a unique user
    const username = `test_seller_${Date.now()}`;
    const password = 'TestPassword123!';
    const userEmail = `${username}@example.com`;
    console.log(`\nRegistering user ${userEmail}...`);

    let token = '';
    try {
        const regRes = await axios.post(`${backendUrl}/auth/register`, {
            name: username,
            email: userEmail,
            password: password,
            storeName: 'Test Store'
        });
        console.log('✅ Registered successfully:', regRes.data);
        token = regRes.data.token || regRes.data.data?.token;
        if (!token) {
           console.log('❌ No token returned from registration');

           // Attempt login to get token
           const loginRes = await axios.post(`${backendUrl}/auth/login`, {
             email: userEmail,
             password: password
           });
           token = loginRes.data.token || loginRes.data.data?.token;
           console.log('Login after registration:', !!token);
        }
    } catch (e) {
        console.log('❌ Registration failed:', e.response?.data || e.message);
        return;
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. fetch user profile
    try {
        const profile = await axios.get(`${backendUrl}/auth/profile`, authHeaders);
        console.log('✅ Profile fetch successful', Object.keys(profile.data));
    } catch (e) {
        console.log('❌ Profile fetch failed:', e.response?.data || e.message);
    }

    // 4. Add product
    let productId = '';
    console.log('\nAdding product...');
    try {
        const prod = {
            name: 'Test AirPods',
            sku: `AP-${Date.now()}`,
            competitorUrl: 'https://amazon.com/dp/B09JQMJHXY',
            currentPrice: 199.99,
            baseCost: 150.00
        };
        const pRes = await axios.post(`${backendUrl}/products`, prod, authHeaders);
        console.log('✅ Product added', pRes.data);
        const dataObj = pRes.data.data || pRes.data;
        productId = dataObj._id || dataObj.id;
    } catch (e) {
        console.log('❌ Product addition failed:', JSON.stringify(e.response?.data || e.message, null, 2));
    }

    // 5. Check AI API Service Health
    const aiServiceUrl = 'https://price-pilot-ai-service.onrender.com';
    console.log(`\nChecking AI Service Health at ${aiServiceUrl}...`);
    try {
       const aiHealth = await axios.get(`${aiServiceUrl}/api/health`);
       console.log('✅ AI Service Health:', aiHealth.data);

       const aiReady = await axios.get(`${aiServiceUrl}/api/ready`);
       console.log('✅ AI Service Ready:', aiReady.data);
    } catch (e) {
       console.log('❌ AI Service check failed:', e.message);
    }

    // 7. Chat service test
    console.log('\nTesting Chat Service...');
    try {
        const chatRes = await axios.post(`${backendUrl}/chats`, { title: 'Test Chat' }, authHeaders);
        console.log('✅ Chat created:', chatRes.data);
        const chatId = chatRes.data?.data?._id || chatRes.data?._id;

        if (chatId) {
            console.log(`Sending message to chat ${chatId}...`);
            const msgRes = await axios.post(`${backendUrl}/chats/${chatId}/message`, {
                message: 'Hello, how can you help me price my AirPods?'
            }, authHeaders);
            console.log('✅ Chat response:', msgRes.data);
        }
    } catch (e) {
        console.log('❌ Chat test failed:', JSON.stringify(e.response?.data || e.message, null, 2));
    }
    let jobId = '';
    if (productId) {
        console.log(`\nGenerating recommendation for product ${productId}...`);
        try {
            const recsRes = await axios.post(`${backendUrl}/ai/recommendations/${productId}`, {}, authHeaders);
            console.log('✅ Recommendation requested:', recsRes.data);
            jobId = recsRes.data.jobId;
        } catch (e) {
            console.log('❌ Recommendation request failed:', JSON.stringify(e.response?.data || e.message, null, 2));
        }

        if (jobId) {
            console.log(`Polling job status for ${jobId}...`);
            let status = 'queued';
            for (let i = 0; i < 15; i++) {
                await new Promise(r => setTimeout(r, 2000));
                try {
                    const statusRes = await axios.get(`${backendUrl}/ai/jobs/${jobId}`, authHeaders);
                    status = statusRes.data.status;
                    console.log(`Job status: ${status}`);
                    if (status === 'completed' || status === 'failed') {
                        console.log('Job final data:', statusRes.data);
                        break;
                    }
                } catch(e) {
                    console.log('Job status fetch failed:', e.response?.data || e.message);
                }
            }
        }
    }

  } catch (err) {
    console.error('Fatal Test Error:', err.message);
  }
}

testFlow();
