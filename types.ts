export type Feature = 'text' | 'imageGen' | 'imageEdit' | 'videoGen' | 'tts' | 'promptBuilder';

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type VideoAspectRatio = "16:9" | "9:16";

export interface SocialMediaPost {
  platform: string;
  content: string;
}

export interface HistoryItem {
  id: number;
  type: 'text' | 'imageGen' | 'imageEdit' | 'videoGen' | 'tts';
  timestamp: number;
  prompt: string;
  data: string; // Data URL untuk gambar, Blob URL untuk video, teks mentah/html, base64 untuk audio
}
