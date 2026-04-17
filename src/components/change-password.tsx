"use client";

import React, { useState } from "react";
import { X, ArrowRight} from "lucide-react";
import { useDeviceControl } from "../hooks/useDeviceControl";
interface DoorPasswordModalProps {
  onClose: () => void;
  onCompleted: (oldPassword: string, newPassword: string) => void;
}

export default function ChangePasswordModal({
  onClose,
  onCompleted,
}: DoorPasswordModalProps) {
    const [newPassword, setNewPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");

  
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
            <div className="space-y-2 mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Old Password
                </label>
                <input
                    type="password"
                    placeholder="Enter old password..."
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-300 transition-all"
                />
          </div>

          <div className="space-y-2 mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    New Password
                </label>
                <input
                    type="password"
                    placeholder="Enter new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-300 transition-all"
                />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={() => onCompleted(oldPassword, newPassword)}
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