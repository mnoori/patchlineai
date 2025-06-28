const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Content Generation Setup...\n');

const checkResults = [];

// Check 1: Test image exists
const testImagePath = path.join(__dirname, '..', 'temp', 'test.jpg');
if (fs.existsSync(testImagePath)) {
  const stats = fs.statSync(testImagePath);
  checkResults.push({
    name: 'Test Image',
    status: '✅',
    details: `Found (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
  });
} else {
  checkResults.push({
    name: 'Test Image',
    status: '❌',
    details: 'temp/test.jpg not found'
  });
}

// Check 2: API Routes
const apiRoutes = [
  'app/api/nova-canvas/test-background-removal/route.ts',
  'app/api/nova-canvas/generate-with-subject/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(__dirname, '..', route);
  if (fs.existsSync(routePath)) {
    checkResults.push({
      name: `API Route: ${path.basename(path.dirname(route))}`,
      status: '✅',
      details: 'Exists'
    });
  } else {
    checkResults.push({
      name: `API Route: ${path.basename(path.dirname(route))}`,
      status: '❌',
      details: 'Missing'
    });
  }
});

// Check 3: Components
const components = [
  'components/content/personalized-content-workflow.tsx',
  'components/releases/release-marketing-content-modal.tsx'
];

components.forEach(comp => {
  const compPath = path.join(__dirname, '..', comp);
  if (fs.existsSync(compPath)) {
    checkResults.push({
      name: `Component: ${path.basename(comp, '.tsx')}`,
      status: '✅',
      details: 'Exists'
    });
  } else {
    checkResults.push({
      name: `Component: ${path.basename(comp, '.tsx')}`,
      status: '❌',
      details: 'Missing'
    });
  }
});

// Check 4: Utilities
const utils = [
  'lib/nova-canvas-api.ts',
  'lib/s3-upload.ts',
  'lib/image-utils.ts'
];

utils.forEach(util => {
  const utilPath = path.join(__dirname, '..', util);
  if (fs.existsSync(utilPath)) {
    checkResults.push({
      name: `Utility: ${path.basename(util, '.ts')}`,
      status: '✅',
      details: 'Exists'
    });
  } else {
    checkResults.push({
      name: `Utility: ${path.basename(util, '.ts')}`,
      status: '❌',
      details: 'Missing'
    });
  }
});

// Check 5: Documentation
const docPath = path.join(__dirname, '..', 'documentation/06_Development_Guides/CONTENT_GENERATION_WORKFLOW.md');
if (fs.existsSync(docPath)) {
  checkResults.push({
    name: 'Documentation',
    status: '✅',
    details: 'CONTENT_GENERATION_WORKFLOW.md exists'
  });
} else {
  checkResults.push({
    name: 'Documentation',
    status: '❌',
    details: 'Missing documentation'
  });
}

// Check 6: Environment Variables
const envVars = [
  'ENABLE_NOVA_CANVAS',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'NEXT_PUBLIC_GMAIL_CLIENT_ID'
];

console.log('📋 Component Status:\n');
checkResults.forEach(result => {
  console.log(`${result.status} ${result.name}: ${result.details}`);
});

console.log('\n🔐 Environment Variables:\n');
envVars.forEach(varName => {
  const exists = process.env[varName] ? '✅' : '❌';
  const value = process.env[varName] ? 'Set' : 'Not set';
  console.log(`${exists} ${varName}: ${value}`);
});

console.log('\n📝 Quick Start Guide:\n');
console.log('1. Set environment variables in .env.local:');
console.log('   ENABLE_NOVA_CANVAS=true');
console.log('   AWS_REGION=us-east-1');
console.log('   AWS_ACCESS_KEY_ID=your_key');
console.log('   AWS_SECRET_ACCESS_KEY=your_secret\n');

console.log('2. Test background removal:');
console.log('   - Navigate to: /dashboard/content/test-background-removal');
console.log('   - Or run: node scripts/test-background-removal.js\n');

console.log('3. Use in the app:');
console.log('   - Go to Content tab → Personalized Release Content');
console.log('   - Or go to Releases → Click Generate on any release\n');

console.log('4. For production:');
console.log('   - Install Sharp for server-side image resizing: npm install sharp');
console.log('   - Configure S3 bucket in correct region (us-east-2)');
console.log('   - Enable S3 uploads: ENABLE_S3_UPLOAD=true\n');

const allPassed = checkResults.every(r => r.status === '✅');
if (allPassed) {
  console.log('✅ All components are in place!');
} else {
  console.log('⚠️  Some components are missing. Check the status above.');
}

process.exit(allPassed ? 0 : 1); 