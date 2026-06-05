"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, RefreshCw, X } from "lucide-react";
import Image from "next/image";
import apiClient from "@/src/services/api";
import { notify } from "../utils/notify";

interface FaceUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

const FACE_VERIFY_ENDPOINT = "/faceid/verify";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export default function FaceUnlockModal({
  isOpen,
  onClose,
  onBack,
}: FaceUnlockModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    try {
      stopStream();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch {
      setError("Cannot access camera. Please allow camera permission.");
    } finally {
      setIsStarting(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedBlob(null);
      setPreviewUrl(null);
      setError(null);
      return;
    }

    void startCamera();
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!capturedBlob) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", capturedBlob, "capture.jpg");

      const response = await apiClient.post(FACE_VERIFY_ENDPOINT, formData);

      const data = response.data ?? {};
      const confidence =
        typeof data.confidence === "number"
          ? data.confidence
          : typeof data.score === "number"
            ? data.score
            : typeof data.similarity === "number"
              ? data.similarity
              : null;
      const isMatch = Boolean(data.is_match ?? data.matched ?? data.opened);

      if (isMatch || (typeof confidence === "number" && confidence >= 0.7)) {
        try {
          await apiClient.put("/record", {
            feed_key: "servo",
            value: 1,
          });
          notify.success("Face verified. Door request sent.");
          onClose();
        } catch (err: unknown) {
          const msg = getErrorMessage(err, "Door request failed.");
          setError(msg);
          notify.error("Door request failed.")
        }
      } else {
        const percent =
          typeof confidence === "number"
            ? ` (${Math.round(confidence * 100)}%)`
            : "";
        notify.error(`Face not recognized${percent}.`);
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Face verification failed.");
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/20 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Face Unlock</h2>
          <button
            onClick={onBack}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Use password
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="relative rounded-3xl bg-slate-900/5 border border-slate-100 overflow-hidden aspect-[4/3] flex items-center justify-center">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Captured"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Capture a clear, front-facing photo. The image will be sent to the backend for
                verification.
              </p>
              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFilePick}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-3">
              {!previewUrl ? (
                <>
                  <button
                    onClick={handleCapture}
                    disabled={isStarting}
                    className="w-full button-primary py-3 flex items-center justify-center gap-2"
                  >
                    {isStarting ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    Capture photo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <ImageIcon size={16} />
                    Upload photo
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full button-primary py-3 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    Verify & unlock
                  </button>
                  <button
                    onClick={handleRetake}
                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Retake
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
