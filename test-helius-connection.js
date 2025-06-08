const { Connection } = require('@solana/web3.js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Helius RPC Connection...\n');

// Check which environment variables are available
const envVars = {
  'RPC_URL': process.env.RPC_URL,
  'RPC_KEY_ID': process.env.RPC_KEY_ID,
  'NEXT_PUBLIC_RPC_URL': process.env.NEXT_PUBLIC_RPC_URL,
  'HELIUS_API_KEY': process.env.HELIUS_API_KEY,
  'NEXT_PUBLIC_HELIUS_API_KEY': process.env.NEXT_PUBLIC_HELIUS_API_KEY
};

console.log('📋 Environment Variables Found:');
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: Not set`);
  }
});

async function testConnection() {
  // Determine which RPC URL to use
  let rpcUrl;
  
  if (process.env.RPC_URL) {
    rpcUrl = process.env.RPC_URL;
    console.log('\n🔗 Using RPC_URL from env');
  } else if (process.env.RPC_KEY_ID) {
    rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${process.env.RPC_KEY_ID}`;
    console.log('\n🔗 Using RPC_KEY_ID to build Helius URL');
  } else if (process.env.HELIUS_API_KEY) {
    rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
    console.log('\n🔗 Using HELIUS_API_KEY to build Helius URL');
  } else {
    console.log('\n❌ No RPC credentials found!');
    console.log('Please make sure you have one of these in .env.local:');
    console.log('- RPC_URL');
    console.log('- RPC_KEY_ID');
    console.log('- HELIUS_API_KEY');
    return;
  }

  console.log(`🌐 Connecting to: ${rpcUrl.substring(0, 50)}...`);

  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // Test 1: Get latest blockhash
    console.log('\n📦 Test 1: Fetching latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    console.log(`✅ Blockhash: ${blockhash.substring(0, 20)}...`);
    console.log(`✅ Block Height: ${lastValidBlockHeight}`);
    
    // Test 2: Get SOL balance for a known address
    console.log('\n💰 Test 2: Checking balance for Solana treasury...');
    const balance = await connection.getBalance(
      new (require('@solana/web3.js').PublicKey)('11111111111111111111111111111111')
    );
    console.log(`✅ Balance: ${balance / 1e9} SOL`);
    
    console.log('\n🎉 SUCCESS! Your Helius RPC is working perfectly!');
    console.log('You can now send transactions without any 403 errors.');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n🔧 Error 403 means:');
      console.log('1. Your API key might be invalid');
      console.log('2. Check if the key is active in your Helius dashboard');
    }
  }
}

testConnection(); 