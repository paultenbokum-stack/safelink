 'use client';
import { useTheme } from '@/lib/theme-context';
export default function ThemeSwitch() {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === 'dark';
  return <button type="button" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'} disabled={!mounted} onClick={toggleTheme} className="w-11 h-11 shrink-0 rounded-full text-on-surface-variant hover:bg-secondary/10"><span aria-hidden="true" className="material-symbols-outlined">{isDark ? 'dark_mode' : 'light_mode'}</span></button>;
}
