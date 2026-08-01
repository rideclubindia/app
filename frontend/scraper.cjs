const https = require('https');

function fetchUnsplash(query) {
  return new Promise((resolve) => {
    https.get(`https://unsplash.com/s/photos/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+\?q=80[^"'\s&]*/g;
        const matches = data.match(regex) || [];
        const unique = [...new Set(matches)];
        resolve(unique);
      });
    }).on('error', () => resolve([]));
  });
}

async function main() {
  const images = [];
  images.push(...await fetchUnsplash('motorcycle-road'));
  images.push(...await fetchUnsplash('biker-group'));
  images.push(...await fetchUnsplash('motorcycle-helmet'));
  images.push(...await fetchUnsplash('motorcycle-engine'));
  images.push(...await fetchUnsplash('motorcycle-dashboard'));
  images.push(...await fetchUnsplash('motorcycle-rain'));
  
  const uniqueImages = [...new Set(images)];
  console.log(JSON.stringify(uniqueImages.slice(0, 50), null, 2));
}

main();
