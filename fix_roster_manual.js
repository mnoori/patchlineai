const fs = require('fs');

const filePath = 'components/agents/scout/artist-roster-view.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all BrandCardContent with CardContent
content = content.replace(/BrandCardContent/g, 'CardContent');

fs.writeFileSync(filePath, content);
console.log('Fixed BrandCardContent references in artist-roster-view.tsx'); 