
// Fix: Add LiveSession and LiveServerMessage for live transcription.
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type, LiveSession, LiveServerMessage } from "@google/genai";
import type { AspectRatio, VideoAspectRatio, SocialMediaPost } from '../types';

const API_KEY_STORAGE_KEY = 'geminiApiKey';

const getApiKey = (): string => {
    const key = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!key) {
        throw new Error("Kunci API Gemini tidak ditemukan. Silakan atur di panel pengaturan (ikon kunci).");
    }
    return key;
}

const getAI = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

// For Veo, which now uses the same user-provided key
const getVeoAI = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};


// Fix: Use correct model name 'gemini-flash-lite-latest' per guidelines.
export const generateText = async (prompt: string, model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-flash-lite-latest', useThinking: boolean): Promise<GenerateContentResponse> => {
  const ai = getAI();
  const config = useThinking ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
  return await ai.models.generateContent({
    model,
    contents: prompt,
    config
  });
};

export const generateCreativePrompt = async (idea: string, target: 'image' | 'video'): Promise<GenerateContentResponse> => {
  const ai = getAI();
  
  const videoInstructions = target === 'video' 
    ? "6.  **Gerakan & Dinamika:** Sarankan gerakan kamera (misalnya, pan lambat, bidikan drone, pelacakan) dan pergerakan subjek untuk menciptakan adegan yang dinamis."
    : "";

  const systemInstruction = `
    Anda adalah seorang ahli 'prompt engineer' untuk model AI generatif canggih. Tugas Anda adalah mengubah ide sederhana pengguna menjadi prompt yang kaya, mendetail, dan menggugah secara visual.
    
    Instruksi:
    1.  **Analisis Ide Inti:** Pahami konsep dasar yang diberikan oleh pengguna.
    2.  **Perkaya dengan Detail:** Perluas ide tersebut dengan menambahkan detail spesifik.
    3.  **Tentukan Gaya Artistik:** Tentukan gaya yang jelas (misalnya, fotorealistik, sinematik, cat air, cyberpunk, fantasi epik).
    4.  **Atur Komposisi:** Jelaskan komposisi, sudut kamera, dan jenis bidikan (misalnya, bidikan lebar, close-up, dari atas ke bawah).
    5.  **Ciptakan Suasana dengan Pencahayaan:** Tentukan pencahayaan (misalnya, cahaya keemasan, pencahayaan neon dramatis, cahaya lembut dan menyebar).
    ${videoInstructions}
    
    Tujuan akhirnya adalah membuat prompt tunggal, ringkas dalam satu paragraf yang akan memandu AI untuk menghasilkan gambar atau video yang menakjubkan dan berkualitas tinggi. Jangan ajukan pertanyaan, langsung hasilkan prompt yang disempurnakan.
  `;

  const userPrompt = `Ide dasar: "${idea}". Target: ${target}. Hasilkan prompt yang disempurnakan.`;

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
    }
  });
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<GenerateContentResponse> => {
  const ai = getAI();
  return await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio,
    },
  });
};

export const blendImages = async (prompt: string, images: { base64: string; mimeType: string }[], aspectRatio: AspectRatio): Promise<GenerateContentResponse> => {
  const ai = getAI();
  const imageParts = images.map(image => ({
    inlineData: {
      data: image.base64,
      mimeType: image.mimeType
    }
  }));

  const masterPrompt = `
    Tugas Utama: Ciptakan satu gambar komposit yang sangat realistis dan mulus. Hasilnya harus terlihat seperti satu foto tunggal yang diambil secara profesional, bukan gabungan dari beberapa gambar. Targetnya adalah kualitas iklan premium.

    Instruksi Kunci untuk Model AI:
    1.  **Integrasi Tanpa Batas:** Prioritas utama Anda adalah menghilangkan semua jahitan atau tepi yang terlihat di antara gambar-gambar yang disediakan. Transisi harus benar-benar tidak terdeteksi. Bayangkan Anda sedang "melukis" elemen-elemen tersebut bersama-sama secara digital.
    2.  **Harmonisasi Pencahayaan & Bayangan:** Analisis sumber cahaya di setiap gambar dan ciptakan skema pencahayaan yang konsisten di seluruh adegan. Bayangan harus jatuh secara realistis, dan sorotan harus cocok. Ini sangat penting untuk ilusi realisme.
    3.  **Koreksi Warna & Gradasi:** Terapkan gradasi warna tingkat profesional untuk menyatukan semua elemen. Pastikan keseimbangan putih, saturasi, dan rona konsisten. Hasilnya harus memiliki palet warna yang kohesif dan sinematik.
    4.  **Kualitas Tekstur & Detail:** Pertahankan (dan jika perlu, tingkatkan) detail dan tekstur resolusi tinggi dari gambar sumber. Hindari area yang buram atau berkualitas rendah. Pastikan fokusnya tajam dan disengaja.
    5.  **Patuhi Permintaan Pengguna:** Setelah memastikan fondasi teknis di atas, integrasikan dengan kreatif permintaan spesifik dari pengguna.
    6.  **Rasio Aspek Final:** Hasilkan gambar akhir dalam rasio aspek ${aspectRatio}.

    Permintaan Pengguna: "${prompt}"
  `;

  const textPart = { text: masterPrompt };

  const parts = [...imageParts, textPart];

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts,
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
};

interface ImageInput {
  base64: string;
  mimeType: string;
}

export const editImage = async (
  prompt: string,
  mainImages: ImageInput[],
  logoImage?: ImageInput,
): Promise<GenerateContentResponse> => {
  const ai = getAI();

  const mainImageParts = mainImages.map(image => ({
    inlineData: { data: image.base64, mimeType: image.mimeType }
  }));

  const parts: any[] = [...mainImageParts];

  if (logoImage) {
    parts.push({ inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } });
  }

  // The prompt is always the last part.
  parts.push({ text: prompt });

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
};

export const generateVideo = async (prompt: string, aspectRatio: VideoAspectRatio, image?: { base64: string; mimeType: string }) => {
    const ai = getVeoAI();
    const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };
    if (image) {
        payload.image = {
            imageBytes: image.base64,
            mimeType: image.mimeType
        };
    }

    let operation = await ai.models.generateVideos(payload);
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    
    const response = await fetch(`${downloadLink}&key=${getApiKey()}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};


export const generateSpeech = async (text: string, voice: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio.");
    }
    return base64Audio;
};

// Fix: Add startTranscriptionSession for real-time audio transcription.
export const startTranscriptionSession = (onMessage: (message: LiveServerMessage) => void): Promise<LiveSession> => {
  const ai = getAI();
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        console.log('Transcription session opened.');
      },
      onmessage: onMessage,
      onerror: (e: ErrorEvent) => {
        console.error('Transcription session error:', e);
      },
      onclose: (e: CloseEvent) => {
        console.log('Transcription session closed.');
      },
    },
    config: {
      // Per the guidelines, AUDIO is required for responseModalities.
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
    },
  });
  return sessionPromise;
};

export const generateSocialMediaPost = async (promptOrContext: string, image?: { base64: string; mimeType: string }): Promise<{posts: SocialMediaPost[]}> => {
  const ai = getAI();

  const systemInstruction = `
    Anda adalah seorang ahli pemasaran media sosial. Tugas Anda adalah membuat postingan yang menarik untuk berbagai platform berdasarkan media dan konteks yang diberikan.
    - Buat konten untuk Instagram, Facebook, dan X (sebelumnya Twitter).
    - Sertakan emoji yang relevan.
    - Sertakan 3-5 hashtag yang relevan dan sedang tren.
    - Sesuaikan nada dan panjangnya untuk setiap platform:
        - **Facebook:** Buat postingan yang lebih panjang dan kaya. Kembangkan cerita di balik media, ajukan pertanyaan yang menarik untuk mendorong komentar, dan berikan detail informatif. Tujuannya adalah untuk menciptakan satu postingan komprehensif yang dapat menghasilkan diskusi.
        - **Instagram:** Fokus pada caption visual yang menarik dan cerita singkat.
        - **X (Twitter):** Jaga agar tetap singkat, menarik, dan mudah dibagikan.
  `;

  const userPrompt = `
    Konteks atau prompt asli untuk media ini adalah: "${promptOrContext}".
    Hasilkan postingan media sosial berdasarkan ini.
  `;

  const imagePart = image ? {
    inlineData: {
      data: image.base64,
      mimeType: image.mimeType
    }
  } : null;

  const textPart = { text: userPrompt };
  const parts = imagePart ? [imagePart, textPart] : [textPart];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                content: { type: Type.STRING }
              }
            }
          }
        }
      },
    },
  });
  
  try {
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch(e) {
    console.error("Failed to parse social media posts JSON:", e);
    throw new Error("Gagal membuat postingan media sosial. Respons AI tidak dalam format yang diharapkan.");
  }
};

export const generateNarrationForMedia = async (prompt: string, image?: { base64: string; mimeType: string }): Promise<GenerateContentResponse> => {
  const ai = getAI();

  const systemInstruction = `
    Anda adalah seorang penulis naskah yang kreatif. Tugas Anda adalah menulis narasi audio yang singkat, deskriptif, dan menarik (sekitar 2-3 kalimat) untuk sebuah gambar atau video.
    Narasi harus menangkap suasana, emosi, dan inti cerita dari media tersebut. Jangan jelaskan apa yang Anda lihat secara harfiah; ciptakan suasana.
    Langsung hasilkan hanya teks narasi, tanpa salam atau basa-basi.
  `;
  
  const userPrompt = `
    Konteks atau prompt asli untuk media ini adalah: "${prompt}".
    Hasilkan skrip narasi audio yang menarik berdasarkan ini.
  `;

  const imagePart = image ? {
    inlineData: {
      data: image.base64,
      mimeType: image.mimeType
    }
  } : null;

  const textPart = { text: userPrompt };
  const parts = imagePart ? [imagePart, textPart] : [textPart];

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction,
    },
  });
};
