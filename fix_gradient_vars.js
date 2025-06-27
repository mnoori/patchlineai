const fs = require('fs');

const filePath = 'components/brand/gradient-background.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all var(--brand-black) with #000814
content = content.replace(/var\(--brand-black\)/g, '#000814');

// Replace var(--brand-deep-blue) with #090030
content = content.replace(/var\(--brand-deep-blue\)/g, '#090030');

// Replace var(--brand-bright-blue) with #0068FF
content = content.replace(/var\(--brand-bright-blue\)/g, '#0068FF');

// Replace var(--brand-cyan) with #00E6E4
content = content.replace(/var\(--brand-cyan\)/g, '#00E6E4');

fs.writeFileSync(filePath, content);
console.log('Fixed CSS variables in gradient-background.tsx'); 