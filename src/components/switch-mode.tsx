"use client";

import { useState } from "react";
import { AlertTriangle, Bot, Hand, ArrowRight, Shield } from "lucide-react";

interface SwitchModeProps {
  currentMode: "automatic" | "manual";
  onModeChange: (mode: "automatic" | "manual") => void;
}

export default function SwitchMode({ currentMode, onModeChange }: SwitchModeProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<"automatic" | "manual" | null>(null);

  const handleModeClick = (mode: "automatic" | "manual") => {
    if (mode !== currentMode) {
      setPendingMode(mode);
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    if (pendingMode) {
      onModeChange(pendingMode);
    }
    setShowConfirm(false);
    setPendingMode(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingMode(null);
  };

  return (
    <>
      {/* Toggle Buttons */}
      <div className="flex bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => handleModeClick("automatic")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            currentMode === "automatic"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Automatic
        </button>
        <button
          onClick={() => handleModeClick("manual")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            currentMode === "manual"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Manual
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
            {/* Warning Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={28} className="text-amber-500" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-slate-800 mb-3">
              Confirm Mode Change
            </h2>

            {/* Description */}
            <p className="text-center text-sm text-slate-500 mb-6 leading-relaxed">
              Switching to{" "}
              <span className="font-semibold text-slate-700 underline">
                {pendingMode === "automatic" ? "Automatic" : "Manual"}
              </span>{" "}
              mode will{" "}
              {pendingMode === "automatic"
                ? "resume automated learning and behaviors."
                : "pause automated learning and behaviors."}
            </p>

            {/* Mode Comparison */}
            <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-center gap-6 mb-6 border border-slate-100">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  Current
                </p>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  {currentMode === "automatic" ? (
                    <Bot size={24} className="text-blue-500" />
                  ) : (
                    <Hand size={24} className="text-amber-500" />
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {currentMode === "automatic" ? "Automatic" : "Manual"}
                </p>
              </div>

              <ArrowRight size={20} className="text-slate-300 mt-4" />

              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  New Mode
                </p>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  {pendingMode === "automatic" ? (
                    <Bot size={24} className="text-blue-500" />
                  ) : (
                    <Hand size={24} className="text-amber-500" />
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {pendingMode === "automatic" ? "Automatic" : "Manual"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleConfirm}
              className="w-full button-primary py-3.5 mb-3 shadow-lg shadow-blue-100"
            >
              Confirm Switch
            </button>
            <button
              onClick={handleCancel}
              className="w-full text-center text-sm font-semibold text-blue-500 hover:text-blue-700 py-2 transition-colors"
            >
              Cancel
            </button>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-slate-100">
              <Shield size={12} className="text-slate-300" />
              <p className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">
                Lumina Secure Authentication Required
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
