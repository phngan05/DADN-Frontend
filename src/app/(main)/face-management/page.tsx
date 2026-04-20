"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";

interface FaceUser {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  registrationDate: string;
  status: "active" | "temporary";
}

export default function FaceManagementPage() {
  const [users] = useState<FaceUser[]>([
    {
      id: "1",
      name: "Alex Rivera",
      role: "Admin",
      avatar: null,
      registrationDate: "Mar 20, 2023",
      status: "active",
    },
    {
      id: "2",
      name: "Hieu Nguyen",
      role: "Family",
      avatar: null,
      registrationDate: "Apr 12, 2023",
      status: "active",
    },
    {
      id: "3",
      name: "Sarah Lee",
      role: "Guest",
      avatar: null,
      registrationDate: "Jan 05, 2024",
      status: "temporary",
    },
  ]);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-800">
            ComHome Face ID Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage biometric access profiles for your smart habitat.
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_0.5fr] items-center px-6 py-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
            >
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-500">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.role}</p>
                </div>
              </div>

              {/* Registration Date */}
              <p className="text-sm text-slate-600">{user.registrationDate}</p>

              {/* Status */}
              <div>
                {user.status === "active" ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-600 border border-green-100">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                    Temporary
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <MoreVertical size={18} />
                </button>

                {openMenuId === user.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 overflow-hidden">
                      <button className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        View Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        Edit Access
                      </button>
                      <div className="border-t border-slate-50" />
                      <button className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50">
                        Revoke Access
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
