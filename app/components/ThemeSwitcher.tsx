'use client';

import { useState, useEffect } from 'react';

type Theme = 'vaporwave' | 'neumorphic';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('vaporwave');

  useEffect(() => {
    document.body.className = `${theme}`;
  }, [theme]);

  return (
    <div className={`theme-switcher ${theme}`}>
      <button
        onClick={() => setTheme(theme === 'vaporwave' ? 'neumorphic' : 'vaporwave')}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
        }}
      >
        Switch to {theme === 'vaporwave' ? 'Neumorphic' : 'Vaporwave'}
      </button>
    </div>
  );
} 