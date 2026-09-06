const fs = require("fs");
const path = require("path");

const directory = "frontend/src/pages/Website";
const imgImports = `import imgSoloRide from '../../assets/WebsiteImages/solo_ride.jpg';
import imgGroupRide from '../../assets/WebsiteImages/group_ride.jpg';
import imgNavigation from '../../assets/WebsiteImages/navigation.jpg';
`;

const imageVars = ["imgSoloRide", "imgGroupRide", "imgNavigation"];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync(directory, function(filePath, stat) {
    if (filePath.endsWith(".tsx") && !filePath.endsWith("GradientArt.tsx")) {
        let content = fs.readFileSync(filePath, "utf8");
        
        if (content.includes("GradientMesh") && content.includes("import { GradientMesh }")) {
            if (!content.includes("imgSoloRide")) {
                content = content.replace(/import \{ GradientMesh \} from [^;]+;/, "import { GradientMesh } from '../GradientArt';\n" + imgImports);
            }
            
            const parts = content.split(/<GradientMesh[^>]*\/>/);
            if (parts.length > 1) {
                let newContent = parts[0];
                for (let i = 1; i < parts.length; i++) {
                    const imgVar = imageVars[(i-1) % imageVars.length];
                    const imgTag = `<img src={${imgVar}} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />`;
                    newContent += imgTag + parts[i];
                }
                
                fs.writeFileSync(filePath, newContent, "utf8");
                console.log("Updated " + filePath);
            }
        }
    }
});
