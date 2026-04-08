import { CircleUser } from "lucide-react";
import Image from "next/image";

interface UserPhotoProps {
  src?: string | null;
}

export default function UserPhoto({ src }: UserPhotoProps) {
  return (
    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
      {src ? (
        <Image 
          src={src} 
          alt="User Avatar" 
          fill 
          className="object-cover" 
        />
      ) : (
        <CircleUser className="w-16 h-16 text-slate-300" />
      )}
    </div>
  );
}