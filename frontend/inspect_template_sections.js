import fs from 'fs';

const html = fs.readFileSync('greenshift_home.html', 'utf-8');

// Find all css files loaded
const cssFiles = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
console.log('CSS files count:', cssFiles.length);
console.log('Section CSS files:');
cssFiles.filter(c => c.includes('section') || c.includes('hero') || c.includes('product') || c.includes('banner') || c.includes('grid')).forEach(c => {
  const name = c.split('/').pop().split('?')[0];
  console.log('-', name);
});

// Let's find all <section ...> or <div id="shopify-section-template...
const templateMatches = [...html.matchAll(/id="shopify-section-(template--[^"]+)"/g)].map(m => m[1]);
console.log('\nTemplate sections found:', templateMatches.length);

templateMatches.forEach((tId, idx) => {
  const start = html.indexOf(`id="shopify-section-${tId}"`);
  const chunk = html.substring(start, start + 3000);
  const css = chunk.match(/href="([^"]+\.css[^"]*)"/)?.[1]?.split('/')?.pop()?.split('?')?.[0] || 'no css';
  const headings = [...chunk.matchAll(/<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(h => `${h[1]}: ${h[2].replace(/<[^>]+>/g, '').trim()}`)
    .slice(0, 3);
  const classes = chunk.match(/class="([^"]+)"/)?.[1] || '';
  console.log(`\n--- Template Section ${idx + 1} (${tId}) ---`);
  console.log('CSS file:', css);
  console.log('Headings:', headings.join(' | '));
});
