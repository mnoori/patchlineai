const fs = require('fs');

let content = fs.readFileSync('app/brand-showcase/page.tsx', 'utf8');

// Replace all section tags with proper padding
content = content.replace(/<section className="space-y-6">/g, '<section className="space-y-6 p-8">');

// Fix the specific sections that need different padding
content = content.replace(
  '{/* Logo Usage Guidelines */}\n        <section className="space-y-6 p-8">',
  '{/* Logo Usage Guidelines */}\n        <section className="space-y-6 p-8 pt-0">'
);

content = content.replace(
  '{/* Color Palette */}\n        <section className="space-y-6 p-8">',
  '{/* Color Palette */}\n        <section className="space-y-6 p-8 pt-0">'
);

content = content.replace(
  '{/* Typography */}\n        <section className="space-y-6 p-8">',
  '{/* Typography */}\n        <section className="space-y-6 p-8 pt-0">'
);

content = content.replace(
  '{/* Gradient Backgrounds */}\n        <section className="space-y-6 p-8">',
  '{/* Gradient Backgrounds */}\n        <section className="space-y-6 p-8 pt-0">'
);

content = content.replace(
  '{/* Gradient Text Examples */}\n        <section className="space-y-6 p-8">',
  '{/* Gradient Text Examples */}\n        <section className="space-y-6 p-8 pt-0">'
);

content = content.replace(
  '{/* UI Components */}\n        <section className="space-y-6 p-8">',
  '{/* UI Components */}\n        <section className="space-y-6 p-8 pt-0">'
);

content = content.replace(
  '{/* Spacing System */}\n        <section className="space-y-6 p-8">',
  '{/* Spacing System */}\n        <section className="space-y-6 p-8 pt-0">'
);

content = content.replace(
  '{/* Border Radius */}\n        <section className="space-y-6 p-8">',
  '{/* Border Radius */}\n        <section className="space-y-6 p-8 pt-0">'
);

fs.writeFileSync('app/brand-showcase/page.tsx', content);
console.log('Fixed section gaps in brand showcase'); 