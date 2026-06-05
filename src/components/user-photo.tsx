import { CircleUser } from "lucide-react";
import Image from "next/image";

interface UserPhotoProps {
  src?: string | null;
}

export default function UserPhoto({ src }: UserPhotoProps) {
  const isLocalSrc = Boolean(
    src && (src.startsWith("http://127.0.0.1:8000/") || src.startsWith("http://localhost:8000/"))
  );

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
      {src ? (
        isLocalSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="User Avatar" className="h-full w-full object-cover" />
        ) : (
          <Image 
            src={src} 
            alt="User Avatar" 
            fill 
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )
      ) : (
        <CircleUser className="w-16 h-16 text-slate-300" />
      )}
    </div>
  );
}