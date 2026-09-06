import fs from 'fs';

const html = fs.readFileSync('greenshift_home.html', 'utf-8');

// Find sections
const sectionMatches = [...html.matchAll(/class="[^"]*shopify-section[^"]*"/g)];
console.log('Total shopify-section classes found:', sectionMatches.length);

// Extract section IDs or names
const sections = [...html.matchAll(/id="shopify-section-([^"]+)"/g)].map(m => m[1]);
console.log('Sections in sequential order:');
sections.forEach((s, idx) => console.log(`${idx + 1}. ${s}`));

// Extract title and meta tags
const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
console.log('\nPage Title:', title);

// Find navigation links in header
const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
if (headerMatch) {
  const navLinks = [...headerMatch[1].matchAll(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(l => l.text.length > 0 && l.text.length < 40);
  console.log('\nHeader Nav Links:', navLinks);
}

// Find main section headings (h1, h2, h3)
const headings = [...html.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)]
  .map(m => ({ tag: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
  .filter(h => h.text.length > 0 && h.text.length < 120);

console.log('\nHeadings breakdown:');
headings.forEach(h => console.log(`[${h.tag.toUpperCase()}] ${h.text}`));
