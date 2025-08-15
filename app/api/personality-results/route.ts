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
  ensureDataDirectory();
  fs.writeFileSync(dataFilePath, JSON.stringify(results, null, 2));
}

// Get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const { agent, sequence } = await request.json();
    const ip = getClientIP(request);
    
    const results = readResults();
    
    // Check if this IP has already submitted a result
    const existingResult = results.find(result => result.ip === ip);
    if (existingResult) {
      // IP already exists, don't add duplicate
      return NextResponse.json({ 
        success: true, 
        message: 'Result already recorded for this IP',
        isNewResult: false 
      });
    }
    
    // Add new result
    const newResult: PersonalityResult = {
      ip,
      agent,
      sequence,
      timestamp: Date.now()
    };
    
    results.push(newResult);
    writeResults(results);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Result recorded',
      isNewResult: true 
    });
  } catch (error) {
    console.error('Error saving personality result:', error);
    return NextResponse.json({ success: false, error: 'Failed to save result' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const results = readResults();
    
    // Calculate leaderboard
    const agentCounts: { [key: string]: number } = {};
    
    results.forEach(result => {
      agentCounts[result.agent] = (agentCounts[result.agent] || 0) + 1;
    });
    
    // Sort by count (descending)
    const leaderboard = Object.entries(agentCounts)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count);
    
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