const fs = require('fs');
const path = require('path');

const websiteDir = path.join(__dirname, 'src', 'pages', 'Website');

// 7. Fix Community/index.tsx Hero
const commIndex = path.join(websiteDir, 'Community', 'index.tsx');
if (fs.existsSync(commIndex)) {
    let content = fs.readFileSync(commIndex, 'utf8');
    content = content.replace(/src="https:\/\/loremflickr\.com.*?"/, 'src="https://loremflickr.com/2000/1200/motorcycle,rally,community?lock=401"');
    fs.writeFileSync(commIndex, content, 'utf8');
    console.log('Fixed Community/index.tsx');
}

// 8. Fix Community/data.ts
const commData = path.join(websiteDir, 'Community', 'data.ts');
if (fs.existsSync(commData)) {
    let content = fs.readFileSync(commData, 'utf8');
    const images = [
        "'https://loremflickr.com/1200/800/motorcycle,friends,biker?lock=402'",
        "'https://loremflickr.com/1200/800/motorcycle,event,crowd?lock=403'",
        "'https://loremflickr.com/1200/800/motorcycle,group,ride?lock=404'"
    ];
    let i = 0;
    content = content.replace(/'https:\/\/loremflickr\.com.*?'/g, () => images[i++ % images.length]);
    fs.writeFileSync(commData, content, 'utf8');
    console.log('Fixed Community/data.ts');
}

// 9. Fix Contact/index.tsx Hero
const contactIndex = path.join(websiteDir, 'Contact', 'index.tsx');
if (fs.existsSync(contactIndex)) {
    let content = fs.readFileSync(contactIndex, 'utf8');
    content = content.replace(/src="https:\/\/loremflickr\.com.*?"/, 'src="https://loremflickr.com/2000/1200/motorcycle,mechanic,support?lock=501"');
    fs.writeFileSync(contactIndex, content, 'utf8');
    console.log('Fixed Contact/index.tsx');
}

// 10. Fix AboutUs/index.tsx Hero
const aboutIndex = path.join(websiteDir, 'AboutUs', 'index.tsx');
if (fs.existsSync(aboutIndex)) {
    let content = fs.readFileSync(aboutIndex, 'utf8');
    content = content.replace(/src="https:\/\/loremflickr\.com.*?"/, 'src="https://loremflickr.com/2000/1200/motorcycle,workshop,team?lock=601"');
    fs.writeFileSync(aboutIndex, content, 'utf8');
    console.log('Fixed AboutUs/index.tsx');
}

// 11. Fix AboutUs/data.ts
const aboutData = path.join(websiteDir, 'AboutUs', 'data.ts');
if (fs.existsSync(aboutData)) {
    let content = fs.readFileSync(aboutData, 'utf8');
    const images = [
        "'https://loremflickr.com/800/800/portrait,biker,man?lock=602'",
        "'https://loremflickr.com/800/800/portrait,biker,woman?lock=603'",
        "'https://loremflickr.com/800/800/portrait,mechanic,man?lock=604'",
        "'https://loremflickr.com/800/800/portrait,engineer,woman?lock=605'"
    ];
    let i = 0;
    content = content.replace(/'https:\/\/loremflickr\.com.*?'/g, () => images[i++ % images.length]);
    fs.writeFileSync(aboutData, content, 'utf8');
    console.log('Fixed AboutUs/data.ts');
}
