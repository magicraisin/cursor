const { kv } = require('@vercel/kv');

const KV_KEY = 'personality-results';

async function clearClippyData() {
  try {
    console.log('🔍 Reading current results from KV...');
    const results = await kv.get(KV_KEY) || [];
    console.log(`📊 Found ${results.length} total results`);
    
    // Count current Clippy results
    const clippyResults = results.filter(result => result.agent === 'Clippy');
    console.log(`🤖 Found ${clippyResults.length} Clippy results to remove`);
    
    if (clippyResults.length === 0) {
      console.log('✅ No Clippy data found to clear');
      return;
    }
    
    // Filter out Clippy results
    const filteredResults = results.filter(result => result.agent !== 'Clippy');
    console.log(`📝 Keeping ${filteredResults.length} non-Clippy results`);
    
    // Write the filtered results back to KV
    console.log('💾 Writing filtered results back to KV...');
    await kv.set(KV_KEY, filteredResults);
    
    console.log('✅ Successfully cleared Clippy data!');
    console.log(`📈 Removed ${clippyResults.length} Clippy results`);
    console.log(`📊 Total results now: ${filteredResults.length}`);
    
  } catch (error) {
    console.error('❌ Error clearing Clippy data:', error);
    throw error;
  }
}

// Run the script
clearClippyData()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 