import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "gradient-brand inline-flex size-10 items-center justify-center rounded-xl shadow-[var(--shadow-glow)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.6" opacity="0.9" />
        <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.4" opacity="0.7" />
        <circle cx="12" cy="12" r="1.4" fill="white" />
        <path d="M17.5 6.5 L20.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
