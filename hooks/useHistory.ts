import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem } from '../types';
import { addMedia, clearMedia, deleteMedia } from '../utils/db';
import { decode, createWavBlob } from '../utils/helpers';


const HISTORY_STORAGE_KEY = 'creativeSuiteHistory';
const MAX_HISTORY_ITEMS = 50; 

// Helper to convert data/blob URLs to Blobs
const dataToBlob = async (dataUrl: string): Promise<Blob> => {
    const response = await fetch(dataUrl);
    return await response.blob();
};


export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        setHistory(parsedHistory.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
      setHistory([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save history to localStorage:', error);
      }
    }
  }, [history, isLoaded]);

  const addHistoryItem = useCallback(async (item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem> => {
    const newHistoryItem: HistoryItem = {
      ...item,
      id: Date.now(),
      timestamp: Date.now(),
    };

    const itemForStorage: HistoryItem = { ...newHistoryItem };

    try {
        if (item.type === 'imageGen' || item.type === 'imageEdit' || item.type === 'videoGen') {
            const blob = await dataToBlob(item.data);
            await addMedia({ id: newHistoryItem.id, blob });
            itemForStorage.data = ''; 
        } else if (item.type === 'tts') {
            const decodedBytes = decode(item.data);
            const wavBlob = createWavBlob(decodedBytes, 1, 24000, 16);
            await addMedia({ id: newHistoryItem.id, blob: wavBlob });
            itemForStorage.data = '';
        }
    } catch (error) {
        console.error("Failed to save media to IndexedDB:", error);
    }

    setHistory(prev => {
      const newHistory = [itemForStorage, ...prev];
      if (newHistory.length > MAX_HISTORY_ITEMS) {
        const itemsToRemove = newHistory.splice(MAX_HISTORY_ITEMS);
        itemsToRemove.forEach(item => {
          if (item.type !== 'text') {
            deleteMedia(item.id).catch(err => console.error(`Failed to delete media ${item.id}`, err));
          }
        });
      }
      return newHistory;
    });

    return newHistoryItem;
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      await clearMedia();
    } catch (error) {
        console.error('Failed to clear history:', error);
    }
  }, []);

  return { history, addHistoryItem, clearHistory };
};