const fs = require('fs');
const path = require('path');

const bikeImages = [
  '1558981403-c5f9899a28bc',
  '1558981806-ec527fa84c39',
  '1568772585407-9361f9bf3a87',
  '1585392764356-4c40b82f0c7a',
  '1518118014389-13e617d917f9',
  '1551670984-b0e77d337fde',
  '1471465225890-50b070442ea3',
  '1520699049698-acd2fce147c4',
  '1609358905581-e5381612486e'
];

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

let imgIndex = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace direct full URLs
  content = content.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g, () => {
    const replacement = 'https://images.unsplash.com/photo-' + bikeImages[imgIndex % bikeImages.length];
    imgIndex++;
    return replacement;
  });

  // Specifically in Features/index.tsx which uses array of partial strings
  content = content.replace(/'1512428559087-560fa5ceab42'/g, "'1518118014389-13e617d917f9'");
  content = content.replace(/'1560250097-0b93528c311a'/g, "'1551670984-b0e77d337fde'");
  content = content.replace(/'1573496359142-b8d87734a5a2'/g, "'1585392764356-4c40b82f0c7a'");
  content = content.replace(/'1472099645785-5658abf4ff4e'/g, "'1471465225890-50b070442ea3'");
  content = content.replace(/'1580489944761-15a19d654956'/g, "'1520699049698-acd2fce147c4'");
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
}
