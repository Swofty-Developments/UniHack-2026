"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileUp, Loader2 } from "lucide-react";
import type { ScanData } from "~/lib/types";

interface UploadDropzoneProps {
  onUploadComplete: (scan: ScanData) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function UploadDropzone({
  onUploadComplete,
  isUploading,
  uploadProgress,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".gltf") && !file.name.endsWith(".glb")) {
        setError("Please upload a .gltf or .glb file.");
        return;
      }

      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        onUploadComplete(data.scan);
      } catch {
        setError("Upload failed. Please try again.");
      }
    },
    [onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
        isDragOver
          ? "border-[#00ddb3] bg-[rgba(0,221,179,0.04)]"
          : "border-[rgba(255,255,255,0.08)] bg-[#0c1425] hover:border-[rgba(255,255,255,0.16)]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".gltf,.glb"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#00ddb3]" />
          <p className="text-[#f0f2f5]">Uploading... {uploadProgress}%</p>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-[#131d35]">
            <div
              className="h-full rounded-full bg-[#00ddb3] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {isDragOver ? (
            <FileUp className="h-10 w-10 text-[#00ddb3]" />
          ) : (
            <Upload className="h-10 w-10 text-[#515c72]" />
          )}
          <div>
            <p className="text-lg font-medium text-[#f0f2f5]">
              Drop your 3D scan here
            </p>
            <p className="mt-1 text-sm text-[#515c72]">
              Supports .gltf and .glb files from Polycam
            </p>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-[#ff6b6b]">{error}</p>}
    </div>
  );
}
