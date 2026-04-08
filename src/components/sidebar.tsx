import { LayoutDashboard, ScanFace, Settings, Mic, LogOut } from "lucide-react";

interface SidebarProps {
  dashboardActive?: boolean;
  faceManagementActive?: boolean;
  settingActive?: boolean;
}

export default function Sidebar({ dashboardActive, faceManagementActive, settingActive }: SidebarProps) {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", active: dashboardActive ?? false },
    { icon: <ScanFace size={20} />, label: "Face Management", active: faceManagementActive ?? false },
    { icon: <Settings size={20} />, label: "Setting", active: settingActive ?? false },
  ];

  return (
    <aside className="w-64 bg-white h-screen flex flex-col p-6 border-r border-gray-100">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="bg-blue-600 p-1.5 rounded-full text-white">
          <span className="font-bold text-xl">⚡</span>
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
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        <button className="w-full primary flex items-center justify-center gap-2 py-3 rounded-2xl shadow-md">
          <Mic size={18} />
          <span className="font-medium">Voice Control</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-red-500 transition-colors">
          <LogOut size={18} />
          <span className="font-medium text-sm">Log out</span>
        </button>
      </div>
    </aside>
  );
}