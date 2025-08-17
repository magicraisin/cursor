import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface PersonalityResult {
  ip: string;
  agent: string;
  sequence: string;
  timestamp: number;
}

const dataFilePath = path.join(process.cwd(), 'data', 'personality-results.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read existing results
function readResults(): PersonalityResult[] {
  ensureDataDirectory();
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write results
function writeResults(results: PersonalityResult[]) {
  try {
    console.log('writeResults called with:', results.length, 'entries');
    console.log('Data file path:', dataFilePath);
    
    ensureDataDirectory();
    console.log('Data directory ensured');
    
    const jsonString = JSON.stringify(results, null, 2);
    console.log('JSON string created, length:', jsonString.length);
    
    fs.writeFileSync(dataFilePath, jsonString);
    console.log('File write completed successfully');
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
    
    const { agent, sequence } = requestBody;
    const ip = getClientIP(request);
    
    console.log('POST Debug:', { agent, sequence, ip });
    
    console.log('Attempting to read existing results...');
    const results = readResults();
    console.log('Existing results:', results.length, 'entries');
    console.log('Current results data:', results);
    
    // Check if this IP has already submitted a result
    const existingResult = results.find(result => result.ip === ip);
    if (existingResult) {
      console.log('Duplicate IP detected:', ip, 'existing agent:', existingResult.agent);
      // IP already exists, don't add duplicate
      return NextResponse.json({ 
        success: true, 
        message: 'Result already recorded for this IP',
        isNewResult: false,
        existingAgent: existingResult.agent
      });
    }
    
    // Add new result
    const newResult: PersonalityResult = {
      ip,
      agent,
      sequence,
      timestamp: Date.now()
    };
    
    console.log('Adding new result to array...');
    results.push(newResult);
    console.log('Results array after push:', results);
    
    console.log('Attempting to write results to file...');
    writeResults(results);
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
    const results = readResults();
    console.log('GET Debug - Total results:', results.length);
    console.log('All IPs:', results.map(r => ({ ip: r.ip, agent: r.agent })));
    
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