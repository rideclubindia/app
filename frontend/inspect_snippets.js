import fs from 'fs';

const html = fs.readFileSync('greenshift_home.html', 'utf-8');

function inspectSnippet(title, regex, len = 2000) {
  const m = html.match(regex);
  console.log(`\n=================== ${title} ===================`);
  if (m) {
    console.log(m[0].substring(0, len).replace(/\s+/g, ' '));
  } else {
    console.log('NOT FOUND');
  }
}

// 1. Announcement bar & Header
inspectSnippet('ANNOUNCEMENT BAR', /<div[^>]*class="[^"]*announcement-bar[^"]*"[\s\S]*?<\/div>\s*<\/div>/i, 800);
inspectSnippet('HEADER & NAV', /<header[^>]*class="[^"]*header[^"]*"[\s\S]*?<\/header>/i, 1500);

// 2. Hero Section (template--24949130854675__a05f89ae-e114-4160-bb77-f8781a0f6d1b)
inspectSnippet('HERO SECTION', /id="shopify-section-template--24949130854675__a05f89ae-e114-4160-bb77-f8781a0f6d1b"[\s\S]*?<\/section>/i, 1800);

// 3. Number Counter (section 2)
inspectSnippet('NUMBER COUNTER / STATS', /id="shopify-section-template--24949130854675__59465bb7-49b9-4f59-b0bc-ea2da5042c89"[\s\S]*?<\/section>/i, 1800);

// 4. Marquee (section 3)
inspectSnippet('MARQUEE TICKER', /id="shopify-section-template--24949130854675__06019369-cc9b-4d96-8f7d-3c279a16d3f3"[\s\S]*?<\/section>/i, 1200);

// 5. Featured Collection (section 4)
inspectSnippet('FEATURED COLLECTION / PRODUCTS', /id="shopify-section-template--24949130854675__c7ac04eb-0e08-4e19-96d3-0fe8c0816c03"[\s\S]*?<\/section>/i, 1800);

// 6. Deal Banner Countdown (section 5)
inspectSnippet('DEAL BANNER / COUNTDOWN', /id="shopify-section-template--24949130854675__2bd2c2c8-79d4-4e2d-aa5c-653c9657f83c"[\s\S]*?<\/section>/i, 1800);

// 7. Slider With Tabs / Feature Tabs (section 6)
inspectSnippet('FEATURE TABS SLIDER', /id="shopify-section-template--24949130854675__df5586f7-ef55-410f-b2da-37bcf90c294c"[\s\S]*?<\/section>/i, 1800);

// 8. Grid Banner (section 7)
inspectSnippet('GRID BANNER / 2-COL PROMOS', /id="shopify-section-template--24949130854675__9f85b1a4-e30a-4f72-be00-d780d9715901"[\s\S]*?<\/section>/i, 1800);

// 9. About Road (section 8)
inspectSnippet('ABOUT ROAD / STATEMENT', /id="shopify-section-template--24949130854675__7e8df30d-7f19-4733-ac6e-71f5552ac258"[\s\S]*?<\/section>/i, 1800);

// 10. Single Product Spotlight / Feature (section 9)
inspectSnippet('PRODUCT SPOTLIGHT', /id="shopify-section-template--24949130854675__3bfe5e80-dad4-4ed1-a5d6-6fa79cc8a8a4"[\s\S]*?<\/section>/i, 1800);

// 11. Blog Grid / Articles (section 10)
inspectSnippet('BLOG ARTICLES', /id="shopify-section-template--24949130854675__10593929-b24f-46dd-9030-404e30b16310"[\s\S]*?<\/section>/i, 1800);

// 12. Brand Logos / Partners (section 11)
inspectSnippet('BRAND LOGOS', /id="shopify-section-template--24949130854675__831e018d-f5da-4559-8420-a41f37f67c05"[\s\S]*?<\/section>/i, 1800);

// 13. Video / Parallax Banner (section 12)
inspectSnippet('GLOW YOUR RIDE BANNER', /id="shopify-section-template--24949130854675__f50213eb-8f06-4d13-8480-f8007478d80f"[\s\S]*?<\/section>/i, 1800);

// 14. Support Block / Value Props (section 13)
inspectSnippet('SUPPORT BLOCK (4 PROPS)', /id="shopify-section-template--24949130854675__dc6fc161-45ec-41d6-8b81-4cc5844fea10"[\s\S]*?<\/section>/i, 1800);

// 15. Footer
inspectSnippet('FOOTER', /<footer[^>]*class="[^"]*footer[^"]*"[\s\S]*?<\/footer>/i, 1800);
