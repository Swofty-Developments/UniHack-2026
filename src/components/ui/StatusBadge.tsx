interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  uploading: { bg: "bg-[rgba(0,221,179,0.12)]", text: "text-[#00ddb3]", label: "Uploading" },
  uploaded: { bg: "bg-[rgba(0,221,179,0.12)]", text: "text-[#00ddb3]", label: "Ready" },
  analyzing: { bg: "bg-[rgba(255,169,77,0.12)]", text: "text-[#ffa94d]", label: "Analyzing" },
  complete: { bg: "bg-[rgba(81,207,102,0.12)]", text: "text-[#51cf66]", label: "Complete" },
  error: { bg: "bg-[rgba(255,107,107,0.12)]", text: "text-[#ff6b6b]", label: "Error" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.uploaded!;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style!.bg} ${style!.text}`}
    >
      {style!.label}
    </span>
  );
}
