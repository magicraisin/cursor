import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface PersonalityResult {
  sessionId: string;
  agent: string;
  sequence: string;
  timestamp: number;
}

const KV_KEY = 'personality-results';

export async function POST() {
  try {
    console.log('🔍 Reading current results from KV...');
    const results = await kv.get<PersonalityResult[]>(KV_KEY) || [];
    console.log(`📊 Found ${results.length} total results`);
    
    // Count current Clippy results
    const clippyResults = results.filter(result => result.agent === 'Clippy');
    console.log(`🤖 Found ${clippyResults.length} Clippy results to remove`);
    
    if (clippyResults.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No Clippy data found to clear',
        removedCount: 0,
        totalResults: results.length
      });
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
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleared ${clippyResults.length} Clippy results`,
      removedCount: clippyResults.length,
      totalResults: filteredResults.length
    });
    
  } catch (error) {
    console.error('❌ Error clearing Clippy data:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to clear Clippy data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 