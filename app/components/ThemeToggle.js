'use client';

import { useEffect, useState } from 'react';

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

function HalfMoonIcon() {
  // Représente le mode tamisé : un cercle mi-plein, entre soleil et lune.
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const THEMES = ['light', 'dim', 'dark'];
const LABELS = { light: 'mode jour', dim: 'mode tamisé', dark: 'mode nuit' };

export default function ThemeToggle() {
  const [theme, setTheme] = useState(null); // null tant qu'on n'a pas lu la préférence côté client

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'light');
  }, []);

  function toggle() {
    const indexActuel = THEMES.indexOf(theme);
    const next = THEMES[(indexActuel + 1) % THEMES.length];
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('creneau-ct-theme', next); } catch {}
  }

  if (theme === null) return <span style={{ width: 34, height: 34, display: 'inline-block' }} />;

  const prochain = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Actuellement en ${LABELS[theme]} — passer en ${LABELS[prochain]}`}
      title={`Passer en ${LABELS[prochain]}`}
      className="theme-toggle"
    >
      {theme === 'light' ? <SunIcon /> : theme === 'dim' ? <HalfMoonIcon /> : <MoonIcon />}
    </button>
  );
}
