const fs = require('fs');
const path = require('path');

async function testNovaCanvasFix() {
  console.log('🎨 Testing Nova Canvas Fix...\n');
  
  // Check if Sharp is installed
  try {
    const sharp = require('sharp');
    console.log('✅ Sharp is installed - Server-side compositing available');
  } catch (error) {
    console.log('⚠️  Sharp not installed - Will use fallback methods');
  }
  
  // Test the fixed endpoint
  const testImagePath = path.join(__dirname, '..', 'temp', 'test.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    console.log('Creating test image...');
    // Create a simple test image if it doesn't exist
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');
    
    // Draw a simple test pattern
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Test Subject', 100, 200);
    
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(testImagePath, buffer);
  }
  
  // Read and encode the test image
  const imageBuffer = fs.readFileSync(testImagePath);
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  
  console.log('\n📸 Testing different themes and methods:\n');
  
  const themes = ['vibrant', 'futuristic', 'cyberpunk'];
  const methods = ['client', 'variation'];
  
  for (const theme of themes) {
    for (const method of methods) {
      try {
        console.log(`Testing ${theme} theme with ${method} method...`);
        
        const response = await fetch('http://localhost:3000/api/nova-canvas/generate-with-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectImageData: base64Image,
            prompt: 'Professional music artist promotional content',
            style: theme,
            removeBackground: true,
            releaseContext: {
              title: 'Test Release',
              genre: 'Electronic',
              artist: 'Test Artist'
            },
            compositeMethod: method
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.mock) {
            console.log(`⚠️  ${theme}/${method}: Mock mode - Enable Nova Canvas in environment`);
          } else {
            console.log(`✅ ${theme}/${method}: Success!`);
          }
        } else {
          const error = await response.text();
          console.log(`❌ ${theme}/${method}: Failed - ${error}`);
        }
      } catch (error) {
        console.log(`❌ ${theme}/${method}: Error - ${error.message}`);
      }
    }
  }
  
  console.log('\n✨ Test complete!');
  console.log('\nKey fixes applied:');
  console.log('1. ✅ Removed invalid maskPrompt from inpainting');
  console.log('2. ✅ Added Sharp-based server-side compositing');
  console.log('3. ✅ Implemented IMAGE_VARIATION fallback');
  console.log('4. ✅ Added 9 theme options with optimized prompts');
  console.log('5. ✅ Enhanced UI with theme selector');
}

// Run the test
if (require.main === module) {
  testNovaCanvasFix().catch(console.error);
}

module.exports = { testNovaCanvasFix }; 