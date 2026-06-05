"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import {notify} from '@/src/utils/notify';


interface ImageUploadButtonProps {
  onUploadSuccess: (url: string) => void;
}

export default function ImageUploadButton({ onUploadSuccess }: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        onUploadSuccess(data.data.url);
      } else {
        notify.error("Upload failed: " + data.error.message);
      }
    } catch (error) {
      notify.error("An error occurred while uploading.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />

      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-1 right-1 button-primary p-1.5 rounded-lg shadow-lg disabled:opacity-70 flex items-center justify-center"
      >
        {isUploading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Camera size={12} />
        )}
      </button>
    </>
  );
}