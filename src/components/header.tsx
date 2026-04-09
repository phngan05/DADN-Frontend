import { Bell, Clock } from "lucide-react";
import UserPhoto from "./user-photo";
import { useEffect, useState } from "react";
import apiClient from "../services/api";
import { User } from "../types/user";
export default function Header() {
  const [userData, setUserData] = useState<User>({ 
      user_id: "", 
      full_name: "", 
      photo_url: null, 
      username: "" 
      });
  const date = new Date();
  useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiClient.get(`/user`);
                const userData = response.data;
                setUserData(userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);
  return (
    <header className="flex justify-between items-center bg-white px-8 py-4 border-b border-gray-50">
      <div className="flex items-center gap-3 text-blue-900 border-l-2 border-blue-100 pl-4">
        <p className="text-xs font-semibold text-gray-400">{date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()}</p>
        <div className="flex items-center gap-1 font-bold">
          <Clock size={16} className="text-blue-500" />
          <span>{date.getHours()}:{date.getMinutes().toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Bell className="text-gray-400" size={22} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">2</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{userData.full_name}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden relative">
             <UserPhoto src={userData.photo_url} />
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}