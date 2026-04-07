"use client";

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const VoiceControl = () => {
  const [isListening, setIsListening] = useState(false);
  const [isLightOn, setIsLightOn] = useState(false);
  const [isFanOn, setIsFanOn] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Khởi tạo Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'vi-VN';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript.toLowerCase();
        setTranscript(text);
        processCommand(text);
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

  const processCommand = (command: string) => {
    if (command.includes("bật đèn") || command.includes("mở đèn")) {
      setIsLightOn(true);
    } else if (command.includes("tắt đèn")) {
      setIsLightOn(false);
    } else if (command.includes("bật quạt") || command.includes("mở quạt")) {
      setIsFanOn(true);
    } else if (command.includes("tắt quạt")) {
      setIsFanOn(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Smart Home Voice Control</h1>

      <div className="flex gap-20 mb-12">
        {/* Mô phỏng Đèn */}
        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full mb-4 transition-all duration-500 shadow-lg ${
            isLightOn ? 'bg-yellow-400 shadow-yellow-500/50 scale-110' : 'bg-gray-700 shadow-black'
          }`}></div>
          <p className="font-semibold">ĐÈN: {isLightOn ? "ON" : "OFF"}</p>
        </div>

        {/* Mô phỏng Quạt */}
        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 border-4 border-dashed rounded-full mb-4 transition-all duration-1000 ${
            isFanOn ? 'animate-spin border-blue-400' : 'border-gray-700'
          } flex items-center justify-center`}>
             <div className="w-2 h-16 bg-gray-500 rounded-full"></div>
          </div>
          <p className="font-semibold">QUẠT: {isFanOn ? "ON" : "OFF"}</p>
        </div>
      </div>

      {/* Hiển thị văn bản nhận diện */}
      <div className="h-10 text-gray-400 italic mb-4 text-center">
        {transcript && `Bạn đã nói: "${transcript}"`}
      </div>

      {/* Nút bấm */}
      <button
        onClick={toggleListen}
        className={`px-8 py-4 rounded-full font-bold transition-all ${
          isListening 
            ? 'bg-red-500 animate-pulse scale-105' 
            : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {isListening ? "Đang lắng nghe..." : "Bấm để ra lệnh (Tiếng Việt)"}
      </button>

      <div className="mt-6 text-sm text-gray-500">
        Thử nói: "Bật đèn", "Tắt đèn", "Bật quạt"...
      </div>
    </div>
  );
};

export default VoiceControl;