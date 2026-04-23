"use client";
import SettingInput from "@/src/components/setting-input";
import UserPhoto from "@/src/components/user-photo";
import { Settings as SettingIcon, User as UserIcon, CloudSync, Orbit, Plus, Thermometer, Droplet, Sun, Siren, Fan, Lightbulb } from "lucide-react";
import ProvisionFeedModal from "@/src/components/add-new-feed";
import { useFeeds } from "@/src/hooks/useFeeds";
import { useEffect, useState } from "react";
import { useUserContext } from "@/src/context/userContext";
import { User } from "@/src/types/user";
import { FeedCategory } from "@/src/types/feed";
import ImageUploadButton from "@/src/components/update-photo";
export default function SettingPage() {
    const { userData, setUserData, updateUserData, loading } = useUserContext();
    const [editedUserData, setEditedUserData] = useState<User>(userData);
    const { feedsData, adafruitData, addNewFeed, updateFeeds, deleteFeed, refreshFeeds } = useFeeds();
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const feedIcons: Record<string, React.ReactNode> = {
        "Temperature": <Thermometer size={18} className="text-red-500" />,
        "Humidity": <Droplet size={18} className="text-blue-300" />,
        "Illuminance": <Sun size={18} className="text-yellow-500" />,
        "LED Intensity": <Siren size={18} className="text-orange-500" />,
        "Fan Speed": <Fan size={18} className="text-blue-700" />,
        "LED Status": <Lightbulb size={18} className="text-yellow-500" />,
        "Servo": <Orbit size={18} className="text-gray-700" />,
    };
    const [isProvisionOpen, setIsProvisionOpen] = useState(false);

    const handleUpdateUser = async () => {
        setUserData(editedUserData);
        await updateUserData();
    };
    const handleProvision = async (data: { type: string; key: string }) => {
        const response = await addNewFeed({ type: data.type, key: data.key });
        if (response) {
            alert(`Feed "${data.type}" with key "${data.key}" has been provisioned!`);
            setIsProvisionOpen(false);
        }
        else{
            alert("Failed to provision feed. Please try again.");
            setIsProvisionOpen(true);
        }
    };

    const toggleDropdown = (id: string) => {
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleEditFeed = (feed: { feed_id: string; feed_key: string; category: FeedCategory }) => {
        const newKey = prompt("Enter new feed key:", feed.feed_key);
        if (newKey && newKey.trim() !== "") {
            updateFeeds({ ...feed, feed_key: newKey.trim() });
        }
    };
    const handleDeleteFeed = (feed: { feed_id: string; feed_key: string; category: string }) => {
        if (confirm(`Are you sure you want to delete feed "${feed.category}"?`)) {
            deleteFeed(feed.feed_id);
        }

    };

    const handleUpdatePhoto = (url: string) => {
        console.log("Ảnh mới đã upload tại:", url);
        setEditedUserData(prev => ({ ...prev, photo_url: url }))
    };

    useEffect(() => {
        if (userData) {
            setEditedUserData(userData);
        }
    }, [userData]);

    return (
        <div>  
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-extrabold text-slate-800">ComHome System Configuration</h2>
                    <p className="text-slate-500 text-sm">Manage your premium environment and feed identity.</p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                    {/* Profile Card */}
                    <div className="col-span-2 bg-white p-6 rounded-3xl flex gap-6 items-center shadow-sm border border-slate-100">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                            <UserPhoto src={editedUserData.photo_url} />
                            <ImageUploadButton onUploadSuccess={handleUpdatePhoto}/>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                                <SettingInput 
                                    label="Full Name"
                                    value={userData?.full_name}
                                    onChange={(e) => setEditedUserData(prev => ({ ...prev, full_name: e.target.value }))}
                                    isLoading={loading}
                                    uniqueKey={userData?.user_id}
                                />
                                
                            </div>
                            <div>
                                <SettingInput
                                    label="User Name"
                                    value={userData?.username}
                                    onChange={(e) => setEditedUserData(prev => ({ ...prev, username: e.target.value }))}
                                    isLoading={loading}
                                    uniqueKey={userData?.user_id}
                                />
                            </div>
                            <div></div>
                            <div className="flex justify-end items-center mt-2 pt-2 border-t border-slate-50">
                                <button 
                                onClick={() => handleUpdateUser()}
                                className="button-primary px-6 py-2">
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Adafruit IO Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><CloudSync size={18} /></div>
                            <h3 className="font-bold text-sm">Adafruit IO Connectivity</h3>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                <UserIcon size={12} className="inline-block mr-2" />
                                <span>USER NAME</span>
                            
                            </label>
                            <input
                                key={adafruitData?.server_id}
                                type="text"
                                defaultValue={adafruitData?.username}
                                disabled
                                className="w-full bg-slate-100 px-4 py-2 rounded-xl text-sm text-slate-400 outline-none border border-transparent focus:border-blue-200 transition-all"
                                />
                        </div>
                    </div>
                </div>

                {/* Feed Setting Section */}
                <div className="bg-white/60 p-8 rounded-[32px] backdrop-blur-sm border border-white shadow-sm mb-10">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Adafruit Feed Setting</h3>
                        <button 
                            onClick={() => setIsProvisionOpen(true)}
                            className="text-blue-600 flex items-center gap-1 text-xs font-bold hover:underline">
                            <Plus size={16} /> Provision New Feed
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {feedsData?.map((feed) => (
                            <div key={feed.feed_id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-50 hover:border-blue-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl text-slate-400 border border-slate-100">{feedIcons[feed.category]}</div>
                                    <div>
                                        <p className="font-bold text-sm">{feed.category}</p>
                                        <p className="text-[10px] text-slate-400">Feed key: {feed.feed_key}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button 
                                        onClick={() => toggleDropdown(feed.feed_id)}
                                        className={`p-2 rounded-lg transition-colors ${openDropdownId === feed.feed_id ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:text-blue-600'}`}
                                    >
                                        <SettingIcon size={18} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openDropdownId === feed.feed_id && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={() => setOpenDropdownId(null)}
                                            ></div>
                                            
                                            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                                                <button 
                                                    onClick={() => { handleEditFeed(feed); }}
                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    Edit Feed
                                                </button>
                                                <div className="border-t border-slate-50"></div>
                                                <button 
                                                    onClick={() => { handleDeleteFeed(feed); setOpenDropdownId(null); }}
                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    Delete Feed
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
        </div>
        <ProvisionFeedModal 
            isOpen={isProvisionOpen} 
            onClose={() => setIsProvisionOpen(false)}
            onComplete={handleProvision}
            />
        </div>
    );
}