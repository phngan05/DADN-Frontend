"use client";
import Sidebar from "@/src/components/sidebar";
import Header from "@/src/components/header";
import UserPhoto from "@/src/components/user-photo";
import apiClient from "@/src/services/api";
import { Eye, Settings as SettingIcon, Camera, Plus, UserSquare2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/src/types/user";

export default function SettingPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<User>({ 
        user_id: "", 
        full_name: "", 
        photoUrl: "", 
        username: "" 
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token){
                    router.push("/login");
                    return;
                }
                const response = await apiClient.get(`/user`);
                setUserData(response.data);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUserData();
    }, [router]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
            
            <aside className="w-64 h-screen sticky top-0 flex-shrink-0 border-r bg-white z-20">
                <Sidebar dashboardActive={false} faceManagementActive={false} settingActive={true} />
            </aside>
        
            <div className="flex flex-col flex-1 min-w-0">
                <header className="h-16 sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md flex-shrink-0">
                  <Header />
                </header>
                
                <main className="flex-1 overflow-y-auto p-10 bg-slate-50">
                    <div className="max-w-6xl mx-auto"> {/* Thêm mx-auto để căn giữa nội dung */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-extrabold text-slate-800">ComHome System Configuration</h2>
                            <p className="text-slate-500 text-sm">Manage your premium environment and feed identity.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-8">
                            {/* Profile Card */}
                            <div className="col-span-2 bg-white p-6 rounded-3xl flex gap-6 items-center shadow-sm border border-slate-100">
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    <UserPhoto src={userData.photoUrl} />
                                    <button className="absolute bottom-1 right-1 button-primary p-1.5 rounded-lg shadow-lg">
                                        <Camera size={12} />
                                    </button>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</label>
                                        <input className="w-full bg-slate-100 px-4 py-2 rounded-xl text-sm outline-none border border-transparent focus:border-blue-200" defaultValue={userData.full_name || "Alex Rivera"} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Username</label>
                                        <input className="w-full bg-slate-100 px-4 py-2 rounded-xl text-sm outline-none border border-transparent focus:border-blue-200" defaultValue={userData.username || "alex.rivera"} />
                                    </div>
                                    <div className="col-span-2 flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                                        <div>
                                            <p className="text-sm font-bold">Door Security</p>
                                            <p className="text-[10px] text-slate-400">Last changed 4 months ago</p>
                                        </div>
                                        <button className="button-primary px-6 py-2 rounded-xl text-sm font-semibold transition-colors">Update Password</button>
                                    </div>
                                </div>
                            </div>

                            {/* Adafruit IO Card */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><SettingIcon size={18} /></div>
                                    <h3 className="font-bold text-sm">Adafruit IO Connectivity</h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1">USERNAME</label>
                                        <div className="relative bg-slate-100 rounded-xl px-3 py-2 flex items-center">
                                            <UserSquare2 size={14} className="mr-2 text-slate-400" />
                                            <input className="bg-transparent text-xs outline-none w-full" defaultValue="arivera_smart" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1">API KEY</label>
                                        <div className="relative bg-slate-100 rounded-xl px-3 py-2 flex items-center">
                                            <span className="mr-2 text-slate-400 text-xs">🔑</span>
                                            <input className="bg-transparent text-xs outline-none w-full" type="password" defaultValue="............" />
                                            <Eye size={14} className="text-slate-400 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feed Setting Section */}
                        <div className="bg-white/60 p-8 rounded-[32px] backdrop-blur-sm border border-white shadow-sm mb-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800">Adafruit Feed Setting</h3>
                                <button className="text-blue-600 flex items-center gap-1 text-xs font-bold hover:underline">
                                    <Plus size={16} /> Provision New Feed
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {['Humidity', 'Temperature'].map((item) => (
                                    <div key={item} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-50 hover:border-blue-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-50 p-3 rounded-xl text-slate-400 border border-slate-100"><Eye size={18} /></div>
                                            <div>
                                                <p className="font-bold text-sm">{item}</p>
                                                <p className="text-[10px] text-slate-400">Feed key: {item === 'Humidity' ? 'humid' : 'temp'}</p>
                                            </div>
                                        </div>
                                        <button className="text-slate-300 hover:text-blue-600 transition-colors"><SettingIcon size={18} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}