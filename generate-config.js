const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'public';

// 1. Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// 2. Generate config.js
const apiKey = process.env.GROQ_API_KEY || "API_KEY_NOT_SET";
const configContent = `const GROQ_API_KEY = "${apiKey}";`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'config.js'), configContent);
console.log('✅ Generated public/config.js');

// 3. Copy static assets
const assetsToCopy = [
    'index.html',
    'style.css',
    'script.js',
    'dataset.js',
    'questions_dataset.txt' // including just in case
];

assetsToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(OUTPUT_DIR, file));
        console.log(`✅ Copied ${file} to ${OUTPUT_DIR}`);
    } else {
        console.warn(`⚠️ Warning: ${file} not found locally.`);
    }
});

console.log('Build completed successfully.');
