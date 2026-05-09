"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AlertTriangle, Mic, X } from "lucide-react";
import { useDeviceControl } from "@/src/hooks/useDeviceControl";
import { useFeeds } from "@/src/hooks/useFeeds";
import { FeedCategory, Feed } from "@/src/types/feed";
import { DashboardMode } from "@/src/types/dashboard";

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

const DASHBOARD_MODE_STORAGE_KEY = "dashboard-mode";

const getStoredDashboardMode = (): DashboardMode => {
  if (typeof window === "undefined") return "manual";

  const storedMode = window.localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
  return storedMode === "automatic" || storedMode === "manual"
    ? storedMode
    : "manual";
};

export default function VoiceControlModal({
  isOpen,
  onClose,
}: VoiceControlModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentMode, setCurrentMode] = useState<DashboardMode>(
    getStoredDashboardMode,
  );
  const [showAutoModeWarning, setShowAutoModeWarning] = useState(false);
  const { updateStatus, loading } = useDeviceControl();
  const { feedsData } = useFeeds();
  const recognitionRef = useRef<any>(null);
  const processCommandRef = useRef<(cmd: string) => Promise<void>>(
    async () => {},
  );

  const feedByCategory = useMemo(() => {
    const map = {} as Partial<Record<FeedCategory, Feed>>;
    for (const feed of feedsData ?? []) {
      map[feed.category] = feed;
    }
    return map;
  }, [feedsData]);

  const ledIntensityFeedKey =
    feedByCategory["LED Intensity"]?.feed_key ?? "led-intensity";
  const fanSpeedFeedKey = feedByCategory["Fan Speed"]?.feed_key ?? "fan-speed";

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const showAutomaticModePopup = () => {
    stopListening();
    setShowAutoModeWarning(true);
  };

  useEffect(() => {
    const syncMode = () => setCurrentMode(getStoredDashboardMode());

    syncMode();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === DASHBOARD_MODE_STORAGE_KEY) {
        syncMode();
      }
    };

    const handleDashboardModeChange = (event: Event) => {
      const mode = (event as CustomEvent<DashboardMode>).detail;
      if (mode === "automatic" || mode === "manual") {
        setCurrentMode(mode);
      } else {
        syncMode();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("dashboard-mode-change", handleDashboardModeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "dashboard-mode-change",
        handleDashboardModeChange,
      );
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(getStoredDashboardMode());
    }
  }, [isOpen]);

  useEffect(() => {
    processCommandRef.current = async (command: string) => {
      const isDeviceControlCommand =
        command.includes("bật đèn") ||
        command.includes("mở đèn") ||
        command.includes("tắt đèn") ||
        command.includes("bật quạt") ||
        command.includes("mở quạt") ||
        command.includes("tắt quạt");

      if (isDeviceControlCommand && currentMode === "automatic") {
        showAutomaticModePopup();
        return;
      }

      if (command.includes("bật đèn") || command.includes("mở đèn")) {
        await updateStatus(ledIntensityFeedKey, 75);
        alert("Turn on light successfully!");
      } else if (command.includes("tắt đèn")) {
        await updateStatus(ledIntensityFeedKey, 0);
        alert("Turn off light successfully!");
      } else if (command.includes("bật quạt") || command.includes("mở quạt")) {
        await updateStatus(fanSpeedFeedKey, 70);
        alert("Turn on fan successfully!");
      } else if (command.includes("tắt quạt")) {
        await updateStatus(fanSpeedFeedKey, 0);
        alert("Turn off fan successfully!");
      }
    };
  }, [updateStatus, ledIntensityFeedKey, fanSpeedFeedKey, currentMode]);

  useEffect(() => {
    // Initiate Speech Recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "vi-VN";
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
      stopListening();
    } else {
      if (currentMode === "automatic") {
        showAutomaticModePopup();
        return;
      }

      setTranscript("");
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleClose = () => {
    setTranscript("");
    setIsListening(false);
    setShowAutoModeWarning(false);
    recognitionRef.current?.stop();
    onClose();
  };

  if (!isOpen) return null;

  if (currentMode === "automatic" || showAutoModeWarning) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>

          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertTriangle size={28} className="text-amber-500" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-slate-800 mb-3">
            Voice Control is disabled in Automatic mode
          </h2>

          <p className="text-center text-sm text-slate-500 mb-7 leading-relaxed">
            Hệ thống đang ở chế độ{" "}
            <span className="font-semibold text-slate-700">Automatic</span>, nên
            không thể điều khiển đèn hoặc quạt bằng giọng nói. Vui lòng chuyển
            sang
            <span className="font-semibold text-slate-700"> Manual</span> trước
            khi dùng Voice Control.
          </p>

          <button
            onClick={handleClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            I understand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-[40px] p-12 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
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
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Suggestion / Speech-to-text Display */}
          <div className="w-full bg-slate-50 rounded-[32px] p-8 mb-10 border border-slate-100">
            <p className="text-xl font-medium text-blue-900 mb-2 italic">
              {transcript}
            </p>
            {isListening && (
              <div className="flex justify-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mic size={20} />
              <span className="font-bold text-sm">Speak Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
