const fs = require('fs');

// Correct brand colors
const correctColors = {
  black: '#010102',
  deepBlue: '#002772',
  brightBlue: '#0068FF',
  cyan: '#00E6E4'
};

// Files to update
const files = [
  'components/brand/gradient-background.tsx',
  'lib/brand/constants.ts',
  'app/globals.css'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace wrong black colors
    content = content.replace(/#000814/g, correctColors.black);
    
    // Replace wrong deep blue colors
    content = content.replace(/#090030/g, correctColors.deepBlue);
    
    // In CSS file, also update the comments
    if (file.includes('globals.css')) {
      content = content.replace(/\/\* #000814 - brand black \*\//g, '/* #010102 - brand black */');
      content = content.replace(/\/\* #090030 - Brand Deep Blue \*\//g, '/* #002772 - Brand Deep Blue */');
    }
    
    fs.writeFileSync(file, content);
    console.log(`Fixed colors in ${file}`);
  }
});

console.log('\nAll brand colors updated to:');
console.log('Black: #010102');
console.log('Deep Blue: #002772');  
console.log('Bright Blue: #0068FF');
console.log('Cyan: #00E6E4'); 