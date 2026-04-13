import { LayoutDashboard, ScanFace, Settings, Mic, LogOut, Zap, DoorOpen } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import { useState } from "react";
import { logout } from "../services/auth";
import VoiceControlModal from "./voice";
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isSettingActive = pathname === '/setting';
  const isDashboardActive = pathname === '/';
  const isFaceManagementActive = pathname === '/face-management';
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", active: isDashboardActive },
    { icon: <ScanFace size={20} />, label: "Face Management", active: isFaceManagementActive },
    { icon: <Settings size={20} />, label: "Setting", active: isSettingActive },
  ];
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const handleChangeTab = (label: string) => {
    switch (label) {
      case "Dashboard":
        router.push("/");
        break;
      case "Face Management":
        router.push("/face-management");
        break;
      case "Setting":
        router.push("/setting");
        break;
    }
  };
  const handleOpenDoor = () => {
    const password = prompt("Enter password:");
    if (password === "comhome") {
      alert("Door opened successfully!");
    } else {
      alert("Incorrect password. Access denied.");
    }
  };

  return (
    <div >
    <aside className="w-64 bg-white h-screen flex flex-col p-6 border-r border-gray-100">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="bg-blue-600 p-1.5 rounded-full text-white">
          <Zap size={16} />
        </div>
        <h1 className="font-bold text-xl text-blue-900">COMHOME</h1>
      </div>

      <div className="flex-1">
        <p className="text-[10px] font-bold text-gray-400 mb-4 px-2 uppercase tracking-wider">Main Menu</p>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active ? "primary shadow-lg shadow-blue-200" : "text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => handleChangeTab(item.label)}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        <button
        onClick={() => handleOpenDoor()}
        className="w-full primary flex items-center justify-center gap-2 py-3 rounded-3xl shadow-md">
          <DoorOpen size={18} />
          <span className="font-medium">Open Door</span>
        </button>
        <button
        onClick={() => setIsVoiceOpen(true)}
        className="w-full primary flex items-center justify-center gap-2 py-3 rounded-3xl shadow-md">
          <Mic size={18} />
          <span className="font-medium">Voice Control</span>
        </button>
        <button 
        className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-red-500 transition-colors"
        onClick={logout}
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Log out</span>
        </button>
      </div>
    </aside>
    
      <VoiceControlModal 
      isOpen={isVoiceOpen} 
      onClose={() => setIsVoiceOpen(false)} 
    />
    </div>
    
  );
}