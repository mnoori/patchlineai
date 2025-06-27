const fs = require('fs');

// Fix gradient-background.tsx
let content = fs.readFileSync('components/brand/gradient-background.tsx', 'utf8');
content = content.replace(/#000814/g, '#010102');
fs.writeFileSync('components/brand/gradient-background.tsx', content);

// Fix brand constants
let constants = fs.readFileSync('lib/brand/constants.ts', 'utf8');
constants = constants.replace(/#000814/g, '#010102');
fs.writeFileSync('lib/brand/constants.ts', constants);

console.log('Fixed black color to #010102'); 