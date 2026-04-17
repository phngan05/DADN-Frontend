"use client";

import React, { useState } from "react";
import { X, ArrowRight} from "lucide-react";
interface DoorPasswordModalProps {
  onClose: () => void;
  onCompleted: (inputPassword: string) => void
  onChangePassword: () => void;
}

export default function DoorPasswordModal({
  onClose,
  onCompleted,
  onChangePassword,
}: DoorPasswordModalProps) {
    const [password, setPassword] = useState("");
  
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
          Open Door
        </h2>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-300 transition-all"
          />
          <button
            onClick = {onChangePassword}
            className="px-2 mt-2 text-blue-600 flex items-center gap-1 text-xs font-bold hover:underline">
            Change password
        </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={() => onCompleted(password)}
            className="w-full button-primary py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
          >
            Submit
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