import fs from 'fs';

const html = fs.readFileSync('greenshift_home.html', 'utf-8');

const templateMatches = [...html.matchAll(/id="shopify-section-(template--[^"]+)"/g)].map(m => m[1]);

templateMatches.forEach((tId, idx) => {
  const start = html.indexOf(`id="shopify-section-${tId}"`);
  const nextStart = idx < templateMatches.length - 1 
    ? html.indexOf(`id="shopify-section-${templateMatches[idx + 1]}"`) 
    : html.indexOf(`id="shopify-section-sections--24949131149587__footer"`);
  
  const sectionHtml = html.substring(start, nextStart > start ? nextStart : start + 10000);
  
  // Find all text, headings, buttons, images, and structure
  const headings = [...sectionHtml.matchAll(/<(h[1-5])[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(h => `[${h[1].toUpperCase()}] ${h[2].replace(/<[^>]+>/g, '').trim()}`);
  
  const buttons = [...sectionHtml.matchAll(/<a[^>]+class="[^"]*(?:button|btn|banner__buttons)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(b => b[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);

  const images = [...sectionHtml.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/gi)]
    .map(img => ({ alt: img[2] || 'no-alt', src: img[1].split('?')[0] }));

  // Find sub-text or paragraphs
  const paragraphs = [...sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(p => p[1].replace(/<[^>]+>/g, '').trim())
    .filter(p => p.length > 5 && p.length < 200)
    .slice(0, 5);

  console.log(`\n======================================================`);
  console.log(`SECTION ${idx + 1}: ${tId}`);
  console.log(`HEADINGS (${headings.length}):`, headings.join(' | '));
  console.log(`PARAGRAPHS:`, paragraphs.slice(0, 3).join(' /// '));
  console.log(`BUTTONS:`, buttons.join(' | '));
  console.log(`IMAGES (${images.length}):`, images.slice(0, 3).map(i => `${i.alt}: ${i.src.split('/').pop()}`).join(', '));
});
