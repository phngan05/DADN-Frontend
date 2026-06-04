// "use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Mic, X } from "lucide-react";
import { useDeviceControl } from "@/src/hooks/useDeviceControl";
import { useFeeds } from "@/src/hooks/useFeeds";
import { FeedCategory, Feed } from "@/src/types/feed";
import { DashboardMode } from "@/src/types/dashboard";
import apiClient from "@/src/services/api";

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  length: number;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export default function VoiceControlModal({
  isOpen,
  onClose,
}: VoiceControlModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentMode, setCurrentMode] = useState<DashboardMode>("manual");
  const [isModeLoading, setIsModeLoading] = useState(true);
  const [showAutoModeWarning, setShowAutoModeWarning] = useState(false);
  const { updateStatus, loading } = useDeviceControl();
  const { feedsData } = useFeeds();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
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

  const stopListening = useCallback(() => {
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const showAutomaticModePopup = useCallback(() => {
    stopListening();
    setShowAutoModeWarning(true);
  }, [stopListening]);

  const syncModeFromBackend = useCallback(async (): Promise<DashboardMode> => {
    setIsModeLoading(true);

    try {
      const response = await apiClient.get("/record/auto/status");

      const syncedMode: DashboardMode = response.data?.auto_mode
        ? "automatic"
        : "manual";

      setCurrentMode(syncedMode);
      return syncedMode;
    } catch (error) {
      console.error("Cannot sync dashboard mode from backend:", error);

      // Nếu không hỏi được backend, chặn điều khiển để tránh gửi lệnh khi hệ thống có thể đang Auto.
      setCurrentMode("automatic");
      return "automatic";
    } finally {
      setIsModeLoading(false);
    }
  }, []);

  const switchToManualMode = useCallback(async () => {
    try {
      await apiClient.put("/record/auto?enabled=false");
      setCurrentMode("manual");
      setShowAutoModeWarning(false);
    } catch (error) {
      console.error("Cannot switch to manual mode:", error);
      window.alert("Không thể chuyển sang Manual. Vui lòng thử lại.");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void syncModeFromBackend();
    }
  }, [isOpen, syncModeFromBackend]);

  useEffect(() => {
    processCommandRef.current = async (command: string) => {
      const isDeviceControlCommand =
        command.includes("bật đèn") ||
        command.includes("mở đèn") ||
        command.includes("tắt đèn") ||
        command.includes("bật quạt") ||
        command.includes("mở quạt") ||
        command.includes("tắt quạt");

      if (isDeviceControlCommand) {
        const latestMode = await syncModeFromBackend();

        if (latestMode === "automatic") {
          showAutomaticModePopup();
          return;
        }
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
  }, [updateStatus, ledIntensityFeedKey, fanSpeedFeedKey, syncModeFromBackend, showAutomaticModePopup]);

  useEffect(() => {
    // Initiate Speech Recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "vi-VN";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        const text = transcript.toLowerCase();
        setTranscript(text);
        void processCommandRef.current(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.error("Lỗi nhận diện:", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = async () => {
    if (isListening) {
      stopListening();
    } else {
      const latestMode = await syncModeFromBackend();

      if (latestMode === "automatic") {
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

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              Hủy
            </button>

            <button
              onClick={switchToManualMode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              Chuyển Manual
            </button>
          </div>
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
              disabled={loading || isModeLoading}
              onClick={toggleListen}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mic size={20} />
              <span className="font-bold text-sm">
                {isModeLoading ? "Checking Mode..." : "Speak Now"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
