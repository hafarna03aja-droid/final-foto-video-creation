
import React, { useState, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import { Spinner } from './Spinner';
import { fileToBase64 } from '../utils/helpers';
import type { VideoAspectRatio, HistoryItem } from '../types';
import { DownloadIcon, MegaphoneIcon } from './Icons';
import { SocialMediaModal } from './SocialMediaModal';

interface VideoGenerationProps {
  initialImage?: string | null;
  initialPrompt?: string | null;
  onLeave: () => void;
  onCreationComplete: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

const loadingMessages = [
  "Memanggil inspirasi digital...",
  "Mengajari piksel menari...",
  "Menyusun simfoni visual Anda...",
  "Merender realitas dari imajinasi...",
  "Ini mungkin memakan waktu beberapa saat...",
  "AI sedang menunjukkan keajaibannya...",
  "Hampir selesai, memoles bingkai terakhir...",
];

export const VideoGeneration: React.FC<VideoGenerationProps> = ({ initialImage, initialPrompt, onLeave, onCreationComplete }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState<boolean>(false);

  // Effect to clean up the initial state when the component/tab is left
  useEffect(() => {
    return () => {
      onLeave();
    };
  }, [onLeave]);

  // Effect to handle the initial image or prompt passed from another tab
  useEffect(() => {
    const processInitialData = async () => {
      if (initialImage) {
        try {
          const response = await fetch(initialImage);
          const blob = await response.blob();
          const file = new File([blob], "generated-image.jpg", { type: blob.type });
          setImage({ file, url: URL.createObjectURL(file) });
        } catch (e) {
          console.error("Failed to process initial image:", e);
          setError("Gagal memuat gambar awal.");
        }
      }
      if (initialPrompt) {
        setPrompt(initialPrompt);
      }
    };
    processInitialData();
  }, [initialImage, initialPrompt]);


  // Fix: Refactor useEffect to remove NodeJS.Timeout type and improve timer handling.
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({ file, url: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !image) {
      setError('Silakan masukkan perintah atau unggah gambar.');
      return;
    }
    setIsLoading(true);
    setError('');
    setVideoUrl('');
    setLoadingMessage(loadingMessages[0]);
    try {
      let imagePayload;
      if (image) {
        const base64 = await fileToBase64(image.file);
        imagePayload = { base64, mimeType: image.file.type };
      }
      const resultUrl = await geminiService.generateVideo(prompt, aspectRatio, imagePayload);
      setVideoUrl(resultUrl);
      onCreationComplete({ type: 'videoGen', prompt, data: resultUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isSocialModalOpen && videoUrl && (
        <SocialMediaModal
          mediaUrl={videoUrl}
          mediaType="video"
          prompt={prompt}
          onClose={() => setIsSocialModalOpen(false)}
        />
      )}
      <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Pembuatan Video (Veo)</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Buat video definisi tinggi dari teks atau gambar awal. Proses pembuatan mungkin memakan waktu beberapa menit.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="contoh: Hologram neon seekor kucing yang mengemudi dengan kecepatan tinggi"
          className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
          disabled={isLoading}
        />
        
        <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="video-upload" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gambar awal (opsional):</label>
            <input
              id="video-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 dark:file:bg-gray-600 file:text-gray-800 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-500"
              disabled={isLoading}
            />
        </div>
        {image && <img src={image.url} alt="pratinjau unggahan" className="max-h-24 rounded-md my-2" />}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rasio Aspek</label>
          <div className="flex gap-2">
            {(['16:9', '9:16'] as VideoAspectRatio[]).map((ar) => (
              <button key={ar} type="button" onClick={() => setAspectRatio(ar)} disabled={isLoading}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${aspectRatio === ar ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                {ar === '16:9' ? 'Lanskap' : 'Potret'}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full px-5 py-2 sm:px-6 sm:py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
          {isLoading ? <><Spinner /> Membuat Video...</> : 'Buat Video'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-500 dark:text-red-400 text-center">{error}</p>}
      
      <div className="mt-6">
        {isLoading && (
          <div className="flex flex-col justify-center items-center h-64 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg">
            <Spinner />
            <span className="ml-2 mt-4 font-semibold">{loadingMessage}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Pembuatan video dapat memakan waktu beberapa menit. Mohon bersabar.</span>
          </div>
        )}
        {videoUrl && (
          <div className="flex flex-col items-center gap-4">
            <video src={videoUrl} controls autoPlay loop className="rounded-lg shadow-lg max-w-full max-h-[60vh] object-contain" />
            <div className="flex flex-wrap justify-center gap-4 mt-2">
                <a
                  href={videoUrl}
                  download="generated-video.mp4"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DownloadIcon />
                  Unduh Video
                </a>
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