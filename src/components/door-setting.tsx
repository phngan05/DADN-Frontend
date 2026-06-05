import { useDeviceControl } from "../hooks/useDeviceControl";
import DoorPasswordModal from "./door-password";
import ChangePasswordModal from "./change-password";
import FaceUnlockModal from "./face-unlock";
import { useEffect, useState } from "react";

interface DoorSettingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DoorSetting({
  isOpen,
  onClose,
}: DoorSettingProps){
    const {verifyPassword, updateStatus, updatePassword} = useDeviceControl();
  const [activeView, setActiveView] = useState<"password" | "change-password" | "face">("password");
  useEffect(() => {
    if (isOpen) {
      setActiveView("password");
    }
  }, [isOpen]);
    if(!isOpen) return null;
    const handleChangePassword = async (oldPassword: string, newPassword: string) => {
        const response = await verifyPassword(oldPassword);
        if(response){
            updatePassword(oldPassword, newPassword);
        setActiveView("password");
            alert("Change Password successfully!")
        }
        else{
            alert("Incorrect old password!");
        }

    };
    const handleOpenDoor = async (inputPassword: string) => {
      const response = await verifyPassword(inputPassword);
      console.log("Response: ", response)
      if(response){
        await updateStatus("servo", 1);
        alert("Open door successfully!");

      }
      else{
        alert("Incorrect password!");
      }
      onClose();
    };
    return (
        <div>
        {activeView === "password" && (
        <DoorPasswordModal 
        onClose={onClose} 
        onCompleted={handleOpenDoor}
        onChangePassword={() => setActiveView("change-password")}
        onFaceUnlock={() => setActiveView("face")}
        />
        )}
        {activeView === "change-password" && (
        <ChangePasswordModal 
        onClose={() => setActiveView("password")} 
        onCompleted={handleChangePassword}/>
        )}
        <FaceUnlockModal
        isOpen={activeView === "face"}
        onClose={onClose}
        onBack={() => setActiveView("password")}
        />
        </div>
    );
};