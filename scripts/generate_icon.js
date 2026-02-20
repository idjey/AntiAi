
const fs = require('fs');
const path = require('path');

// 64x64 Green Square PNG (Approximate)
// This is a simple solid green block.
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAQUlEQVRo3u3PQREAAAgDMCB/yJzBH2uAt922C0Sj0Wg0Go1Go9FoNBqNRqPRaDQajUaj0Wg0Go1Go9FoNBqNRuP/AE5OAn7563U0AAAAAElFTkSuQmCC";

const buffer = Buffer.from(base64Png, 'base64');
const targetDir = path.join(__dirname, '../apps/extension_v2/assets');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Write to all standard sizes to be safe
const sizes = ['icon.png', 'icon128.png', 'icon1024.png'];

sizes.forEach(name => {
    fs.writeFileSync(path.join(targetDir, name), buffer);
    console.log(`Generated ${name}`);
});
