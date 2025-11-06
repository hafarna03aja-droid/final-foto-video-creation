
import React, { useState, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import { Spinner } from './Spinner';
import type { AspectRatio, HistoryItem } from '../types';
import { fileToBase64 } from '../utils/helpers';
import { DownloadIcon, VideoIcon, MegaphoneIcon, PencilIcon } from './Icons';
import { SocialMediaModal } from './SocialMediaModal';

interface ImageGenerationProps {
  onGenerateVideo: (imageUrl: string) => void;
  initialPrompt?: string | null;
  onPromptConsumed: () => void;
  onCreationComplete: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  onEditImage: (imageUrl: string) => void;
}

const aspectRatios: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

export const ImageGeneration: React.FC<ImageGenerationProps> = ({ onGenerateVideo, initialPrompt, onPromptConsumed, onCreationComplete, onEditImage }) => {
  const [activeMode, setActiveMode] = useState<'generate' | 'blend'>('generate');

  // State for Text-to-Image (Imagen)
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  // State for Image Blending (Nano Banana)
  const [blendPrompt, setBlendPrompt] = useState<string>('');
  const [blendImages, setBlendImages] = useState<{ file: File; url: string }[]>([]);

  // Shared state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSocialModalOpen, setIsSocialModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      // Consume the prompt so it's not used again on re-render
      onPromptConsumed();
    }
  }, [initialPrompt, onPromptConsumed]);

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Silakan masukkan perintah.');
      return;
    }
    setIsLoading(true);
    setError('');
    setImageUrl(null);
    try {
      const result = await geminiService.generateImage(prompt, aspectRatio);
      const image = result.generatedImages?.[0];
      if (image) {
        const url = `data:image/jpeg;base64,${image.image.imageBytes}`;
        setImageUrl(url);
        onCreationComplete({ type: 'imageGen', prompt, data: url });
      } else {
        throw new Error('Pembuatan gambar gagal mengembalikan gambar.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBlendFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Explicitly type `file` as `File` to resolve TS inference issue.
      const newImages = Array.from(files).map((file: File) => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setBlendImages(prev => [...prev, ...newImages]);
      setImageUrl(null);
      setError('');
    }
  };
  
  const removeBlendImage = (index: number) => {
    setBlendImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleBlendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blendImages.length === 0) {
      setError('Silakan unggah setidaknya satu gambar.');
      return;
    }
    if (!blendPrompt.trim()) {
      setError('Silakan masukkan perintah.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setImageUrl(null);
    
    try {
      const imagePayloads = await Promise.all(
        blendImages.map(async (img) => {
          const base64 = await fileToBase64(img.file);
          return { base64, mimeType: img.file.type };
        })
      );
      
      const result = await geminiService.blendImages(blendPrompt, imagePayloads, aspectRatio);
      
      const candidate = result.candidates?.[0];
      const part = candidate?.content?.parts?.find(p => p.inlineData);

      if (part?.inlineData) {
        const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        setImageUrl(url);
        onCreationComplete({ type: 'imageEdit', prompt: blendPrompt, data: url });
      } else {
          throw new Error('Proses pemaduan gagal mengembalikan gambar baru.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGenerateMode = () => (
    <>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Buat gambar menakjubkan berkualitas tinggi dari perintah teks menggunakan Imagen 4.0. Pilih rasio aspek yang Anda inginkan.</p>
      <form onSubmit={handleGenerateSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="contoh: Foto sinematik robot krom yang sedang berselancar di ombak kosmik."
            className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-5 py-2 sm:px-6 sm:py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? <><Spinner /> Membuat...</> : 'Buat'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rasio Aspek</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((ar) => (
              <button
                key={ar.value}
                type="button"
                onClick={() => setAspectRatio(ar.value)}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  aspectRatio === ar.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </>
  );

  const renderBlendMode = () => (
    <>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Padukan beberapa gambar dengan perintah teks untuk menciptakan hasil yang <strong>profesional dan berkualitas tinggi, cocok untuk iklan</strong>. Teknologi kami secara otomatis menyempurnakan perintah Anda untuk hasil yang halus dan berestetika teknologi tinggi.</p>
      <form onSubmit={handleBlendSubmit} className="space-y-4">
        <div>
          <label htmlFor="blend-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unggah Gambar (pilih beberapa)</label>
          <input
            id="blend-image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleBlendFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 dark:file:bg-indigo-50 dark:hover:file:bg-indigo-100"
            disabled={isLoading}
          />
        </div>

        {blendImages.length > 0 && (
          <div className="flex flex-wrap gap-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
            {blendImages.map((image, index) => (
              <div key={index} className="relative">
                <img src={image.url} alt={`pratinjau ${index + 1}`} className="h-24 w-24 object-cover rounded-md" />
                <button
                  type="button"
                  onClick={() => removeBlendImage(index)}
                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition-colors"
                  disabled={isLoading}
                >
                  &#x2715;
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rasio Aspek</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((ar) => (
              <button
                key={ar.value}
                type="button"
                onClick={() => setAspectRatio(ar.value)}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  aspectRatio === ar.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={blendPrompt}
            onChange={(e) => setBlendPrompt(e.target.value)}
            placeholder="contoh: Jadikan produk ini sebagai pusat iklan mobil futuristik"
            className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || blendImages.length === 0 || !blendPrompt.trim()}
            className="px-5 py-2 sm:px-6 sm:py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? <><Spinner /> Memadukan...</> : 'Padukan Gambar'}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div>
       {isSocialModalOpen && imageUrl && (
        <SocialMediaModal
          mediaUrl={imageUrl}
          mediaType="image"
          base64Media={imageUrl.split(',')[1]}
          prompt={activeMode === 'generate' ? prompt : blendPrompt}
          onClose={() => setIsSocialModalOpen(false)}
        />
      )}
      <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Pembuatan & Pemaduan Gambar</h2>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button 
          onClick={() => setActiveMode('generate')}
          className={`px-4 py-2 font-semibold transition-colors ${activeMode === 'generate' ? 'border-b-2 border-indigo-500 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
        >
          Buat Gambar
        </button>
        <button 
          onClick={() => setActiveMode('blend')}
          className={`px-4 py-2 font-semibold transition-colors ${activeMode === 'blend' ? 'border-b-2 border-indigo-500 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
        >
          Padukan Gambar
        </button>
      </div>
      
      {activeMode === 'generate' ? renderGenerateMode() : renderBlendMode()}

      {error && <p className="mt-4 text-red-500 dark:text-red-400">{error}</p>}
      
      <div className="mt-6">
        {isLoading && (
          <div className="flex justify-center items-center h-64 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg">
            <Spinner />
            <span className="ml-2">Membuat mahakarya Anda...</span>
          </div>
        )}
        {imageUrl && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg overflow-hidden ring-2 ring-indigo-500 w-full max-w-lg">
              <img src={imageUrl} alt="Hasil Gambar" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <a
                href={imageUrl}
                download="generated-image.jpg"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <DownloadIcon />
                Unduh Gambar
              </a>
               <button
                onClick={() => onEditImage(imageUrl)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <PencilIcon />
                Edit Gambar
              </button>
              <button
                onClick={() => onGenerateVideo(imageUrl)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                <VideoIcon />
                Buat Video dari Gambar
              </button>
              <button
                onClick={() => setIsSocialModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MegaphoneIcon />
                Buat Teks Promosi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};