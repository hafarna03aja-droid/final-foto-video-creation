
import React from 'react';

interface TabButtonProps {
  label: string;
  // Fix: Use React.ReactElement instead of JSX.Element to resolve "Cannot find namespace 'JSX'" error.
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};