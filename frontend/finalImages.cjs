const fs = require('fs');
const path = require('path');

const websiteDir = path.join(__dirname, 'src', 'pages', 'Website');

const images = [
  'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2549941/pexels-photo-2549941.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2393821/pexels-photo-2393821.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2611686/pexels-photo-2611686.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3255146/pexels-photo-3255146.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2413089/pexels-photo-2413089.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1739347/pexels-photo-1739347.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2393835/pexels-photo-2393835.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop'
];

let globalImgIdx = 0;

function getNextImage() {
  const img = images[globalImgIdx % images.length];
  globalImgIdx++;
  return img;
}

function processFile(filePath) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Match string literals with loremflickr URLs inside the arrays
        content = content.replace(/'https:\/\/loremflickr\.com.*?'/g, () => `'${getNextImage()}'`);
        content = content.replace(/'https:\/\/images\.unsplash\.com.*?'/g, () => `'${getNextImage()}'`);
        
        // Match jsx src strings
        content = content.replace(/src="https:\/\/loremflickr\.com.*?"/g, () => `src="${getNextImage()}"`);
        content = content.replace(/src="https:\/\/images\.unsplash\.com.*?"/g, () => `src="${getNextImage()}"`);

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. Features
processFile(path.join(websiteDir, 'Features', 'index.tsx'));
processFile(path.join(websiteDir, 'Features', 'data.ts'));

// 2. Safety
processFile(path.join(websiteDir, 'Safety', 'index.tsx'));
processFile(path.join(websiteDir, 'Safety', 'data.ts'));

// 3. TheApp
processFile(path.join(websiteDir, 'TheApp', 'index.tsx'));
processFile(path.join(websiteDir, 'TheApp', 'data.ts'));

// 4. Community
processFile(path.join(websiteDir, 'Community', 'index.tsx'));
processFile(path.join(websiteDir, 'Community', 'data.ts'));

// 5. Contact
processFile(path.join(websiteDir, 'Contact', 'index.tsx'));
processFile(path.join(websiteDir, 'Contact', 'data.ts'));

// 6. AboutUs
processFile(path.join(websiteDir, 'AboutUs', 'index.tsx'));
processFile(path.join(websiteDir, 'AboutUs', 'data.ts'));

