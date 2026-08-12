import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "purple" | "blue" | "neon" | "green";
};

const tones = {
  purple: "bg-primary/10 text-primary ring-primary/15",
  blue: "bg-electric/10 text-electric ring-electric/15",
  neon: "bg-neon/10 text-neon ring-neon/15",
  green: "bg-success/10 text-success ring-success/15",
} as const;

export function StatCard({ label, value, hint, icon: Icon, tone = "purple" }: StatCardProps) {
  return (
    <div className="glass-card glass-hover relative overflow-hidden p-5">
      <div
        className={cn(
          "absolute -top-16 -right-16 size-40 rounded-full blur-3xl",
          tone === "purple" && "bg-primary/15",
          tone === "blue" && "bg-electric/15",
          tone === "neon" && "bg-neon/15",
          tone === "green" && "bg-success/15",
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-display mt-2 text-3xl font-semibold text-foreground">{value}</p>
          {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
            tones[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}
