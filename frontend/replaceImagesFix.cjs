const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const websiteDir = path.join(__dirname, 'src', 'pages', 'Website');
const files = getFiles(websiteDir);

let imgIndex = 1;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace ANY Unsplash URL with a locked loremflickr motorcycle URL
  content = content.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+[^"'\s]*/g, () => {
    const replacement = `https://loremflickr.com/1200/800/motorcycle,biker,ride?lock=${imgIndex}`;
    imgIndex++;
    return replacement;
  });
  
  // Replace the hardcoded Unsplash IDs used in arrays (e.g., Features/index.tsx)
  // We'll just replace the whole array construction if it exists, or just the IDs.
  // Actually, since the array in Features builds the url like: `https://images.unsplash.com/photo-${featureImages[index]}?q=80...`
  // And we already replaced the full URL string inside the map loop? No, the array just has IDs!
  
  // Let's replace the string IDs inside the array with full loremflickr URLs, and change the img src to just use the array value directly!
  // BUT wait, it's easier to just do a global replace of the Unsplash ID strings with loremflickr strings, and update the img src logic if needed.
  // Let's just fix Features/index.tsx manually below
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
}

// Special fix for Features/index.tsx
const featuresFile = path.join(websiteDir, 'Features', 'index.tsx');
if (fs.existsSync(featuresFile)) {
    let fContent = fs.readFileSync(featuresFile, 'utf8');
    
    // Replace the Unsplash prefix building with just using the image directly
    fContent = fContent.replace(/src=\{\`https:\/\/images\.unsplash\.com\/photo-\$\{featureImages\[index\]\}\?.*?\`\}/g, "src={`https://loremflickr.com/1200/800/motorcycle,biker,ride?lock=${index + 20}`}");
    
    fs.writeFileSync(featuresFile, fContent, 'utf8');
    console.log('Special fix applied to Features/index.tsx');
}
