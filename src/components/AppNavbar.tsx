import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FilePlus2 } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { DJ_PROFILE } from "@/lib/bills";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/create", label: "Create Bill", icon: FilePlus2 },
] as const;

export function AppNavbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="hidden leading-tight sm:block">
            <span className="font-display block text-[15px] font-semibold">
              {DJ_PROFILE.djName}
            </span>
            <span className="block text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Billing Book
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right leading-tight lg:block">
            <span className="block text-sm font-medium">{DJ_PROFILE.ownerName}</span>
            <span className="block text-xs text-muted-foreground">Owner</span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition hover:ring-primary/40"
                aria-label="Owner profile"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="gradient-brand text-sm font-semibold text-primary-foreground">
                    SG
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="leading-tight">
                {DJ_PROFILE.ownerName}
                <span className="block text-xs font-normal text-muted-foreground">
                  {DJ_PROFILE.mobile}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/create" search={{}}>
                  <FilePlus2 className="size-4" /> New bill
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
