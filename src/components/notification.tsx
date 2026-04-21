"use client";

import { useState } from "react";
import { Thermometer, Droplet, Snowflake, Fan, Wifi, Check } from "lucide-react";

interface Notification {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      icon: <Thermometer size={16} />,
      iconBg: "bg-red-100 text-red-500",
      title: "High temperature detected",
      description: "Server Rack A-12 reached 85°C. Cooling systems engaged.",
      time: "2 mins ago",
      isRead: false,
    },
    {
      id: "2",
      icon: <Droplet size={16} />,
      iconBg: "bg-orange-100 text-orange-500",
      title: "Humidity exceeded safe threshold",
      description: "Storage Unit 4 reported 72% RH. Check dehumidifier status.",
      time: "15 mins ago",
      isRead: false,
    },
    {
      id: "3",
      icon: <Snowflake size={16} />,
      iconBg: "bg-cyan-100 text-cyan-500",
      title: "Light sensor disconnected",
      description: "Entrance hallway sensor is no longer reporting data.",
      time: "1 hour ago",
      isRead: true,
    },
    {
      id: "4",
      icon: <Fan size={16} />,
      iconBg: "bg-amber-100 text-amber-500",
      title: "Fan response delayed",
      description: "Ventilation Fan #08 showing high latency in command execution.",
      time: "3 hours ago",
      isRead: true,
    },
    {
      id: "5",
      icon: <Wifi size={16} />,
      iconBg: "bg-rose-100 text-rose-500",
      title: "Device connection unstable",
      description: "Main Gateway experienced 3 reconnections in the last hour.",
      time: "5 hours ago",
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={markAllAsRead}
            className="text-xs text-slate-400 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
          >
            <Check size={14} />
            Mark all as read
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex gap-3 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                !notification.isRead ? "bg-blue-50/30" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${notification.iconBg}`}
              >
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {notification.title}
                  </p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                    {notification.time}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {notification.description}
                </p>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}