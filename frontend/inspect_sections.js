import fs from 'fs';

const html = fs.readFileSync('greenshift_home.html', 'utf-8');

// Match sections by finding divs with id containing shopify-section
const sectionRegex = /<div id="shopify-section-([^"]+)" class="shopify-section[^"]*"[^>]*>([\s\S]*?)(?=<div id="shopify-section-|<\/main>|$)/g;

let match;
let count = 0;
while ((match = sectionRegex.exec(html)) !== null) {
  count++;
  const id = match[1];
  const content = match[2];

  // Try to find the section type or main classes
  const classes = content.match(/class="([^"]+)"/)?.[1] || '';
  const firstH = content.match(/<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/i);
  const heading = firstH ? `${firstH[1]}: ${firstH[2].replace(/<[^>]+>/g, '').trim()}` : 'no heading';
  
  // Find buttons or CTAs
  const buttons = [...content.matchAll(/<a[^>]+class="[^"]*(?:btn|button)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(b => b[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);

  // Find images
  const imgs = [...content.matchAll(/<img[^>]+src="([^"]+)"/gi)].length;

  console.log(`\n========================================`);
  console.log(`SECTION ${count}: id=${id}`);
  console.log(`Heading: ${heading}`);
  console.log(`Buttons: ${buttons.slice(0, 3).join(' | ')}`);
  console.log(`Images: ${imgs}`);
  console.log(`Snippet: ${content.substring(0, 200).replace(/\s+/g, ' ')}...`);
}
