"use client";

import { useState } from 'react';
import styles from './styles.module.css';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function ConfettiButtonPrototype() {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerConfetti = () => {
    setIsAnimating(true);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF0000', '#0000FF', '#FFFF00'], // Red, blue, yellow
      shapes: ['square'], // Keep the square particles for the pixel look
    });

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonContainer}>
        <Link href="/" className={styles.backButton}>←</Link>
      </div>
      
      <div className={styles.window}>
        <div className={styles.windowTitle}>
          Confetti button
        </div>
        <div className={styles.windowContent}>
          <h1 className={styles.title}>Click to celebrate</h1>
          <button 
            className={`${styles.confettiButton} ${isAnimating ? styles.animate : ''}`}
            onClick={triggerConfetti}
          >
            Celebrate
          </button>
        </div>
      </div>
    </div>
  );
} 