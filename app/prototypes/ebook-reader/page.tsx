'use client';

import { useState, useEffect } from 'react';
import { Noto_Serif_JP, Noto_Sans_JP } from 'next/font/google';
import styles from './styles.module.css';

const notoSerif = Noto_Serif_JP({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
});

const notoSans = Noto_Sans_JP({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
});

// Emoji mapping for common words
const emojiMap: Record<string, string> = {
  // People and emotions
  'love': '❤️',
  'happy': '😊',
  'sad': '😢',
  'laugh': '😄',
  'smile': '😊',
  'angry': '😠',
  'pride': '🦁',
  'prejudice': '🤨',
  
  // Actions
  'walk': '🚶',
  'run': '🏃',
  'dance': '💃',
  'sing': '🎵',
  'write': '✍️',
  'read': '📚',
  'speak': '💭',
  'think': '🤔',
  
  // Nature
  'sun': '☀️',
  'moon': '🌙',
  'tree': '🌳',
  'flower': '🌸',
  'rain': '🌧️',
  
  // Objects
  'book': '📖',
  'letter': '✉️',
  'house': '🏠',
  'door': '🚪',
  'chair': '🪑',
  'table': '🪑',
  'dress': '👗',
  'hat': '🎩',
  
  // Abstract concepts
  'time': '⏰',
  'money': '💰',
  'heart': '❤️',
  'mind': '🧠',
  'soul': '✨',
  'spirit': '✨',
  
  // Default for reading
  'default': '🤓'
};

export default function EbookReader() {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [currentEmoji, setCurrentEmoji] = useState('🤓');

  // Track cursor position and word hover
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      
      // Get the element under the cursor
      const element = document.elementFromPoint(e.clientX, e.clientY);
      
      // Check if we're hovering over the content area
      if (element?.closest(`.${styles.content}`)) {
        // Get the text content of the element
        const text = element.textContent || '';
        
        // Split the text into words and find the closest word to the cursor
        const words = text.split(/\s+/);
        const word = words.find(w => w.length > 0) || '';
        
        if (word) {
          const lowercaseWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
          // Find matching emoji
          const matchingKey = Object.keys(emojiMap).find(key => 
            lowercaseWord.includes(key) || key.includes(lowercaseWord)
          );
          
          if (matchingKey) {
            setCurrentEmoji(emojiMap[matchingKey]);
          } else {
            setCurrentEmoji(emojiMap.default);
          }
        }
      }
    };

    // Add a small debounce to prevent too many updates
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleMouseMove = (e: MouseEvent) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleMouseMove(e), 50);
    };

    window.addEventListener('mousemove', debouncedHandleMouseMove);
    return () => {
      window.removeEventListener('mousemove', debouncedHandleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  // We'll load the book content from a JSON file
  const [bookContent, setBookContent] = useState<{
    title: string;
    author: string;
    chapters: { title: string; content: string }[];
  } | null>(null);

  useEffect(() => {
    // We'll implement the book loading logic here
    const loadBook = async () => {
      try {
        const response = await fetch('/api/book/pride-and-prejudice');
        const data = await response.json();
        setBookContent(data);
      } catch (error) {
        console.error('Error loading book:', error);
      }
    };

    loadBook();
  }, []);

  if (!bookContent) {
    return (
      <div className={`${styles.container} ${notoSans.className}`}>
        <div className={styles.loading}>Loading book...</div>
        <div 
          className={styles.cursorFollower}
          style={{ 
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)` 
          }}
        >
          {currentEmoji}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles[theme]} ${notoSerif.className}`}>
      <div 
        className={styles.cursorFollower}
        style={{ 
          transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)` 
        }}
      >
        {currentEmoji}
      </div>
      <header className={`${styles.header} ${notoSans.className}`}>
        <h1>{bookContent.title}</h1>
        <p className={styles.author}>by {bookContent.author}</p>
        
        <div className={styles.controls}>
          <button 
            onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
            className={styles.controlButton}
          >
            A+
          </button>
          <button 
            onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
            className={styles.controlButton}
          >
            A-
          </button>
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'sepia')}
            className={styles.themeSelect}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
          </select>
        </div>
      </header>

      <main 
        className={styles.reader}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className={styles.chapter}>
          <h2>{bookContent.chapters[currentChapter - 1]?.title || `Chapter ${currentChapter}`}</h2>
          <div className={styles.content}>
            {bookContent.chapters[currentChapter - 1]?.content || 'Chapter content loading...'}
          </div>
        </div>
      </main>

      <footer className={`${styles.footer} ${notoSans.className}`}>
        <button 
          onClick={() => setCurrentChapter(prev => Math.max(prev - 1, 1))}
          disabled={currentChapter === 1}
          className={styles.navButton}
        >
          Previous Chapter
        </button>
        <span className={styles.pageInfo}>
          Chapter {currentChapter} of {bookContent.chapters.length}
        </span>
        <button 
          onClick={() => setCurrentChapter(prev => Math.min(prev + 1, bookContent.chapters.length))}
          disabled={currentChapter === bookContent.chapters.length}
          className={styles.navButton}
        >
          Next Chapter
        </button>
      </footer>
    </div>
  );
} 