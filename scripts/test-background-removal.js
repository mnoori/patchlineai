const fs = require('fs');
const path = require('path');

async function testBackgroundRemoval() {
  console.log('🧪 Testing Background Removal Implementation...\n');

  // Test 1: Check if test.jpg exists
  console.log('✅ Test 1: Checking test.jpg exists');
  const testImagePath = path.join(__dirname, '..', 'temp', 'test.jpg');
  if (!fs.existsSync(testImagePath)) {
    console.error('❌ test.jpg not found at:', testImagePath);
    return false;
  }
  console.log('✅ test.jpg found\n');

  // Test 2: Test the background removal API endpoint
  console.log('🔄 Test 2: Testing background removal API endpoint');
  try {
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch('http://localhost:3000/api/nova-canvas/test-background-removal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        releaseTitle: 'Summer Vibes Test',
        releaseGenre: 'Electronic',
        style: 'vibrant'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API request failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('✅ API response received:', {
      mockMode: result.mockResults ? true : false,
      hasBackgroundRemoved: !!result.backgroundRemoved,
      hasNewBackground: !!result.newBackground,
      hasComposite: !!result.composite
    });

    if (result.mockResults) {
      console.log('ℹ️  Running in mock mode. Set ENABLE_NOVA_CANVAS=true for real processing.\n');
    } else {
      console.log('✅ Real Nova Canvas processing completed\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }

  // Test 3: Test the generate-with-subject endpoint
  console.log('🔄 Test 3: Testing generate-with-subject endpoint');
  try {
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch('http://localhost:3000/api/nova-canvas/generate-with-subject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectImageData: base64Image,
        prompt: 'Summer music festival promotional content',
        style: 'vibrant',
        removeBackground: true,
        releaseContext: {
          title: 'Summer Vibes',
          artist: 'Test Artist',
          genre: 'Electronic',
          releaseDate: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API request failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('✅ Generate with subject response:', {
      hasImageUrl: !!result.imageUrl,
      isMock: result.mock || false,
      s3Enabled: result.s3Enabled || false
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }

  console.log('\n✅ All tests passed successfully!');
  return true;
}

// Run the test
if (require.main === module) {
  testBackgroundRemoval().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testBackgroundRemoval }; 