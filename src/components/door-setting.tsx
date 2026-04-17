import { useDeviceControl } from "../hooks/useDeviceControl";
import DoorPasswordModal from "./door-password";
import ChangePasswordModal from "./change-password";
import { useState } from "react";

interface DoorSettingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DoorSetting({
  isOpen,
  onClose,
}: DoorSettingProps){
    const {verifyPassword, updateStatus, updatePassword} = useDeviceControl();
    const [isDoorOpen, setIsDoorOpen] = useState<boolean>(true);
    if(!isOpen) return null;
    const handleChangePassword = async (oldPassword: string, newPassword: string) => {
        const response = await verifyPassword(oldPassword);
        if(response){
            updatePassword(oldPassword, newPassword);
            setIsDoorOpen(true);
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
      }
      else{
        alert("Incorrect password!");
      }
      onClose();
    };
    return (
        <div>
        {isDoorOpen? 
        <DoorPasswordModal 
        onClose={onClose} 
        onCompleted={handleOpenDoor}
        onChangePassword={() => setIsDoorOpen(false)}/> 
        : 
        <ChangePasswordModal 
        onClose={() => setIsDoorOpen(true)} 
        onCompleted={handleChangePassword}/>}
        </div>
    );
};