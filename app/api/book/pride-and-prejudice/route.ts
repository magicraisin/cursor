import { NextResponse } from 'next/server';
import { processBook } from '../../../prototypes/ebook-reader/utils/bookLoader';

export async function GET() {
  try {
    const book = processBook();
    return NextResponse.json(book);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load book content' },
      { status: 500 }
    );
  }
} 