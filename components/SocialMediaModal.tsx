
import React, { useState, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import type { SocialMediaPost } from '../types';
import { Spinner } from './Spinner';
import { CopyIcon } from './Icons';

interface SocialMediaModalProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  base64Media?: string; // For images, pass the base64 string
  prompt: string;
  onClose: () => void;
}

export const SocialMediaModal: React.FC<SocialMediaModalProps> = ({
  mediaUrl,
  mediaType,
  base64Media,
  prompt,
  onClose,
}) => {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  useEffect(() => {
    const generatePosts = async () => {
      setIsLoading(true);
      setError('');
      try {
        const imagePayload = base64Media ? { base64: base64Media, mimeType: 'image/jpeg' } : undefined;
        const result = await geminiService.generateSocialMediaPost(prompt, imagePayload);
        setPosts(result.posts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal membuat postingan media sosial.');
      } finally {
        setIsLoading(false);
      }
    };
    generatePosts();
  }, [prompt, base64Media]);

  const handleCopy = (platform: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row gap-6 p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side: Media Preview */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mb-4">Pratinjau Media</h3>
          <div className="rounded-lg overflow-hidden aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="Pratinjau Media" className="w-full h-full object-cover" />
            ) : (
              <video src={mediaUrl} controls autoPlay loop className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Right side: Generated Posts */}
        <div className="w-full md:w-2/3 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-300">Teks Promosi yang Dihasilkan</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Salin teks untuk platform pilihan Anda.</p>
             </div>
             <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                aria-label="Tutup modal"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
          
          <div className="space-y-4 pr-2">
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                <Spinner />
                <span className="ml-2">Membuat teks promosi...</span>
              </div>
            )}
            {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
            {!isLoading && !error && posts.map((post) => (
              <div key={post.platform} className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{post.platform}</h4>
                  <button
                    onClick={() => handleCopy(post.platform, post.content)}
                    className="flex items-center gap-2 text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <CopyIcon />
                    {copiedPlatform === post.platform ? 'Disalin!' : 'Salin'}
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};