"use client";

import {
  Accessibility,
  Building2,
  Check,
  CircleDot,
  Construction,
  Droplets,
  ImageIcon,
  Lightbulb,
  type LucideIcon,
  Trash2,
  TriangleAlert,
  Waves,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { CATEGORY, type Category, FLOW, type Issue, STATUS_LABEL, type Status } from "./data";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  road_damage: TriangleAlert,
  blocked_footpath: Construction,
  garbage: Trash2,
  streetlight: Lightbulb,
  electrical_hazard: Zap,
  water_leak: Droplets,
  drainage: Waves,
  accessibility: Accessibility,
  building_damage: Building2,
  other: CircleDot,
};

const STATUS_CLASS: Record<Status, string> = {
  open: "bg-sunken text-ink-2 ring-line",
  assigned: "bg-violet-50 text-violet-800 ring-violet-200",
  in_progress: "bg-blue-50 text-blue-800 ring-blue-200",
  fixed: "bg-accent-50 text-amber-800 ring-amber-200",
  resolved: "bg-brand-50 text-brand-700 ring-brand-100",
  closed_unconfirmed: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CatChip({ category }: { category: Category }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-2">
      <Icon size={13} aria-hidden />
      {CATEGORY[category].label}
    </span>
  );
}

/** A photo, or a tinted placeholder standing in for one. */
export function Photo({ src, category, label, className = "" }: { src: string | null; category: Category; label?: string; className?: string }) {
  if (src && src !== "placeholder")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label ?? ""} className={`object-cover ${className}`} />;
  const Icon = CATEGORY_ICON[category];
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 text-stone-500 ${className}`} aria-label={label}>
      <Icon size={28} aria-hidden />
      {label && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">{label}</span>}
    </div>
  );
}

/** Opens the camera on phones, the file picker elsewhere. */
export function PhotoPicker({ onPick, children, className }: { onPick: (url: string) => void; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(URL.createObjectURL(f));
        }}
      />
    </>
  );
}

export function SamplePhotoButton({ onPick }: { onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand underline-offset-2 hover:underline">
      <ImageIcon size={13} /> Use a sample photo
    </button>
  );
}

export function Stepper({ status }: { status: Status }) {
  const idx = status === "closed_unconfirmed" ? 4 : FLOW.indexOf(status);
  return (
    <ol className="flex items-center gap-1" aria-label={`Status: ${STATUS_LABEL[status]}`}>
      {FLOW.map((s, i) => (
        <li key={s} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              i < idx ? "bg-brand text-white" : i === idx ? "bg-ink text-white" : "bg-sunken text-muted"
            }`}
          >
            {i < idx ? <Check size={11} strokeWidth={3} /> : i + 1}
          </span>
          <span className={`truncate text-[10px] font-semibold ${i <= idx ? "text-ink" : "text-muted"}`}>{STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function Timeline({ issue }: { issue: Issue }) {
  return (
    <ol className="space-y-2 border-l-2 border-line pl-3">
      {[...issue.timeline].reverse().map((t, i) => (
        <li key={i} className="text-xs">
          <span className="font-semibold text-muted">{t.at}</span>
          <div className="text-ink-2">{t.text}</div>
        </li>
      ))}
    </ol>
  );
}

export function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-[2000] flex justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        className="flex max-w-md items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-left text-sm font-semibold text-white shadow-float"
      >
        <Check size={16} className="shrink-0 text-accent" /> {text}
      </button>
    </div>
  );
}
