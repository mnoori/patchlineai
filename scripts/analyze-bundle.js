const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing bundle sizes...\n');

// Run build with bundle analyzer
try {
  console.log('Building with bundle analyzer...');
  execSync('cross-env ANALYZE=true pnpm build', { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Check .next directory for build output
const buildManifest = path.join(__dirname, '../.next/build-manifest.json');
const appBuildManifest = path.join(__dirname, '../.next/app-build-manifest.json');

if (fs.existsSync(buildManifest)) {
  const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
  console.log('\n📊 Page Bundle Sizes:');
  
  Object.entries(manifest.pages).forEach(([page, bundles]) => {
    console.log(`\n${page}:`);
    bundles.forEach(bundle => {
      const bundlePath = path.join(__dirname, '../.next', bundle);
      if (fs.existsSync(bundlePath)) {
        const stats = fs.statSync(bundlePath);
        const sizeInKB = (stats.size / 1024).toFixed(2);
        console.log(`  - ${path.basename(bundle)}: ${sizeInKB} KB`);
      }
    });
  });
}

// Provide optimization recommendations
console.log('\n💡 Optimization Recommendations:\n');

const recommendations = [
  {
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
      return packageJson.dependencies['puppeteer'] !== undefined;
    },
    message: '⚠️  Puppeteer is in dependencies. Move to optionalDependencies to reduce bundle size.'
  },
  {
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
      return packageJson.dependencies['aws-cdk-lib'] !== undefined;
    },
    message: '⚠️  aws-cdk-lib is in dependencies. This is a development tool and should be in devDependencies.'
  },
  {
    check: () => !fs.existsSync(path.join(__dirname, '../public/fonts')),
    message: '💡 Consider using next/font for optimized font loading.'
  },
  {
    check: () => {
      const nextConfig = fs.readFileSync(path.join(__dirname, '../next.config.mjs'), 'utf8');
      return !nextConfig.includes('images.formats');
    },
    message: '💡 Enable modern image formats (AVIF, WebP) in next.config.mjs for better performance.'
  }
];

recommendations.forEach(rec => {
  try {
    if (rec.check()) {
      console.log(rec.message);
    }
  } catch (e) {
    // Skip if check fails
  }
});

console.log('\n✅ Bundle analysis complete!');
console.log('📁 Check ./analyze/ directory for detailed bundle visualization.'); 