
import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Spinner } from './Spinner';
import { ImageIcon, VideoIcon } from './Icons';

interface PromptBuilderProps {
    onUsePrompt: (prompt: string, target: 'imageGen' | 'videoGen') => void;
}

export const PromptBuilder: React.FC<PromptBuilderProps> = ({ onUsePrompt }) => {
    const [idea, setIdea] = useState('');
    const [target, setTarget] = useState<'image' | 'video'>('image');
    const [enhancedPrompt, setEnhancedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea.trim()) {
            setError('Silakan masukkan ide dasar.');
            return;
        }
        setIsLoading(true);
        setError('');
        setEnhancedPrompt('');

        try {
            const result = await geminiService.generateCreativePrompt(idea, target);
            setEnhancedPrompt(result.text);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(enhancedPrompt);
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Asisten Prompt</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Ubah ide sederhana Anda menjadi prompt yang kaya detail untuk hasil gambar dan video yang menakjubkan. Jelaskan ide Anda, dan biarkan AI menyempurnakannya.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="contoh: astronot menunggang kuda di mars"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
                    rows={4}
                    disabled={isLoading}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Target:</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setTarget('image')}
                                disabled={isLoading}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${target === 'image' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                <ImageIcon /> Gambar
                            </button>
                            <button
                                type="button"
                                onClick={() => setTarget('video')}
                                disabled={isLoading}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${target === 'video' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                <VideoIcon /> Video
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !idea.trim()}
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {isLoading ? <><Spinner /> Menyempurnakan...</> : 'Sempurnakan Prompt'}
                    </button>
                </div>
            </form>

            {error && <p className="mt-4 text-red-500 dark:text-red-400">{error}</p>}

            {(isLoading || enhancedPrompt) && (
                <div className="mt-6 flex-grow flex flex-col">
                    <h3 className="font-semibold text-lg mb-2 text-indigo-600 dark:text-indigo-300">Prompt yang Disempurnakan:</h3>
                    <div className="flex-grow p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[150px]">
                        {isLoading 
                            ? <div className="flex items-center text-gray-500 dark:text-gray-400"><Spinner /> Menciptakan prompt yang sempurna...</div>
                            : <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{enhancedPrompt}</p>
                        }
                    </div>
                    {!isLoading && enhancedPrompt && (
                        <div className="flex flex-wrap gap-4 mt-4">
                            <button
                                onClick={handleCopyToClipboard}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                                Salin
                            </button>
                             <button
                                onClick={() => onUsePrompt(enhancedPrompt, target === 'image' ? 'imageGen' : 'videoGen')}
                                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                {target === 'image' ? <><ImageIcon /> Gunakan untuk Gambar</> : <><VideoIcon /> Gunakan untuk Video</>}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};