
import React, { useState, useEffect } from 'react';
import type { HistoryItem } from '../types';
import { TextIcon, ImageIcon, VideoIcon, Volume2Icon, PencilIcon, DownloadIcon } from './Icons';
import { getMedia } from '../utils/db';
import { Spinner } from './Spinner';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onClear: () => void;
  onReusePrompt: (item: HistoryItem) => void;
}

const TypeIcon: React.FC<{ type: HistoryItem['type'] }> = ({ type }) => {
  switch (type) {
    case 'text': return <TextIcon />;
    case 'imageGen': return <ImageIcon />;
    case 'imageEdit': return <PencilIcon />;
    case 'videoGen': return <VideoIcon />;
    case 'tts': return <Volume2Icon />;
    default: return null;
  }
};

const HistoryItemCard: React.FC<{ item: HistoryItem; onReusePrompt: (item: HistoryItem) => void; onDownload: (item: HistoryItem) => void; }> = ({ item, onReusePrompt, onDownload }) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadMedia = async () => {
      if (item.type !== 'text') {
        setIsLoading(true);
        try {
          const blob = await getMedia(item.id);
          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            setMediaUrl(objectUrl);
          }
        } catch (error) {
            console.error(`Failed to load media for history item ${item.id}:`, error);
        } finally {
            setIsLoading(false);
        }
      }
    };
    
    loadMedia();
    
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item.id, item.type]);


  const renderPreview = () => {
    if (isLoading) {
      return <Spinner />;
    }
    if (mediaUrl) {
        if (item.type === 'imageGen' || item.type === 'imageEdit') {
            return <img src={mediaUrl} alt="pratinjau" className="w-full h-full object-cover" />;
        }
        if (item.type === 'videoGen') {
            return <video src={mediaUrl} muted loop playsInline className="w-full h-full object-cover" />;
        }
    }
    // Fallback for TTS or if media fails to load
    return <div className="text-gray-600 dark:text-gray-500"><TypeIcon type={item.type} /></div>;
  };

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg flex gap-3">
      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center overflow-hidden">
        {renderPreview()}
      </div>
      <div className="flex-grow overflow-hidden">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          <TypeIcon type={item.type} />
          <span>{new Date(item.timestamp).toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate" title={item.prompt}>{item.prompt}</p>
        <div className="flex gap-2 mt-2">
          <button onClick={() => onReusePrompt(item)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md">Gunakan Ulang</button>
          <button onClick={() => onDownload(item)} className="px-2 py-1 text-xs bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 rounded-md flex items-center gap-1"><DownloadIcon /> Unduh</button>
        </div>
      </div>
    </div>
  );
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, items, onClear, onReusePrompt }) => {

  const handleDownload = async (item: HistoryItem) => {
    const link = document.createElement('a');
    let fileName = `${item.type}-${item.id}`;
    let blob: Blob | null = null;

    if (item.type === 'text') {
      blob = new Blob([item.data], { type: 'text/plain' });
      fileName += '.txt';
    } else {
      try {
        blob = await getMedia(item.id);
        if (item.type === 'tts') fileName += '.wav';
        else if (item.type === 'videoGen') fileName += '.mp4';
        else if (item.type === 'imageGen' || item.type === 'imageEdit') fileName += '.jpg';
      } catch (error) {
        console.error(`Failed to get media for download:`, error);
        // Optionally, show an error message to the user
        return;
      }
    }
    
    if (blob) {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } else {
        console.error("Could not create blob for download.");
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-50 dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-300">Riwayat Kreasi</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">&times;</button>
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto space-y-3">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center mt-8">Belum ada kreasi.</p>
          ) : (
            items.map(item => <HistoryItemCard key={item.id} item={item} onReusePrompt={onReusePrompt} onDownload={handleDownload} />)
          )}
        </div>
        
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={onClear} 
              className="w-full py-2 px-4 bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/80 rounded-lg transition-colors"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>
    </>
  );
};