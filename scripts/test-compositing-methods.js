const fs = require('fs');
const path = require('path');

async function testCompositingMethods() {
  console.log('🎨 Testing Different Compositing Methods...\n');
  
  // Check if test image exists
  const testImagePath = path.join(__dirname, '..', 'temp', 'test.jpg');
  if (!fs.existsSync(testImagePath)) {
    console.error('❌ Test image not found at temp/test.jpg');
    return;
  }
  
  // Read and encode the test image
  const imageBuffer = fs.readFileSync(testImagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const methods = [
    { name: 'Client-Side Compositing', method: 'client' },
    { name: 'Inpainting (Natural Placement)', method: 'inpainting' },
    { name: 'Image Variation (Style Transform)', method: 'variation' },
    { name: 'Outpainting (Environment Extension)', method: 'outpainting' }
  ];
  
  for (const { name, method } of methods) {
    console.log(`\n📸 Testing ${name}...`);
    
    try {
      const response = await fetch('http://localhost:3000/api/nova-canvas/test-background-removal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectImageData: base64Image,
          compositeMethod: method
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ ${name} failed with status ${response.status}: ${error}`);
        continue;
      }
      
      const result = await response.json();
      
      if (result.error) {
        console.error(`❌ ${name} failed: ${result.error}`);
      } else {
        console.log(`✅ ${name} succeeded!`);
        console.log(`   - Has processed subject: ${!!result.processedSubject}`);
        console.log(`   - Has background image: ${!!result.backgroundImage}`);
        console.log(`   - Method used: ${result.methodUsed || 'unknown'}`);
      }
      
    } catch (error) {
      console.error(`❌ ${name} failed with error:`, error.message);
    }
  }
  
  console.log('\n✨ Testing complete!');
}

testCompositingMethods().catch(console.error); 