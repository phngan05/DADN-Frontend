"use client";

import { Thermometer, Droplet, DoorOpen, Fan, Siren, Sun, Globe } from "lucide-react";
import { Notification } from "../types/noti";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);


interface NotificationDropdownProps {
  notifications: Notification[],
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ notifications, isOpen, onClose }: NotificationDropdownProps) {

  const getIcon = (noti: Notification) => {
    if(noti.noti_type === "Website"){
      return <Globe size={18} className="text-blue-400"/>;
    }
    else{
      return icons[noti.device_category];
    }
  }
  const icons: Record<string, React.ReactNode> = {
        "Temperature": <Thermometer size={18} className="text-red-500" />,
        "Humidity": <Droplet size={18} className="text-blue-300" />,
        "Illuminance": <Sun size={18} className="text-yellow-500" />,
        "LED Intensity": <Siren size={18} className="text-orange-500" />,
        "Fan Speed": <Fan size={18} className="text-blue-700" />,
        "Servo": <DoorOpen size={18} className="text-gray-700" />,
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
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((notification: Notification) => (
            <div
              key={notification.noti_id}
              className={`flex gap-3 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                !notification.is_read ? "bg-blue-50/30" : ""
              }`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              >
                {getIcon(notification)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {notification.title}
                  </p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                    {dayjs(notification.created_at).fromNow()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {notification.body}
                </p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}