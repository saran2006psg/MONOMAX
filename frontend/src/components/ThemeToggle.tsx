import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg border transition-all duration-300 shadow-sm ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-yellow-400' 
          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
      }`}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {theme === 'light' ? (
          <Moon className="w-5 h-5 transition-all duration-300" />
        ) : (
          <Sun className="w-5 h-5 transition-all duration-300" />
        )}
      </div>
    </button>
  );
};