
import React, { useState, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import { encode } from '../utils/helpers';
import type { LiveSession, LiveServerMessage, Blob } from '@google/genai';


export const AudioTranscription: React.FC = () => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [transcription, setTranscription] = useState<string>('');
    const [error, setError] = useState<string>('');

    const sessionRef = useRef<LiveSession | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcriptionRef = useRef<string>('');

    const stopRecording = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsRecording(false);
    }, []);
    
    const handleMessage = (message: LiveServerMessage) => {
        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            transcriptionRef.current += text;
            setTranscription(transcriptionRef.current);
        }
    };
    
    const startRecording = async () => {
        if (isRecording) return;
        setIsRecording(true);
        setError('');
        transcriptionRef.current = '';
        setTranscription('');
    
        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    
            const sessionPromise = geminiService.startTranscriptionSession(handleMessage);
            sessionRef.current = await sessionPromise;
    
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const pcmBlob: Blob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
    
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                }).catch(err => {
                    console.error("Error sending audio data:", err);
                    stopRecording();
                });
            };
    
            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);
    
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memulai rekaman.');
            console.error(err);
            stopRecording();
        }
    };
    

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">Transkripsi Audio Real-time</h2>
            <p className="text-gray-400 mb-6">Klik "Mulai Merekam" dan berbicaralah ke mikrofon Anda. Kata-kata Anda akan ditranskripsi secara langsung.</p>

            <div className="flex justify-center mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-8 py-4 text-white font-bold rounded-full transition-all duration-300 flex items-center gap-3 text-lg shadow-lg
                    ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-white'}`}></div>
                    {isRecording ? 'Hentikan Merekam' : 'Mulai Merekam'}
                </button>
            </div>

            <div className="flex-grow bg-gray-900/50 rounded-lg border border-gray-700 p-4 overflow-y-auto">
                <p className="text-gray-200 whitespace-pre-wrap min-h-[10rem]">
                    {transcription || <span className="text-gray-500">Menunggu audio...</span>}
                </p>
            </div>

            {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
        </div>
    );
};
