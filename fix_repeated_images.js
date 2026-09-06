const fs = require('fs');

function replaceInFile(filePath, replacements) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        for (const [search, replace] of replacements) {
            if (content.includes(search)) {
                content = content.replaceAll(search, replace);
                changed = true;
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
}

// Fix LoginScreen.tsx
replaceInFile('frontend/src/pages/LoginScreen.tsx', [
    ["import imgSoloRide from '../assets/WebsiteImages/solo_ride.jpg';", "import img17 from '../assets/WebsiteImages/img17.jpg';"],
    ["import imgGroupRide from '../assets/WebsiteImages/group_ride.jpg';", "import img18 from '../assets/WebsiteImages/img18.jpg';"],
    ["import imgNavigation from '../assets/WebsiteImages/navigation.jpg';", "import img19 from '../assets/WebsiteImages/img19.jpg';"],
    ["{imgSoloRide}", "{img17}"],
    ["{imgGroupRide}", "{img18}"],
    ["{imgNavigation}", "{img19}"]
]);

// Fix CreateRide.tsx
replaceInFile('frontend/src/pages/RidePlus/CreateRide.tsx', [
    ["import imgSoloRide from '../../assets/WebsiteImages/solo_ride.jpg';", "import img16 from '../../assets/WebsiteImages/img16.jpg';"],
    ["{imgSoloRide}", "{img16}"]
]);

// Fix RidePlusHMI.tsx
replaceInFile('frontend/src/features/rides/RidePlusHMI.tsx', [
    ["import imgGroupRide from '../../assets/WebsiteImages/group_ride.jpg';", "import img15 from '../../assets/WebsiteImages/img15.jpg';"],
    ["{imgGroupRide}", "{img15}"]
]);

// Fix LiveRide.tsx
replaceInFile('frontend/src/pages/RidePlus/LiveRide.tsx', [
    ["import imgSoloRide from '../../assets/WebsiteImages/solo_ride.jpg';", "import img14 from '../../assets/WebsiteImages/img14.jpg';"],
    ["{imgSoloRide}", "{img14}"]
]);
