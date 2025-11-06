

import React, { useState, useEffect, useCallback } from 'react';
import { TextGeneration } from './components/TextGeneration';
import { ImageGeneration } from './components/ImageGeneration';
import { ImageEditing } from './components/ImageEditing';
import { VideoGeneration } from './components/VideoGeneration';
import { TextToSpeech } from './components/TextToSpeech';
import { PromptBuilder } from './components/PromptBuilder';
import { Header } from './components/Header';
import { TabButton } from './components/TabButton';
import { HistoryPanel } from './components/HistoryPanel';
import { TextIcon, ImageIcon, VideoIcon, Volume2Icon, PencilIcon, MagicWandIcon } from './components/Icons';
import { useHistory } from './hooks/useHistory';
import type { Feature, HistoryItem } from './types';

const API_KEY_STORAGE_KEY = 'geminiApiKey';

const ApiKeyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentApiKey: string | null;
}> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [key, setKey] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 text-gray-900 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-300">Atur Kunci API Gemini</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Kunci API Anda disimpan dengan aman di penyimpanan lokal browser Anda dan tidak pernah dikirim ke server kami.
        </p>
        <div>
          <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kunci API Anda
          </label>
          <input
            id="api-key-input"
            type="password"
            placeholder="Masukkan kunci API Anda di sini..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
           <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Dapatkan kunci API Anda dari <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Google AI Studio</a>.
          </p>
        </div>
        {currentApiKey && (
            <p className="text-xs text-green-600 dark:text-green-400">Kunci API yang ada telah disimpan.</p>
        )}
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={!key.trim()} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 transition-colors">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Feature>('text');
  const [initialVideoImage, setInitialVideoImage] = useState<string | null>(null);
  const [initialEditImage, setInitialEditImage] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [lastCreation, setLastCreation] = useState<HistoryItem | null>(null);
  const { history, addHistoryItem, clearHistory } = useHistory();
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
  // API Key Logic
  const [apiKey, setApiKey] = useState<string | null>(() => {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (e) { 
        console.error("Could not access localStorage:", e);
        return null; 
    }
  });

  const saveApiKey = useCallback((key: string) => {
      try {
          localStorage.setItem(API_KEY_STORAGE_KEY, key);
          setApiKey(key);
      } catch (e) {
          console.error("Failed to save API key", e);
      }
  }, []);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Prompt for key on first load if it's not set
  useEffect(() => {
      if (!apiKey) {
          setIsApiKeyModalOpen(true);
      }
  }, [apiKey]);


  // Fix: Use React.ReactElement instead of JSX.Element to resolve "Cannot find namespace 'JSX'" error.
  const features: { id: Feature; label: string; icon: React.ReactElement }[] = [
    { id: 'text', label: 'Teks', icon: <TextIcon /> },
    { id: 'promptBuilder', label: 'Asisten Prompt', icon: <MagicWandIcon /> },
    { id: 'imageGen', label: 'Gambar', icon: <ImageIcon /> },
    { id: 'imageEdit', label: 'Edit Gambar', icon: <PencilIcon /> },
    { id: 'videoGen', label: 'Video', icon: <VideoIcon /> },
    { id: 'tts', label: 'Suara', icon: <Volume2Icon /> },
  ];

  const handleGenerateVideoFromImage = (imageUrl: string) => {
    setInitialVideoImage(imageUrl);
    setActiveTab('videoGen');
  };

  const handleEditImage = (imageUrl: string) => {
    setInitialEditImage(imageUrl);
    setActiveTab('imageEdit');
  };

  const handleUsePrompt = (prompt: string, target: 'imageGen' | 'videoGen') => {
    setInitialPrompt(prompt);
    setActiveTab(target);
  };

  const clearInitialPrompt = () => {
    setInitialPrompt(null);
  }

  const clearInitialEditImage = () => {
    setInitialEditImage(null);
  }

  const handleTabLeave = () => {
    setInitialVideoImage(null);
    setInitialPrompt(null);
  }

  const handleCreationComplete = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem = await addHistoryItem(item);
    // lastCreation is used by the Narration Assistant, which only works with media.
    if (item.type === 'imageGen' || item.type === 'imageEdit' || item.type === 'videoGen') {
      setLastCreation(newHistoryItem);
    }
  };
  
  const handleReusePrompt = (item: HistoryItem) => {
    // We can't reuse prompts for TTS or Text generation in the same way
    if (item.type === 'imageGen' || item.type === 'imageEdit' || item.type === 'videoGen') {
        setActiveTab(item.type);
        setInitialPrompt(item.prompt);
        setIsHistoryPanelOpen(false);
    }
    // For text and tts, we can just copy the prompt to the clipboard as a simple reuse action
    else {
        navigator.clipboard.writeText(item.prompt);
        // Maybe add a toast notification here in the future
        setIsHistoryPanelOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'text':
        return <TextGeneration onCreationComplete={handleCreationComplete} />;
      case 'promptBuilder':
        return <PromptBuilder onUsePrompt={handleUsePrompt} />;
      case 'imageGen':
        return <ImageGeneration onGenerateVideo={handleGenerateVideoFromImage} initialPrompt={initialPrompt} onPromptConsumed={clearInitialPrompt} onCreationComplete={handleCreationComplete} onEditImage={handleEditImage} />;
      case 'imageEdit':
        return <ImageEditing onGenerateVideo={handleGenerateVideoFromImage} onCreationComplete={handleCreationComplete} initialImage={initialEditImage} onImageConsumed={clearInitialEditImage} />;
      case 'videoGen':
        return <VideoGeneration initialImage={initialVideoImage} initialPrompt={initialPrompt} onLeave={handleTabLeave} onCreationComplete={handleCreationComplete} />;
      case 'tts':
        return <TextToSpeech lastCreation={lastCreation} onCreationComplete={handleCreationComplete} />;
      default:
        return <TextGeneration onCreationComplete={handleCreationComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={saveApiKey}
        currentApiKey={apiKey}
      />
      <Header 
        onToggleHistory={() => setIsHistoryPanelOpen(prev => !prev)} 
        onToggleApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />
      <HistoryPanel 
        isOpen={isHistoryPanelOpen} 
        onClose={() => setIsHistoryPanelOpen(false)}
        items={history}
        onClear={clearHistory}
        onReusePrompt={handleReusePrompt}
      />
      <main className="container mx-auto p-2 sm:p-4 md:p-6">
        <div className="mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 sm:p-2 max-w-max mx-auto shadow-md">
          <div className="flex flex-wrap justify-center gap-2">
            {features.map((feature) => (
              <TabButton
                key={feature.id}
                label={feature.label}
                icon={feature.icon}
                isActive={activeTab === feature.id}
                onClick={() => setActiveTab(feature.id)}
              />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-3 sm:p-6 md:p-8 min-h-[60vh]">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 dark:text-gray-500 text-sm">
        <p>by 24 Learning Centre</p>
      </footer>
    </div>
  );
};

export default App;