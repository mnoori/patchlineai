#!/usr/bin/env node

// Test script to verify artist profile functionality
const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-123';

async function testArtistProfileAPI() {
  console.log('🧪 Testing Artist Profile API');
  console.log('============================\n');

  try {
    // Test 1: Check if artist profile exists
    console.log('1. Checking existing artist profile...');
    const getResponse = await fetch(`${BASE_URL}/api/spotify/artist-profile?userId=${TEST_USER_ID}`);
    const getResult = await getResponse.json();
    
    if (getResult.artistProfile) {
      console.log('✅ Found existing profile:', getResult.artistProfile.artistName);
      console.log('   Artist ID:', getResult.artistProfile.artistId);
    } else {
      console.log('ℹ️  No existing profile found');
    }

    // Test 2: Store ALGORYX profile
    console.log('\n2. Storing ALGORYX artist profile...');
    const storeResponse = await fetch(`${BASE_URL}/api/spotify/artist-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        artistId: '7ibWrazAoXwtMpiwDlpZ9k',
        artistName: 'ALGORYX',
        spotifyUrl: 'https://open.spotify.com/artist/7ibWrazAoXwtMpiwDlpZ9k'
      })
    });

    if (storeResponse.ok) {
      const storeResult = await storeResponse.json();
      console.log('✅ Profile stored successfully:', storeResult.artistProfile.artistName);
    } else {
      const error = await storeResponse.json();
      console.log('❌ Failed to store profile:', error.error);
    }

    // Test 3: Verify profile was stored
    console.log('\n3. Verifying stored profile...');
    const verifyResponse = await fetch(`${BASE_URL}/api/spotify/artist-profile?userId=${TEST_USER_ID}`);
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.artistProfile && verifyResult.artistProfile.artistName === 'ALGORYX') {
      console.log('✅ Profile verification successful');
      console.log('   Artist Name:', verifyResult.artistProfile.artistName);
      console.log('   Artist ID:', verifyResult.artistProfile.artistId);
    } else {
      console.log('❌ Profile verification failed');
    }

    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testArtistProfileAPI(); 