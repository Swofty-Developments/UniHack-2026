"use client";

import {
  Accessibility,
  EyeOff,
  Activity,
  EarOff,
  Brain,
  HeartHandshake,
  Baby,
  type LucideIcon,
} from "lucide-react";
import { PROFILES, type AccessibilityProfile } from "~/lib/types";

const ICON_MAP: Record<string, LucideIcon> = {
  wheelchair: Accessibility,
  "eye-off": EyeOff,
  activity: Activity,
  "ear-off": EarOff,
  brain: Brain,
  "heart-handshake": HeartHandshake,
  baby: Baby,
};

interface ProfileSelectorProps {
  selectedProfiles: AccessibilityProfile[];
  onToggleProfile: (profile: AccessibilityProfile) => void;
}

export function ProfileSelector({
  selectedProfiles,
  onToggleProfile,
}: ProfileSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {PROFILES.map((profile) => {
        const Icon = ICON_MAP[profile.icon] ?? Accessibility;
        const isSelected = selectedProfiles.includes(profile.id);

        return (
          <button
            key={profile.id}
            onClick={() => onToggleProfile(profile.id)}
            title={profile.description}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-all ${
              isSelected
                ? "border-[rgba(0,221,179,0.3)] bg-[rgba(0,221,179,0.1)] text-[#00ddb3]"
                : "border-[rgba(255,255,255,0.06)] bg-[#0c1425] text-[#8892a7] hover:border-[rgba(255,255,255,0.12)] hover:text-[#f0f2f5]"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{profile.label}</span>
          </button>
        );
      })}
    </div>
  );
}
