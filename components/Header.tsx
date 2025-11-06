

import React from 'react';
import { SparklesIcon, HistoryIcon, KeyIcon } from './Icons';

interface HeaderProps {
  onToggleHistory: () => void;
  onToggleApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleHistory, onToggleApiKeyModal }) => {
  return (
    <header className="relative text-center p-6 md:p-10">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500 mb-2 flex items-center justify-center gap-3">
        <SparklesIcon />
        Final Foto Video Creation
      </h1>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Perangkat AI Anda untuk pembuatan teks, gambar, dan video. Wujudkan ide Anda dengan mudah.
      </p>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2">
        <button 
          onClick={onToggleHistory}
          className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300/80 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          aria-label="Toggle history panel"
        >
          <HistoryIcon />
        </button>
        <button 
          onClick={onToggleApiKeyModal}
          className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300/80 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          aria-label="Atur Kunci API"
        >
          <KeyIcon />
        </button>
      </div>
    </header>
  );
};