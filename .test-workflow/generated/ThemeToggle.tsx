
import React from 'react';
import { useTheme } from './ThemeContext';

interface ThemeToggleProps {
  disabled?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ disabled = false, className = '' }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      disabled={disabled}
      className={`theme-toggle ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      role="switch"
      aria-checked={isDark}
    >
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">
        {isDark ? '🌙' : '☀️'} {isDark ? 'Dark' : 'Light'} Mode
      </span>
    </button>
  );
};
      