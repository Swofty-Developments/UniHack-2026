"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadDropzone } from "~/components/ui/UploadDropzone";
import type { ScanData } from "~/lib/types";

export function UploadSection() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadComplete = (scan: ScanData) => {
    setIsUploading(false);
    setUploadProgress(0);
    router.push(`/scan/${scan.id}`);
  };

  return (
    <UploadDropzone
      onUploadComplete={handleUploadComplete}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
    />
  );
}
