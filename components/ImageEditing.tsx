
import React, { useState, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import { Spinner } from './Spinner';
import { fileToBase64 } from '../utils/helpers';
import type { AspectRatio, HistoryItem } from '../types';
import { DownloadIcon, VideoIcon, MegaphoneIcon } from './Icons';
import { SocialMediaModal } from './SocialMediaModal';

const positions = [
  { value: 'atas-kiri', label: 'Atas Kiri' },
  { value: 'atas-tengah', label: 'Atas Tengah' },
  { value: 'atas-kanan', label: 'Atas Kanan' },
  { value: 'tengah-kiri', label: 'Tengah Kiri' },
  { value: 'tengah', label: 'Tengah' },
  { value: 'tengah-kanan', label: 'Tengah Kanan' },
  { value: 'bawah-kiri', label: 'Bawah Kiri' },
  { value: 'bawah-tengah', label: 'Bawah Tengah' },
  { value: 'bawah-kanan', label: 'Bawah Kanan' },
];

const sizes = [
  { value: 'kecil', label: 'Kecil' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'besar', label: 'Besar' },
];

const fonts = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
];

const textEffects = [
    { value: 'statis', label: 'Statis' },
    { value: 'Efek Neon', label: 'Efek Neon' },
    { value: 'Efek Api', label: 'Efek Api' },
    { value: 'Efek Berkilau', label: 'Efek Berkilau' },
    { value: 'Efek Gerak (Motion Blur)', label: 'Efek Gerak' },
];

const aspectRatios: { value: AspectRatio | 'original'; label: string }[] = [
    { value: 'original', label: 'Asli' },
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
];

interface TextElement {
    id: number;
    text: string;
    color: string;
    size: string;
    position: string;
    font: string;
    is3D: boolean;
    isGradient: boolean;
    gradientStart: string;
    gradientEnd: string;
    effect: string;
}

interface ImageFile {
    file: File;
    url: string;
    id: number;
}

interface ImageEditingProps {
    onGenerateVideo: (imageUrl: string) => void;
    onCreationComplete: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    initialImage?: string | null;
    onImageConsumed: () => void;
}

const ControlWrapper: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
    <legend className="px-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">{title}</legend>
    {children}
  </fieldset>
);

export const ImageEditing: React.FC<ImageEditingProps> = ({ onGenerateVideo, onCreationComplete, initialImage, onImageConsumed }) => {
  const [originalImages, setOriginalImages] = useState<ImageFile[]>([]);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | 'original'>('original');
  const [isSocialModalOpen, setIsSocialModalOpen] = useState<boolean>(false);
  
  // Composition State
  const [backgroundType, setBackgroundType] = useState('solid');
  const [backgroundColor, setBackgroundColor] = useState('#F3F4F6');
  const [backgroundGradientStart, setBackgroundGradientStart] = useState('#E5E7EB');
  const [backgroundGradientEnd, setBackgroundGradientEnd] = useState('#FFFFFF');
  const [backgroundPrompt, setBackgroundPrompt] = useState('');

  // Text state - now an array
  const [texts, setTexts] = useState<TextElement[]>([]);

  // Logo state
  const [logoImage, setLogoImage] = useState<{ file: File; url: string } | null>(null);
  const [logoSize, setLogoSize] = useState('kecil');
  const [logoPosition, setLogoPosition] = useState('bawah-kanan');
  const [logoOpacity, setLogoOpacity] = useState(100);

  useEffect(() => {
    const processInitialImage = async () => {
        if (initialImage) {
            try {
                // Convert data URL to File object
                const response = await fetch(initialImage);
                const blob = await response.blob();
                const file = new File([blob], "generated-image.jpg", { type: blob.type });
                const newImageFile: ImageFile = {
                    file,
                    url: URL.createObjectURL(file), // create a blob url for preview
                    id: Date.now()
                };
                // Set it as the only image in the editor, replacing any existing ones
                setOriginalImages([newImageFile]);
            } catch (e) {
                console.error("Failed to process initial image for editing:", e);
                setError("Gagal memuat gambar awal untuk diedit.");
            } finally {
                onImageConsumed(); // Clear the state in App.tsx
            }
        }
    };
    processInitialImage();
  }, [initialImage, onImageConsumed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Explicitly type `file` as `File` to resolve TS inference issue.
      const newImages = Array.from(files).map((file: File) => ({
        file,
        url: URL.createObjectURL(file),
        id: Date.now() + Math.random(),
      }));
      setOriginalImages(prev => [...prev, ...newImages]);
      setEditedImageUrl(null);
      setError('');
    }
  };

  const removeImage = (id: number) => {
    setOriginalImages(prev => prev.filter(img => img.id !== id));
  };
  
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImage({ file, url: URL.createObjectURL(file) });
    }
  };

  const handleAddText = () => {
    const newText: TextElement = {
        id: Date.now(),
        text: '',
        color: '#111827',
        size: 'sedang',
        position: 'tengah',
        font: 'Arial',
        is3D: false,
        isGradient: false,
        gradientStart: '#3730A3',
        gradientEnd: '#A78BFA',
        effect: 'statis',
    };
    setTexts(prev => [...prev, newText]);
  };

  const handleRemoveText = (id: number) => {
    setTexts(prev => prev.filter(t => t.id !== id));
  };

  const handleTextChange = (id: number, field: keyof TextElement, value: any) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (originalImages.length === 0) {
      setError('Silakan unggah setidaknya satu gambar produk.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setEditedImageUrl(null);

    try {
        const mainImagesPayload = await Promise.all(
            originalImages.map(async (img) => ({
                base64: await fileToBase64(img.file),
                mimeType: img.file.type,
            }))
        );
        
        let backgroundInstruction = '';
        switch(backgroundType) {
            case 'solid':
                backgroundInstruction = `Buat latar belakang dengan warna solid minimalis menggunakan kode warna hex: ${backgroundColor}.`;
                break;
            case 'gradient':
                backgroundInstruction = `Buat latar belakang dengan gradien vertikal yang mulus, dimulai dari warna ${backgroundGradientStart} di bagian atas dan beralih ke warna ${backgroundGradientEnd} di bagian bawah.`;
                break;
            case 'prompt':
                if (backgroundPrompt.trim()) {
                    backgroundInstruction = `Buat latar belakang fotorealistik berdasarkan deskripsi berikut: "${backgroundPrompt.trim()}".`;
                } else {
                    backgroundInstruction = 'Buat latar belakang abu-abu netral yang sederhana.';
                }
                break;
        }

        const imageCount = originalImages.length;
        const imageArrangementInstruction = `Atur ${imageCount} gambar produk pertama secara artistik dan seimbang di atas latar belakang. Mereka adalah fokus utama.`;

        const textInstructions = texts.map((textItem, index) => {
            if (!textItem.text.trim()) return '';
            let colorInstruction = `warnanya "${textItem.color}"`;
            if (textItem.isGradient) {
                colorInstruction = `gunakan gradien warna yang mulus dari ${textItem.gradientStart} ke ${textItem.gradientEnd}`;
            }
            let effectInstruction = '';
            if (textItem.is3D) {
                effectInstruction += ` Terapkan efek 3D yang menonjol pada teks, dengan bayangan dan kedalaman yang realistis.`;
            }
            if (textItem.effect !== 'statis') {
                effectInstruction += ` Terapkan ${textItem.effect} pada teks.`;
            }
            return `- **Tambahkan Teks ${index + 1}:** Tambahkan teks "${textItem.text.trim()}". Posisikan di area "${textItem.position}" dari kanvas, pastikan tidak pernah tumpang tindih dengan gambar produk utama manapun. Propertinya adalah: ukuran "${textItem.size}", ${colorInstruction}, dan font yang mirip "${textItem.font}".${effectInstruction}`;
        }).filter(Boolean).join('\n');

        let logoInstructions = '';
        if (logoImage) {
            logoInstructions = `- **Tambahkan Logo:** Gambar ke-${imageCount + 1} adalah logo. Tempatkan di area "${logoPosition}". Ukurannya harus "${logoSize}" dan opasitasnya ${logoOpacity}%. Logo TIDAK BOLEH menutupi gambar produk manapun.`;
        }

        let generalInstructions = '';
        if (prompt.trim()) {
            generalInstructions = `- **Instruksi Tambahan:** Terapkan perubahan gaya berikut pada KESELURUHAN gambar, termasuk latar belakang dan pencahayaan: ${prompt.trim()}`;
        }
        
        const aspectRatioInstruction = aspectRatio === 'original'
            ? 'Pertahankan rasio aspek komposit agar sesuai dengan gambar produk pertama, tambahkan ruang latar belakang jika perlu.'
            : `Hasilkan gambar akhir dalam rasio aspek ${aspectRatio}.`;

        const masterPrompt = `
**Tugas Utama: Buat gambar komposit tingkat iklan dari beberapa gambar produk.**

**Aturan Paling Penting: JANGAN UBAH gambar produk yang disediakan. Tugas Anda adalah mengaturnya secara artistik di latar belakang baru dan menambahkan elemen lain di sekitarnya.**

**Prinsip Panduan AI:**
1.  **Pertahankan Gambar Asli:** Tempatkan ${imageCount} gambar produk pertama apa adanya ke dalam adegan baru tanpa modifikasi.
2.  **Realisme & Komposisi:** Ciptakan adegan yang kohesif. Atur gambar-gambar produk secara seimbang dan menarik secara visual. Pencahayaan dan bayangan pada elemen yang ditambahkan harus cocok dengan gambar produk.

**Spesifikasi Output:**
- **Rasio Aspek:** ${aspectRatioInstruction}

**Langkah-langkah Eksekusi:**
1.  **Buat Latar Belakang:** ${backgroundInstruction}
2.  **Atur Gambar Produk:** ${imageArrangementInstruction}
${textInstructions ? `3. **Tambahkan Elemen Teks:**\n${textInstructions}` : ''}
${logoInstructions ? `4. **Tambahkan Logo:**\n${logoInstructions}` : ''}
${generalInstructions ? `5. **Terapkan Gaya Keseluruhan:**\n${generalInstructions}` : ''}

Hasilkan satu gambar komposit yang bersih dan profesional. Prioritaskan kejelasan produk dan keterbacaan teks.
`;
        
        let logoImagePayload;
        if (logoImage) {
            logoImagePayload = {
                base64: await fileToBase64(logoImage.file),
                mimeType: logoImage.file.type,
            };
        }
        
        const result = await geminiService.editImage(masterPrompt, mainImagesPayload, logoImagePayload);
        const candidate = result.candidates?.[0];
        const part = candidate?.content?.parts?.find(p => p.inlineData);

        if (part?.inlineData) {
            const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setEditedImageUrl(url);
            const finalPrompt = prompt || 'Komposisi gambar yang diedit';
            onCreationComplete({ type: 'imageEdit', prompt: finalPrompt, data: url });
        } else {
            throw new Error('Proses edit gagal mengembalikan gambar baru. Coba sesuaikan prompt Anda.');
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : `Terjadi kesalahan yang tidak diketahui saat mengedit.`);
    } finally {
        setIsLoading(false);
    }
  }, [originalImages, prompt, texts, logoImage, logoSize, logoPosition, logoOpacity, aspectRatio, backgroundType, backgroundColor, backgroundGradientStart, backgroundGradientEnd, backgroundPrompt, onCreationComplete]);

  return (
    <div>
      {isSocialModalOpen && editedImageUrl && (
        <SocialMediaModal
          mediaUrl={editedImageUrl}
          mediaType="image"
          base64Media={editedImageUrl.split(',')[1]}
          prompt={prompt}
          onClose={() => setIsSocialModalOpen(false)}
        />
      )}
      <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Edit Gambar</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Buat komposisi profesional dengan menempatkan gambar Anda pada latar belakang khusus, menambahkan teks, dan logo.</p>

      <div className="mb-4">
        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unggah Gambar Produk (pilih beberapa)</label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 dark:file:bg-indigo-50 dark:hover:file:bg-indigo-100"
          disabled={isLoading}
        />
      </div>

      {originalImages.length > 0 && (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Panel Kontrol</h3>
              
              <ControlWrapper title="Gambar Produk yang Diunggah">
                <div className="flex flex-wrap gap-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                  {originalImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img src={image.url} alt={`pratinjau produk`} className="h-24 w-24 object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition-colors"
                        disabled={isLoading}
                      >
                        &#x2715;
                      </button>
                    </div>
                  ))}
                </div>
              </ControlWrapper>
              
               <ControlWrapper title="Latar Belakang">
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Jenis Latar Belakang</label>
                    <select value={backgroundType} onChange={(e) => setBackgroundType(e.target.value)} disabled={isLoading} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-sm">
                        <option value="solid">Warna Solid</option>
                        <option value="gradient">Gradien</option>
                        <option value="prompt">Deskriptif</option>
                    </select>
                </div>
                {backgroundType === 'solid' && (
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Warna Latar</label>
                        <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} disabled={isLoading} className="w-full h-9 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"/>
                    </div>
                )}
                {backgroundType === 'gradient' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Awal Gradien</label>
                            <input type="color" value={backgroundGradientStart} onChange={(e) => setBackgroundGradientStart(e.target.value)} disabled={isLoading} className="w-full h-9 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Akhir Gradien</label>
                            <input type="color" value={backgroundGradientEnd} onChange={(e) => setBackgroundGradientEnd(e.target.value)} disabled={isLoading} className="w-full h-9 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"/>
                        </div>
                    </div>
                )}
                {backgroundType === 'prompt' && (
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Deskripsi Latar</label>
                        <textarea
                            value={backgroundPrompt}
                            onChange={(e) => setBackgroundPrompt(e.target.value)}
                            placeholder="misalnya: sebuah meja kayu pedesaan dengan pencahayaan lembut"
                            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-y"
                            rows={2}
                            disabled={isLoading}
                        />
                    </div>
                )}
              </ControlWrapper>
              
              <ControlWrapper title="Instruksi Gaya Umum">
                 <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="misalnya: buat ini terlihat lebih sinematik, gunakan palet warna pastel"
                  className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-y"
                  rows={3}
                  disabled={isLoading}
                />
              </ControlWrapper>
              
              <ControlWrapper title="Pengaturan Output">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Rasio Aspek</label>
                <div className="flex flex-wrap gap-2">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => setAspectRatio(ar.value)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        aspectRatio === ar.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </ControlWrapper>

                <ControlWrapper title="Tambahkan Teks">
                    <div className="space-y-4">
                        {texts.map((textItem, index) => (
                            <div key={textItem.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white/50 dark:bg-gray-800/50 relative space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Teks #{index + 1}</h4>
                                    <button type="button" onClick={() => handleRemoveText(textItem.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs font-bold">HAPUS</button>
                                </div>
                                <input type="text" value={textItem.text} onChange={(e) => handleTextChange(textItem.id, 'text', e.target.value)} placeholder="Teks Anda di sini..." className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"/>
                                <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center"><input type="checkbox" id={`is3d-${textItem.id}`} checked={textItem.is3D} onChange={(e) => handleTextChange(textItem.id, 'is3D', e.target.checked)} className="w-4 h-4 text-indigo-600 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500" /><label htmlFor={`is3d-${textItem.id}`} className="ml-2">3D</label></div>
                                    <div className="flex items-center"><input type="checkbox" id={`isGradient-${textItem.id}`} checked={textItem.isGradient} onChange={(e) => handleTextChange(textItem.id, 'isGradient', e.target.checked)} className="w-4 h-4 text-indigo-600 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500" /><label htmlFor={`isGradient-${textItem.id}`} className="ml-2">Gradien</label></div>
                                </div>
                                {textItem.isGradient ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div><label className="text-xs text-gray-500 dark:text-gray-400 block">Awal</label><input type="color" value={textItem.gradientStart} onChange={(e) => handleTextChange(textItem.id, 'gradientStart', e.target.value)} className="w-full h-9 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"/></div>
                                        <div><label className="text-xs text-gray-500 dark:text-gray-400 block">Akhir</label><input type="color" value={textItem.gradientEnd} onChange={(e) => handleTextChange(textItem.id, 'gradientEnd', e.target.value)} className="w-full h-9 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"/></div>
                                    </div>
                                ) : (
                                    <div><label className="text-xs text-gray-500 dark:text-gray-400 block">Warna</label><input type="color" value={textItem.color} onChange={(e) => handleTextChange(textItem.id, 'color', e.target.value)} className="w-full h-9 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"/></div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div><label className="text-xs text-gray-500 dark:text-gray-400 block">Font</label><select value={textItem.font} onChange={(e) => handleTextChange(textItem.id, 'font', e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-sm">{fonts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
                                    <div><label className="text-xs text-gray-500 dark:text-gray-400 block">Ukuran</label><select value={textItem.size} onChange={(e) => handleTextChange(textItem.id, 'size', e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-sm">{sizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div><label className="text-xs text-gray-500 dark:text-gray-400 block">Posisi</label><select value={textItem.position} onChange={(e) => handleTextChange(textItem.id, 'position', e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-sm">{positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                                    <div><label className="text-xs text-gray-500 dark:text-gray-400 block">Efek Teks</label><select value={textItem.effect} onChange={(e) => handleTextChange(textItem.id, 'effect', e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-sm">{textEffects.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}</select></div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddText} disabled={isLoading} className="w-full px-4 py-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 disabled:opacity-50 transition-colors">
                            + Tambah Teks Baru
                        </button>
                    </div>
                </ControlWrapper>
              
              <ControlWrapper title="Tambahkan Logo">
                <input type="file" accept="image/png, image/jpeg" onChange={handleLogoFileChange} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 dark:file:bg-gray-600 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-500"/>
                {logoImage && <img src={logoImage.url} alt="Pratinjau logo" className="h-16 w-auto bg-black/5 dark:bg-white/10 p-1 rounded-md" />}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">Ukuran</label>
                      <select value={logoSize} onChange={(e) => setLogoSize(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                        {sizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">Posisi</label>
                      <select value={logoPosition} onChange={(e) => setLogoPosition(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                        {positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                </div>
                 <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block">Opasitas: {logoOpacity}%</label>
                    <input type="range" min="0" max="100" value={logoOpacity} onChange={(e) => setLogoOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                  </div>
              </ControlWrapper>
              
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 sm:py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? <><Spinner /> Membuat...</> : 'Buat Komposisi'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Hasil</h3>
              <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[16rem] md:min-h-[24rem] h-full flex justify-center items-center p-4">
                {isLoading && <div className="text-center"><Spinner /><p className="mt-2">Memproses...</p></div>}
                {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
                {editedImageUrl && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-lg overflow-hidden ring-2 ring-indigo-500 w-full">
                      <img src={editedImageUrl} alt="Hasil Edit" className="w-full h-full object-contain max-h-[50vh]" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                        <a
                            href={editedImageUrl}
                            download="edited-image.jpg"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <DownloadIcon />
                            Unduh Gambar
                        </a>
                        <button
                            type="button"
                            onClick={() => onGenerateVideo(editedImageUrl)}
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
                {!isLoading && !error && !editedImageUrl && <p className="text-gray-500">Hasil Anda akan muncul di sini.</p>}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};