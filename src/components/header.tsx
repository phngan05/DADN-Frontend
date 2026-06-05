"use client";

import { Bell, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import UserPhoto from "./user-photo";
import NotificationDropdown from "./notification";
import { useUserContext } from "../context/userContext";
import { Notification } from "../types/noti";
export default function Header() {
  const { userData, loading, notifications, updateRead } = useUserContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [unreadCount, setUnreadCount] = useState(0);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(new Date());
    updateNow();
    const intervalId = setInterval(updateNow, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (notifications) {
        const count = notifications.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(count);
    }
}, [notifications]);

  const handleShowNotifications = async () => {
    setShowNotifications(true);
    if(unreadCount){
      await updateRead();
    }
  }

  const displayDate = now
    ? `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`
    : "--";
  const hours = now?.getHours();
  const displayHours = typeof hours === "number" ? hours % 12 || 12 : "--";
  const minutes = now?.getMinutes();
  const displayMinutes = typeof minutes === "number" ? minutes.toString().padStart(2, "0") : "--";
  const ampm = typeof hours === "number" && hours >= 12 ? "PM" : "AM";
  const displayTime = `${displayHours.toString().padStart(2, "0")}:${displayMinutes}${
    now ? ` ${ampm}` : ""
  }`;

  return (
    <header className="flex justify-between items-center bg-white px-8 py-4 border-b border-gray-50">
      <div className="flex items-center gap-3 text-blue-900 border-l-2 border-blue-100 pl-4">
        <p className="text-xs font-semibold text-gray-400">
          {displayDate}
        </p>
        <div className="flex items-center gap-1 font-bold">
          <Clock size={16} className="text-blue-500" />
          <span>{displayTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            onClick={handleShowNotifications}
            className="relative"
          >
            <Bell className="text-gray-400 hover:text-gray-600 transition-colors" size={22} />
            {unreadCount? 
            (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>)
            : <div></div>}
          </button>
          <NotificationDropdown
            notifications={notifications}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {!loading && <p className="text-sm font-bold text-gray-800">{userData.full_name}</p>}
            {!loading && <p className="text-[10px] text-gray-400">Home Owner</p>}
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden relative">
             {!loading && <UserPhoto src={userData.photo_url} />}
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}