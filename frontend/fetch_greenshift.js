import https from 'https';
import fs from 'fs';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ res, data }));
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function run() {
  console.log('Fetching password page...');
  const step1 = await fetchUrl('https://greenshift-road.myshopify.com/password', {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const cookies1 = step1.res.headers['set-cookie'] || [];
  console.log('Step 1 status:', step1.res.statusCode, 'cookies:', cookies1.length);
  
  const tokenMatch = step1.data.match(/name="authenticity_token" value="([^"]+)"/);
  const token = tokenMatch ? tokenMatch[1] : '';
  console.log('Token extracted:', token ? token.substring(0, 10) + '...' : 'none');

  let postBody = 'form_type=storefront_password&utf8=%E2%9C%93&password=1';
  if (token) {
    postBody += '&authenticity_token=' + encodeURIComponent(token);
  }

  const cookieHeader1 = cookies1.map(c => c.split(';')[0]).join('; ');

  console.log('Submitting password "1"...');
  const step2 = await fetchUrl('https://greenshift-road.myshopify.com/password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postBody),
      'Cookie': cookieHeader1,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: postBody
  });

  const cookies2 = step2.res.headers['set-cookie'] || [];
  console.log('Step 2 status:', step2.res.statusCode, 'location:', step2.res.headers['location']);

  const allCookies = [...cookies1, ...cookies2].map(c => c.split(';')[0]).join('; ');

  console.log('Fetching storefront homepage with authenticated session...');
  const step3 = await fetchUrl('https://greenshift-road.myshopify.com/', {
    method: 'GET',
    headers: {
      'Cookie': allCookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  console.log('Step 3 status:', step3.res.statusCode, 'length:', step3.data.length);
  fs.writeFileSync('greenshift_home.html', step3.data, 'utf-8');
  console.log('Saved to greenshift_home.html successfully!');
}

run().catch(console.error);
