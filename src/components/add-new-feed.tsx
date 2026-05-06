"use client";

import React, { useState } from "react";
import { X, ChevronDown, ArrowRight } from "lucide-react";
import { FeedCategory } from "../types/feed";

interface ProvisionFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { type: FeedCategory; key: string }) => void;
}

export default function ProvisionFeedModal({
  isOpen,
  onClose,
  onComplete,
}: ProvisionFeedModalProps) {
  const [feedType, setFeedType] = useState<FeedCategory>("Temperature");
  const [feedKey, setFeedKey] = useState("");
  const feedOptions: FeedCategory[] = [
    "Temperature",
    "Humidity",
    "Illuminance",
    "LED Intensity",
    "Fan Speed",
    "Servo",
  ];

  if (!isOpen) return null;

  const handleSubmit = () => {
    onComplete({ type: feedType, key: feedKey });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/20 backdrop-blur-md">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-8">
          Provision New Feed
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {/* Feed Type Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Feed Type
            </label>
            <div className="relative">
              <select
                value={feedType}
                onChange={(e) => setFeedType(e.target.value as FeedCategory)}
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 appearance-none outline-none focus:border-blue-300 transition-all cursor-pointer"
              >
                {feedOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Feed Key Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Feed key
            </label>
            <input
              type="text"
              value={feedKey}
              onChange={(e) => setFeedKey(e.target.value)}
              placeholder="e.g. led-intensity"
              className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-300 transition-all"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleSubmit}
            className="w-full button-primary py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
          >
            Complete Provisioning
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onClose}
            className="text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
