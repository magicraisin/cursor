"use client";

// Template for creating a new prototype
// To use this template:
// 1. Create a new folder in app/prototypes with your prototype name
// 2. Copy this file and styles.module.css into your new folder
// 3. Create an 'images' folder for your prototype's images
// 4. Rename and customize the component and styles as needed

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './styles.module.css';

type NoteKey = keyof typeof NOTES;

// Musical notes mapping (2 octaves)
const NOTES = {
  'a': { note: 'C4', freq: 261.63 },
  'w': { note: 'C#4', freq: 277.18 },
  's': { note: 'D4', freq: 293.66 },
  'e': { note: 'D#4', freq: 311.13 },
  'd': { note: 'E4', freq: 329.63 },
  'f': { note: 'F4', freq: 349.23 },
  't': { note: 'F#4', freq: 369.99 },
  'g': { note: 'G4', freq: 392.00 },
  'y': { note: 'G#4', freq: 415.30 },
  'h': { note: 'A4', freq: 440.00 },
  'u': { note: 'A#4', freq: 466.16 },
  'j': { note: 'B4', freq: 493.88 },
  'k': { note: 'C5', freq: 523.25 },
  'o': { note: 'C#5', freq: 554.37 },
  'l': { note: 'D5', freq: 587.33 },
  'p': { note: 'D#5', freq: 622.25 },
  ';': { note: 'E5', freq: 659.25 },
} as const;

const WAVE_POINTS = 48; // Increased number of points for the background

export default function RetroSynth() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillators, setOscillators] = useState<Record<NoteKey, OscillatorNode | undefined>>({} as Record<NoteKey, OscillatorNode | undefined>);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [activeKeys, setActiveKeys] = useState<Set<NoteKey>>(new Set());
  const [volume, setVolume] = useState(0.5);
  const [wavePoints, setWavePoints] = useState<number[]>(Array(WAVE_POINTS).fill(0));
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animate waveform
  const animateWaveform = useCallback(() => {
    setWavePoints(prevPoints => {
      const newPoints = [...prevPoints];
      const activeNotes = Object.keys(oscillators).filter(key => 
        oscillators[key as NoteKey] !== undefined
      ) as NoteKey[];
      
      if (activeNotes.length > 0) {
        // Create a pixelated sine wave effect
        const time = Date.now() / 1000;
        for (let i = 0; i < WAVE_POINTS; i++) {
          const x = (i / WAVE_POINTS) * Math.PI * 2;
          let amplitude = 0;
          
          activeNotes.forEach(note => {
            const freq = NOTES[note].freq;
            amplitude += Math.sin(x * (freq / 100) + time * 10) * 20;
          });
          
          newPoints[i] = amplitude / activeNotes.length;
        }
      } else {
        // Gradually reset the waveform when no keys are pressed
        for (let i = 0; i < WAVE_POINTS; i++) {
          newPoints[i] *= 0.9;
        }
      }
      return newPoints;
    });

    animationFrameRef.current = requestAnimationFrame(animateWaveform);
  }, [oscillators]);

  // Start animation when component mounts
  useEffect(() => {
    let isActive = true;
    
    const animate = () => {
      if (isActive) {
        animateWaveform();
      }
    };
    
    animate();
    
    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateWaveform]);

  // Play a note
  const playNote = useCallback((key: NoteKey) => {
    if (!audioContext || oscillators[key]) return;

    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.type = waveform;
    osc.frequency.setValueAtTime(NOTES[key].freq, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.start();
    setOscillators(prev => ({ ...prev, [key]: osc }));
    setActiveKeys(prev => new Set(prev).add(key));
  }, [audioContext, oscillators, waveform, volume]);

  // Stop a note
  const stopNote = useCallback((key: NoteKey) => {
    const osc = oscillators[key];
    if (!osc) return;
    
    osc.stop();
    osc.disconnect();
    setOscillators(prev => {
      const newOsc = { ...prev };
      newOsc[key] = undefined;
      return newOsc;
    });
    setActiveKeys(prev => {
      const newKeys = new Set(prev);
      newKeys.delete(key);
      return newKeys;
    });
  }, [oscillators]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in NOTES) {
        playNote(key as NoteKey);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in NOTES) {
        stopNote(key as NoteKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playNote, stopNote]);

  return (
    <div className={styles.container}>
      <div className={styles.waveformContainer}>
        <div className={styles.waveform}>
          {wavePoints.map((point, index) => (
            <div
              key={index}
              className={`${styles.wavePoint} ${Math.abs(point) > 0.1 ? styles.active : ''}`}
              style={{
                transform: `scaleY(${Math.max(1, Math.abs(point))})`,
              }}
            />
          ))}
        </div>
      </div>

      <div className={styles.synthWindow}>
        <div className={styles.titleBar}>
          <div className={styles.titleButtons}>
            <span className={styles.closeButton} />
            <span className={styles.minimizeButton} />
            <span className={styles.zoomButton} />
          </div>
          <span className={styles.titleText}>RetroSynth 1.0</span>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Waveform:</label>
            <select 
              value={waveform}
              onChange={(e) => setWaveform(e.target.value as OscillatorType)}
              className={styles.select}
            >
              <option value="sine">Sine</option>
              <option value="square">Square</option>
              <option value="sawtooth">Sawtooth</option>
              <option value="triangle">Triangle</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label>Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>

        <div className={styles.keyboard}>
          {(Object.entries(NOTES) as [NoteKey, { note: string; freq: number }][]).map(([key, { note }]) => (
            <div
              key={key}
              className={`${styles.key} ${note.includes('#') ? styles.blackKey : styles.whiteKey} ${
                activeKeys.has(key) ? styles.active : ''
              }`}
              onMouseDown={() => playNote(key)}
              onMouseUp={() => stopNote(key)}
              onMouseLeave={() => stopNote(key)}
            >
              <span className={styles.keyLabel}>{key.toUpperCase()}</span>
              <span className={styles.noteLabel}>{note}</span>
            </div>
          ))}
        </div>

        <div className={styles.instructions}>
          <p>Use your keyboard to play! Press A-L and W-P for different notes.</p>
        </div>
      </div>
    </div>
  );
} 