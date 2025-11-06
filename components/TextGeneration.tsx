
import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Spinner } from './Spinner';
import type { HistoryItem } from '../types';


// Fix: Use correct model name 'gemini-flash-lite-latest' per guidelines.
type Model = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-flash-lite-latest';
declare const marked: any;

interface TextGenerationProps {
  onCreationComplete: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export const TextGeneration: React.FC<TextGenerationProps> = ({ onCreationComplete }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [responseHtml, setResponseHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [model, setModel] = useState<Model>('gemini-2.5-flash');
  const [useThinking, setUseThinking] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Silakan masukkan perintah.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResponseHtml('');
    try {
      const result = await geminiService.generateText(prompt, model, useThinking);
      if (typeof marked !== 'undefined') {
        setResponseHtml(marked.parse(result.text));
      } else {
        // Fallback to pre-wrap if marked is not loaded
        setResponseHtml(`<p style="white-space: pre-wrap;">${result.text}</p>`);
      }
      onCreationComplete({ type: 'text', prompt, data: result.text });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Pembuatan Teks</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Hasilkan teks untuk tugas apa pun. Gunakan "Mode Berpikir" dengan Gemini 2.5 Pro untuk tantangan paling kompleks Anda.</p>
      
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="contoh: Tulis cerita pendek tentang robot yang menemukan musik."
          className="w-full flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
          rows={6}
          disabled={isLoading}
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-4">
            <label htmlFor="model-select" className="font-semibold text-gray-700 dark:text-gray-300">Model:</label>
            <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value as Model)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                disabled={isLoading}
            >
                {/* Fix: Use correct model name 'gemini-flash-lite-latest' per guidelines. */}
                <option value="gemini-flash-lite-latest">Flash Lite (Tercepat)</option>
                <option value="gemini-2.5-flash">Flash (Seimbang)</option>
                <option value="gemini-2.5-pro">Pro (Kompleks)</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="thinking-mode"
              checked={useThinking}
              onChange={(e) => setUseThinking(e.target.checked)}
              disabled={isLoading || model !== 'gemini-2.5-pro'}
              className="w-4 h-4 text-indigo-600 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
            />
            <label 
              htmlFor="thinking-mode" 
              className={`ml-2 text-sm font-medium ${model !== 'gemini-2.5-pro' ? 'text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}
            >
              Mode Berpikir (hanya Pro)
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 sm:px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? <><Spinner /> Membuat...</> : 'Buat'}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-red-500 dark:text-red-400">{error}</p>}
      
      {responseHtml && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-2 text-indigo-600 dark:text-indigo-300">Respons:</h3>
          <div 
             className="markdown-content text-gray-800 dark:text-gray-200"
             dangerouslySetInnerHTML={{ __html: responseHtml }}
          />
        </div>
      )}
    </div>
  );
};