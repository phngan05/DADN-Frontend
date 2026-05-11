import { useDeviceControl } from "../hooks/useDeviceControl";
import DoorPasswordModal from "./door-password";
import ChangePasswordModal from "./change-password";
import { useState } from "react";
import {notify} from '@/src/utils/notify';

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
            notify.success("Change Password successfully!");
        }
        else{
            notify.error("Incorrect old password!");
        }

    };
    const handleOpenDoor = async (inputPassword: string) => {
      const response = await verifyPassword(inputPassword);
      if(response){
        await updateStatus("servo", 1);
        notify.success("Open door successfully!");

      }
      else{
        notify.error("Incorrect password!");
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