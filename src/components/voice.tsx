"use client";

import { useState, useEffect, useRef } from 'react';

import { X, Mic } from "lucide-react";
import { useDeviceControl } from '@/src/hooks/useDeviceControl';
import { useFeeds } from '../hooks/useFeeds';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceControlModal({ isOpen, onClose }: VoiceControlModalProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const { updateStatus, loading } = useDeviceControl();
    const { feedsData} = useFeeds();
    const ledStatusFeed = feedsData?.find(feed => feed.category === "LED Status");
    const fanSpeedFeed = feedsData?.find(feed => feed.category === "Fan Speed");
    const recognitionRef = useRef<any>(null);
    const processCommandRef = useRef<(cmd: string) => Promise<void>>(async () => {});

    useEffect(() => {
        processCommandRef.current = async (command: string) => {
            if (command.includes("bật đèn") || command.includes("mở đèn")) {
                await updateStatus(ledStatusFeed?.feed_key, 1);
                alert("Turn on light successfully!");
            } 
            else if (command.includes("tắt đèn")) {
                await updateStatus(ledStatusFeed?.feed_key, 0);
                alert("Turn off light successfully!");
            }
            else if (command.includes("bật quạt") || command.includes("mở quạt")) {
                await updateStatus(fanSpeedFeed?.feed_key, 70);
                alert("Turn on fan successfully!");
            }
            else if (command.includes("tắt quạt")) {
                await updateStatus(fanSpeedFeed?.feed_key, 0);
                alert("Turn off fan successfully!");
            }
        };
    }, []);    

    useEffect(() => {
        // Initiate Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'vi-VN';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
            const text = event.results[0][0].transcript.toLowerCase();
            setTranscript(text);
            processCommandRef.current(text);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Lỗi nhận diện:", event.error);
            setIsListening(false);
        };
        }
    }, []);
    
    

    const toggleListen = () => {
        if (isListening) {
            setIsListening(false);
            recognitionRef.current?.stop();
        } else {
            setTranscript("");
            setIsListening(true);
            recognitionRef.current?.start();
        }
    };

    const handleClose = () => {
        setTranscript("");
        setIsListening(false);
        onClose();
    }

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
        {/* Modal Container */}
        <div className="relative w-full max-w-lg bg-white rounded-[40px] p-12 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
            
            {/* Close Button */}
            <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
            >
            <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center">
            {/* Badge Status */}
            <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                Listening
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-10">
                How can I help you today?
            </h2>

            {/* Waveform Animation Area */}
            <div className="flex items-end gap-1.5 h-20 mb-12">
                {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.7, 0.3].map((h, i) => (
                <div 
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full animate-pulse"
                    style={{ 
                    height: `${h * 100}%`,
                    animationDelay: `${i * 0.1}s` 
                    }}
                />
                ))}
            </div>

            {/* Suggestion / Speech-to-text Display */}
             <div className="w-full bg-slate-50 rounded-[32px] p-8 mb-10 border border-slate-100">
                <p className="text-xl font-medium text-blue-900 mb-2 italic">
                {transcript}
                </p>
                {isListening &&
                <div className="flex justify-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-8">
                <button 
                onClick={handleClose}
                className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                Cancel
                </button>
                
                <button
                disabled={loading} 
                onClick={toggleListen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95">
                <Mic size={20} />
                <span className="font-bold text-sm">Speak Now</span>
                </button>
            </div>
            </div>
        </div>
        </div>
    );
}