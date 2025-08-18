import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface PersonalityResult {
  sessionId: string;
  agent: string;
  sequence: string;
  timestamp: number;
}

const KV_KEY = 'personality-results'; // Force redeploy

// Read existing results from KV storage
async function readResults(): Promise<PersonalityResult[]> {
  try {
    console.log('Reading results from KV...');
    const data = await kv.get<PersonalityResult[]>(KV_KEY);
    console.log('KV read result:', data ? `${data.length} entries` : 'null/empty');
    return data || [];
  } catch (error) {
    console.error('ERROR reading from KV:', error);
    return [];
  }
}

// Write results to KV
async function writeResults(results: PersonalityResult[]) {
  try {
    console.log('writeResults called with:', results.length, 'entries');
    console.log('Writing to KV key:', KV_KEY);
    
    await kv.set(KV_KEY, results);
    console.log('KV write completed successfully');
  } catch (error) {
    console.error('ERROR in writeResults:', error);
    throw error;
  }
}

// Get client IP
function getClientIP(request: NextRequest): string {
  // Get various IP headers (Vercel uses these)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  const userAgent = request.headers.get('user-agent') || '';
  
  console.log('IP Detection Debug:', {
    forwarded,
    realIP, 
    vercelIP,
    userAgent: userAgent.substring(0, 100)
  });
  
  // Try different IP headers in order of preference
  if (vercelIP) {
    return vercelIP.split(',')[0].trim();
  }
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  
  // Create a unique identifier combining IP and User-Agent for better uniqueness
  const fallbackId = `unknown-${userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}-${Date.now().toString().slice(-6)}`;
  return fallbackId;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST REQUEST START ===');
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { agent, sequence, sessionId } = requestBody;
    
    console.log('POST Debug:', { agent, sequence, sessionId });
    
    console.log('Attempting to read existing results...');
    const results = await readResults();
    console.log('Existing results:', results.length, 'entries');
    console.log('Current results data:', results);
    
    // Check if this sessionId has already submitted a result
    const existingResult = results.find(result => result.sessionId === sessionId);
    if (existingResult) {
      console.log('Duplicate sessionId detected:', sessionId, 'existing agent:', existingResult.agent);
      // SessionId already exists, don't add duplicate
      return NextResponse.json({ 
        success: true, 
        message: 'Result already recorded for this session',
        isNewResult: false,
        existingAgent: existingResult.agent
      });
    }
    
    // Add new result
    const newResult: PersonalityResult = {
      sessionId,
      agent,
      sequence,
      timestamp: Date.now()
    };
    
    console.log('Adding new result to array...');
    results.push(newResult);
    console.log('Results array after push:', results);
    
    console.log('Attempting to write results to KV...');
    await writeResults(results);
    console.log('Write completed successfully');
    
    console.log('New result saved:', newResult);
    console.log('Total results now:', results.length);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Result recorded',
      isNewResult: true 
    });
  } catch (error) {
    console.error('=== ERROR SAVING PERSONALITY RESULT ===');
    console.error('Error details:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      success: false, 
      error: `Failed to save result: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const results = await readResults();
    console.log('GET Debug - Total results:', results.length);
    console.log('All Sessions:', results.map(r => ({ sessionId: r.sessionId, agent: r.agent })));
    
    // Calculate leaderboard
    const agentCounts: { [key: string]: number } = {};
    
    results.forEach(result => {
      agentCounts[result.agent] = (agentCounts[result.agent] || 0) + 1;
    });
    
    // Sort by count (descending)
    const leaderboard = Object.entries(agentCounts)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count);
    
    console.log('Leaderboard:', leaderboard);
    
    return NextResponse.json({
      success: true,
      leaderboard,
      totalResults: results.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

// Temporary DELETE method to clear specific agent data
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const agent = url.searchParams.get('agent');
    
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent parameter required' }, { status: 400 });
    }
    
    console.log(`🔍 Reading current results to clear ${agent} data...`);
    const results = await readResults();
    console.log(`📊 Found ${results.length} total results`);
    
    // Count current results for the specified agent
    const agentResults = results.filter(result => result.agent === agent);
    console.log(`🤖 Found ${agentResults.length} ${agent} results to remove`);
    
    if (agentResults.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: `No ${agent} data found to clear`,
        removedCount: 0,
        totalResults: results.length
      });
    }
    
    // Filter out the specified agent's results
    const filteredResults = results.filter(result => result.agent !== agent);
    console.log(`📝 Keeping ${filteredResults.length} non-${agent} results`);
    
    // Write the filtered results back to KV
    console.log('💾 Writing filtered results back to KV...');
    await writeResults(filteredResults);
    
    console.log(`✅ Successfully cleared ${agent} data!`);
    console.log(`📈 Removed ${agentResults.length} ${agent} results`);
    console.log(`📊 Total results now: ${filteredResults.length}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleared ${agentResults.length} ${agent} results`,
      removedCount: agentResults.length,
      totalResults: filteredResults.length
    });
    
  } catch (error) {
    console.error('❌ Error clearing agent data:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to clear agent data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 