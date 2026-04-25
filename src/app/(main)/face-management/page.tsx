"use client";

import { useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import { useFaceID } from "@/src/hooks/useFaceID";
import UserPhoto from "@/src/components/user-photo";

export default function FaceManagementPage() {
  const {faceids,
        addNewFaceid,
        updateFaceidStatus} = useFaceID()

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const handleAddFaceID = async () => {
    if (confirm(`Add your FaceID information?`)) {
      await addNewFaceid();
    }

  }

  const handleChangeStatus = async (id: string, isActive: boolean) => {
    const message = `You want to ${isActive? "inactivate" : "activate"} this FaceID?`
    if (confirm(message)) {
      await updateFaceidStatus(id, !isActive);
    }
  }
  return (
    <div className="p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-slate-800">
            ComHome Face ID Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage biometric access profiles for your smart habitat.
          </p>
          <div className="flex justify-end rounded-2xl">
            <button 
            onClick={handleAddFaceID}
            className="flex px-6 py-2 button-primary gap-2">
              <Plus size={16} className="y-space-2"/> Add new FaceID
            </button>
        </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_0.5fr] px-6 py-4 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Authorized User
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Registration Date
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Access Status
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Actions
            </span>
          </div>

          {/* Table Body */}
          {faceids?.map((faceid) => (
            <div
              key={faceid.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_0.5fr] items-center px-6 py-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
            >
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {faceid.photo_url ? (
                    <UserPhoto src={faceid.photo_url}
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-500">
                      {faceid.full_name}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{faceid.full_name}</p>
                </div>
              </div>

              {/* Registration Date */}
              <p className="text-sm text-slate-600">{new Date(faceid.created_at).toLocaleDateString("vi-VN")}</p>

              {/* Status */}
              <div>
                {faceid.is_active? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-600 border border-green-100">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                    InActive
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === faceid.id ? null : faceid.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <MoreVertical size={18} />
                </button>

                {openMenuId === faceid.id && (
                  <>
                    <div
                      className="fixed"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 overflow-hidden">
                      <button 
                      onClick={() => handleChangeStatus(faceid.id, faceid.is_active)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        {faceid.is_active? "Inactivate": "Activate"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}