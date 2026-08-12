import { cn } from "@/lib/utils";

/** Subtle DJ ambience: equalizer bars, sound waves and vinyl rings. Decorative only. */
export function DjBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-primary/12 blur-[110px]" />
      <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-electric/12 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-neon/8 blur-[120px]" />

      <svg
        className="absolute inset-x-0 top-24 h-64 w-full opacity-[0.09]"
        viewBox="0 0 1440 240"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 140 C 180 40, 320 240, 500 140 S 820 40, 1000 140 S 1300 240, 1440 120"
          stroke="var(--primary)"
          strokeWidth="2"
        />
        <path
          d="M0 172 C 200 90, 340 260, 520 172 S 860 80, 1040 172 S 1320 260, 1440 160"
          stroke="var(--electric)"
          strokeWidth="2"
        />
      </svg>

      <svg
        className="absolute -right-24 bottom-[-120px] h-[420px] w-[420px] opacity-[0.06]"
        viewBox="0 0 200 200"
        fill="none"
      >
        {[92, 74, 56, 38, 20].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} stroke="var(--primary)" strokeWidth="1.5" />
        ))}
        <circle cx="100" cy="100" r="8" fill="var(--electric)" />
      </svg>

      <div className="absolute bottom-0 left-0 flex h-24 w-full items-end gap-[6px] px-6 opacity-[0.07]">
        {Array.from({ length: 64 }).map((_, i) => (
          <span
            key={i}
            className="eq-bar w-full rounded-t-full bg-primary"
            style={{
              height: `${18 + ((i * 37) % 70)}%`,
              animationDelay: `${(i % 12) * 0.12}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
