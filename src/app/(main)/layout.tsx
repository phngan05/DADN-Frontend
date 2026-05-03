"use client";
import Sidebar from "@/src/components/sidebar";
import Header from "@/src/components/header";
import apiClient from "@/src/services/api";
import { useEffect} from "react";
import { useUser } from "@/src/hooks/useUser";
import { useNotification } from "@/src/hooks/useNoti";
import { useRouter } from "next/navigation";
import UserContext from "@/src/context/userContext";
import Cookies from "js-cookie"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const {userData, setUserData, updateUserData, loading, error, refreshUser} = useUser();
  const {notifications, updateRead} = useNotification();
  const router = useRouter()

  useEffect(() => {
    const initMQTTSession = async () => {
      try {
        const token = Cookies.get("token")
        if(!token){
          router.push("/login");
        }
        // Awake MQTT session by making a request to the backend
        console.log("Kích hoạt MQTT session...");
        await apiClient.get(`/record/all`);

      } catch (error) {
        console.error("Initiate MQTT session failed:", error);
      }
    };
    initMQTTSession();
  }, []);
  
  return (
    <UserContext.Provider value={
      { userData, 
        setUserData, 
        updateUserData, 
        loading, 
        error, 
        refreshUser, 
        notifications, 
        updateRead,
      }
      }>
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Fixed Sidebar */}
      <aside className="w-64 h-screen sticky top-0 flex-shrink-0 border-r bg-white z-20">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Fixed Header */}
        <header className="h-16 sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md flex-shrink-0">
          <Header/>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
    </UserContext.Provider>
  );
}