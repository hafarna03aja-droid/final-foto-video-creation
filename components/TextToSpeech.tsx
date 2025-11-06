
import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import { decode, decodeAudioData, fileToBase64, createWavBlob } from '../utils/helpers';
import { Spinner } from './Spinner';
import { DownloadIcon } from './Icons';
import type { HistoryItem } from '../types';

const availableVoices = [
  { id: 'Kore', name: 'Kore (Wanita, Jelas & Profesional)' },
  { id: 'Puck', name: 'Puck (Pria, Hangat & Ramah)' },
  { id: 'Charon', name: 'Charon (Pria, Dalam & Berwawa)' },
  { id: 'Fenrir', name: 'Fenrir (Pria, Serak & Kuat)' },
  { id: 'Zephyr', name: 'Zephyr (Wanita, Lembut & Menenangkan)' },
];

const availableIntonations = ['Netral', 'Ceria', 'Sedih', 'Bersemangat', 'Profesional', 'Santai'];
const availableAccents = ['Nasional', 'Jawa', 'Sunda', 'Tegal'];


interface TextToSpeechProps {
  lastCreation: HistoryItem | null;
  onCreationComplete: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ lastCreation, onCreationComplete }) => {
  const [text, setText] = useState<string>('');
  const [voice, setVoice] = useState<string>('Kore');
  const [intonation, setIntonation] = useState<string>('Netral');
  const [accent, setAccent] = useState<string>('Nasional');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);

  // Helper to initialize and resume the AudioContext, crucial for browser autoplay policies.
  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const playAudio = useCallback(async (decodedBytes: Uint8Array) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state !== 'running') {
      setError('Konteks audio tidak siap. Silakan klik "Buat & Putar" lagi.');
      console.error('Pemutaran audio gagal, status konteks:', ctx?.state);
      setIsPlaying(false);
      return;
    }

    stopPlayback();

    try {
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
            setIsPlaying(false);
            if (sourceRef.current === source) {
                sourceRef.current = null;
            }
        };
        source.start();
        
        sourceRef.current = source;
        setIsPlaying(true);
    } catch (err) {
        console.error("Error decoding or playing audio:", err);
        setError("Gagal mendekode atau memutar audio.");
        setIsPlaying(false);
    }
  }, [stopPlayback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Silakan masukkan teks.');
      return;
    }

    // --- FIX: Activate AudioContext on user gesture BEFORE async call ---
    try {
      await ensureAudioContext();
    } catch (err) {
      setError("Tidak dapat mengaktifkan audio. Silakan coba lagi.");
      console.error("Gagal melanjutkan AudioContext:", err);
      return;
    }
    // --- END FIX ---

    setIsLoading(true);
    setError('');
    
    // Revoke the previous URL if it exists
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);

    if(isPlaying) stopPlayback();

    try {
      let instruction = '';
      if (intonation !== 'Netral' && accent !== 'Nasional') {
        instruction = `Ucapkan dengan intonasi ${intonation.toLowerCase()} dan logat ${accent}: `;
      } else if (intonation !== 'Netral') {
        instruction = `Ucapkan dengan intonasi ${intonation.toLowerCase()}: `;
      } else if (accent !== 'Nasional') {
        instruction = `Ucapkan dengan logat ${accent}: `;
      }
      const finalPrompt = instruction + text;

      const base64Audio = await geminiService.generateSpeech(finalPrompt, voice);
      onCreationComplete({ type: 'tts', prompt: text, data: base64Audio });
      const decodedBytes = decode(base64Audio);

      // Create WAV for download
      const wavBlob = createWavBlob(decodedBytes, 1, 24000, 16);
      setAudioUrl(URL.createObjectURL(wavBlob));
      
      await playAudio(decodedBytes);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNarration = async () => {
    if (!lastCreation) return;

    setIsNarrating(true);
    setError('');
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);

    try {
        let imagePayload: { base64: string, mimeType: string } | undefined = undefined;
        // Videos are blob URLs, images are data URLs. We only need to fetch for blobs.
        if (lastCreation.type === 'videoGen' || lastCreation.data.startsWith('blob:')) {
            const response = await fetch(lastCreation.data);
            const blob = await response.blob();
            // fileToBase64 needs a File object
            const file = new File([blob], "media", {type: blob.type});
            const base64 = await fileToBase64(file);
            imagePayload = { base64, mimeType: blob.type };
        } else if (lastCreation.type === 'imageGen' || lastCreation.type === 'imageEdit') {
           // Data URLs for images
           const [header, base64] = lastCreation.data.split(',');
           const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
           if(base64) {
             imagePayload = { base64, mimeType };
           }
        }
        
        const result = await geminiService.generateNarrationForMedia(lastCreation.prompt, imagePayload);
        setText(result.text);

    } catch(err) {
        setError(err instanceof Error ? `Gagal membuat narasi: ${err.message}`: 'Gagal membuat narasi.');
    } finally {
        setIsNarrating(false);
    }
  };

  // This effect correctly handles stopping playback and revoking the object URL
  // for the PREVIOUS audio generation when a new one starts, or on unmount.
  // The context is no longer closed here, preventing the race condition.
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [stopPlayback, audioUrl]);

  // This new effect handles the lifecycle of the AudioContext.
  // It will only close the context when the component is fully unmounted.
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const isMediaCreation = lastCreation && (lastCreation.type === 'imageGen' || lastCreation.type === 'imageEdit' || lastCreation.type === 'videoGen');

  return (
    <div className="flex flex-col md:flex-row h-full gap-8">
      {/* Left side: TTS form */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Teks ke Suara</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Ubah teks menjadi ucapan yang terdengar alami, atau biarkan AI membuat narasi untuk kreasi visual terbaru Anda menggunakan Asisten Narasi.</p>
        
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="contoh: Halo! Saya adalah asisten AI yang didukung oleh Gemini."
            className="w-full flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
            rows={8}
            disabled={isLoading || isPlaying}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilihan Suara
              </label>
              <select
                id="voice-select"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                disabled={isLoading || isPlaying || isNarrating}
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
             <div>
              <label htmlFor="intonation-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Intonasi
              </label>
              <select
                id="intonation-select"
                value={intonation}
                onChange={(e) => setIntonation(e.target.value)}
                disabled={isLoading || isPlaying || isNarrating}
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {availableIntonations.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
             <div>
              <label htmlFor="accent-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logat
              </label>
              <select
                id="accent-select"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                disabled={isLoading || isPlaying || isNarrating}
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {availableAccents.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>


          <div className="flex justify-end items-center gap-4">
            {audioUrl && (
              <a
                href={audioUrl}
                download="generated-audio.wav"
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <DownloadIcon />
                Unduh Audio
              </a>
            )}
            <button
              type="submit"
              disabled={isLoading || !text.trim() || isNarrating}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[150px]"
            >
              {isLoading ? <Spinner /> : isPlaying ? 'Memutar...' : 'Buat & Putar'}
            </button>
          </div>
        </form>
         {error && <p className="mt-4 text-red-500 dark:text-red-400">{error}</p>}
      </div>

      {/* Right side: Narration helper */}
      <div className="md:w-2/5 lg:w-1/3 md:border-l md:border-gray-200 dark:md:border-gray-700 md:pl-8">
        <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Asisten Narasi</h3>
        {isMediaCreation ? (
          <div className="space-y-3 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">Kreasi Terbaru Anda:</p>
            <div className="rounded-md overflow-hidden aspect-video bg-gray-200 dark:bg-gray-900">
              {lastCreation.type === 'videoGen' ? (
                <video src={lastCreation.data} muted loop autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={lastCreation.data} alt="Kreasi terbaru" className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate" title={lastCreation.prompt}>Prompt: {lastCreation.prompt}</p>
            <button
              onClick={handleGenerateNarration}
              disabled={isNarrating || isLoading || isPlaying}
              className="w-full px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-500 transition-colors flex items-center justify-center"
            >
              {isNarrating ? <><Spinner /> Membuat...</> : 'Buat Narasi untuk Ini'}
            </button>
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg h-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500">Buat gambar atau video terlebih dahulu, lalu kembali ke sini untuk membuat narasi untuknya.</p>
          </div>
        )}
      </div>
    </div>
  );
};