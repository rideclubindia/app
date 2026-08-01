const fs = require('fs');
const path = require('path');

const websiteDir = path.join(__dirname, 'src', 'pages', 'Website');

// 1. Fix Features/index.tsx
const featuresFile = path.join(websiteDir, 'Features', 'index.tsx');
if (fs.existsSync(featuresFile)) {
    let content = fs.readFileSync(featuresFile, 'utf8');
    
    // Replace the mapping logic for feature images
    content = content.replace(
      /const featureImages = \[[\s\S]*?\];/m,
      `const featureImages = [
          'https://loremflickr.com/1200/800/motorcycle,highway?lock=101',
          'https://loremflickr.com/1200/800/motorcycle,group?lock=102',
          'https://loremflickr.com/1200/800/motorcycle,crash,helmet?lock=103',
          'https://loremflickr.com/1200/800/motorcycle,mountain?lock=104',
          'https://loremflickr.com/1200/800/motorcycle,garage,mechanic?lock=105',
          'https://loremflickr.com/1200/800/motorcycle,rain,weather?lock=106'
        ];`
    );

    // Update the img src logic inside the map to use the full URLs
    content = content.replace(/src=\{\`https:\/\/loremflickr\.com.*?\`\}/g, "src={featureImages[index]}");
    // Also catch if it still has the old unsplash format
    content = content.replace(/src=\{\`https:\/\/images\.unsplash\.com.*?\`\}/g, "src={featureImages[index]}");
    
    fs.writeFileSync(featuresFile, content, 'utf8');
    console.log('Fixed Features/index.tsx');
}

// 2. Fix Features/data.ts (Deep dive)
const featuresData = path.join(websiteDir, 'Features', 'data.ts');
if (fs.existsSync(featuresData)) {
    let content = fs.readFileSync(featuresData, 'utf8');
    content = content.replace(/image: 'https:\/\/loremflickr\.com.*?'/g, (match, offset) => {
        if (offset < 2000) {
            return "image: 'https://loremflickr.com/1200/800/motorcycle,dashboard?lock=107'";
        } else {
            return "image: 'https://loremflickr.com/1200/800/motorcycle,helmet,bluetooth?lock=108'";
        }
    });
    fs.writeFileSync(featuresData, content, 'utf8');
    console.log('Fixed Features/data.ts');
}

// 3. Fix Safety/index.tsx Hero
const safetyIndex = path.join(websiteDir, 'Safety', 'index.tsx');
if (fs.existsSync(safetyIndex)) {
    let content = fs.readFileSync(safetyIndex, 'utf8');
    content = content.replace(/src="https:\/\/loremflickr\.com.*?"/, 'src="https://loremflickr.com/2000/1200/motorcycle,safety,shield?lock=201"');
    fs.writeFileSync(safetyIndex, content, 'utf8');
    console.log('Fixed Safety/index.tsx');
}

// 4. Fix Safety/data.ts
const safetyData = path.join(websiteDir, 'Safety', 'data.ts');
if (fs.existsSync(safetyData)) {
    let content = fs.readFileSync(safetyData, 'utf8');
    const images = [
        "'https://loremflickr.com/1200/800/motorcycle,gear,helmet?lock=202'",
        "'https://loremflickr.com/1200/800/motorcycle,police,emergency?lock=203'",
        "'https://loremflickr.com/1200/800/motorcycle,night,lights?lock=204'"
    ];
    let i = 0;
    content = content.replace(/'https:\/\/loremflickr\.com.*?'/g, () => images[i++ % images.length]);
    fs.writeFileSync(safetyData, content, 'utf8');
    console.log('Fixed Safety/data.ts');
}

// 5. Fix TheApp/index.tsx Hero
const theAppIndex = path.join(websiteDir, 'TheApp', 'index.tsx');
if (fs.existsSync(theAppIndex)) {
    let content = fs.readFileSync(theAppIndex, 'utf8');
    content = content.replace(/src="https:\/\/loremflickr\.com.*?"/, 'src="https://loremflickr.com/2000/1200/motorcycle,phone,app?lock=301"');
    fs.writeFileSync(theAppIndex, content, 'utf8');
    console.log('Fixed TheApp/index.tsx');
}

// 6. Fix TheApp/data.ts
const theAppData = path.join(websiteDir, 'TheApp', 'data.ts');
if (fs.existsSync(theAppData)) {
    let content = fs.readFileSync(theAppData, 'utf8');
    const images = [
        "'https://loremflickr.com/800/1600/motorcycle,navigation,app?lock=302'",
        "'https://loremflickr.com/800/1600/motorcycle,chat,app?lock=303'",
        "'https://loremflickr.com/800/1600/motorcycle,profile,app?lock=304'",
        "'https://loremflickr.com/800/1600/motorcycle,route,app?lock=305'"
    ];
    let i = 0;
    content = content.replace(/'https:\/\/loremflickr\.com.*?'/g, () => images[i++ % images.length]);
    fs.writeFileSync(theAppData, content, 'utf8');
    console.log('Fixed TheApp/data.ts');
}
