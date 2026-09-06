const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = 'frontend/src/assets/WebsiteImages';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (let i = 1; i <= 20; i++) {
    const url = `https://picsum.photos/seed/rideclub${i}/800/600`;
    const dest = path.join(dir, `img${i}.jpg`);
    console.log(`Downloading ${url} to ${dest}`);
    await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          https.get(res.headers.location, (res2) => {
             const file = fs.createWriteStream(dest);
             res2.pipe(file);
             file.on('finish', () => { file.close(); resolve(); });
          });
        } else {
          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }
      }).on('error', reject);
    });
  }
}
download();
