const fs = require('fs');

const filePath = 'components/agents/scout/artist-roster-view.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace <Card with <BrandCard and </Card> with </BrandCard>
content = content.replace(/<Card/g, '<BrandCard');
content = content.replace(/<\/Card>/g, '</BrandCard>');

fs.writeFileSync(filePath, content);
console.log('Fixed Card references in artist-roster-view.tsx'); 