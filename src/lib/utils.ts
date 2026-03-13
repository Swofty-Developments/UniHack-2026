export function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getSeverityColor(severity: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f97316";
    case "low":
      return "#eab308";
  }
}

export function getSeverityLabel(severity: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high":
      return "High Risk";
    case "medium":
      return "Medium Risk";
    case "low":
      return "Low Risk";
  }
}
