const fs = require('fs');
const path = require('path');

const dirsToProcess = [
  'frontend/src/pages/Website',
  'frontend/src/pages/WebsiteHome.tsx'
];

let globalImgIndex = 1;

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') || filePath.endsWith('GradientArt.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Ensure we import all 20 images
    const importStatements = Array.from({length: 20}, (_, i) => `import uImg${i+1} from '${filePath.includes('Website/') ? '../../' : '../'}assets/WebsiteImages/img${i+1}.jpg';`).join('\n');
    
    // Inject imports if not present
    if (!content.includes('uImg1 ')) {
        // Find a good place to inject. After the last import.
        const importMatch = content.match(/^import .*?;\r?\n/gm);
        if (importMatch) {
            const lastImport = importMatch[importMatch.length - 1];
            content = content.replace(lastImport, lastImport + importStatements + '\n');
            changed = true;
        }
    }

    // 2. Replace GradientMesh placeholders with unique images
    let parts = content.split(/(?:<GradientMesh[^>]*\/>|<img src=\{img(?:SoloRide|GroupRide|Navigation)\}[^>]*\/>)/);
    
    if (parts.length > 1) {
        let newContent = parts[0];
        for (let i = 1; i < parts.length; i++) {
            const imgVar = `uImg${globalImgIndex}`;
            globalImgIndex = (globalImgIndex % 20) + 1; // Wrap around if we exceed 20
            
            const imgTag = `<img src={${imgVar}} alt="Placeholder" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />`;
            newContent += imgTag + parts[i];
        }
        content = newContent;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walkSync(currentDirPath) {
    var stat = fs.statSync(currentDirPath);
    if (stat.isFile()) {
        processFile(currentDirPath);
    } else if (stat.isDirectory()) {
        fs.readdirSync(currentDirPath).forEach(function (name) {
            var filePath = path.join(currentDirPath, name);
            walkSync(filePath);
        });
    }
}

dirsToProcess.forEach(dir => {
    if (fs.existsSync(dir)) walkSync(dir);
});
