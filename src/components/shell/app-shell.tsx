import {
  Bell,
  Bot,
  ChevronRight,
  FileWarning,
  Home,
  Map,
  Menu,
  Settings,
  ShieldCheck,
  Siren,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  {
    label: "Dashboard",
    href: "#",
    icon: Home,
  },
  {
    label: "Report Safety Issue",
    href: "#",
    icon: FileWarning,
  },
  {
    label: "Live Safety Map",
    href: "#",
    icon: Map,
  },
  {
    label: "Safety Trends",
    href: "#",
    icon: TrendingUp,
  },
  {
    label: "Alerts",
    href: "#",
    icon: Bell,
  },
];

const secondaryNavigation = [
  {
    label: "AI Safety Assistant",
    href: "#",
    icon: Bot,
  },
  {
    label: "Settings",
    href: "#",
    icon: Settings,
  },
];

function NavigationItems() {
  return (
    <nav className="space-y-1">
      {navigation.map((item, index) => {
        const Icon = item.icon;
        const active = index === 0;

        return (
          <a
            key={item.label}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function SecondaryNavigation() {
  return (
    <nav className="space-y-1">
      {secondaryNavigation.map((item) => {
        const Icon = item.icon;

        return (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-18 items-center gap-3 px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="size-5" />
        </div>

        <div>
          <p className="text-sm font-bold tracking-tight">SafeSignal</p>
          <p className="text-[11px] text-muted-foreground">
            Community safety network
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Monitor
          </p>
          <NavigationItems />
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            More
          </p>
          <SecondaryNavigation />
        </div>
      </div>

      <div className="border-t p-3">
        <div className="rounded-xl bg-muted/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium">Safety network active</span>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Anonymous reports help identify emerging safety patterns.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <Sheet>
  <SheetTrigger
    className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    aria-label="Open navigation"
  >
    <Menu className="size-5" />
  </SheetTrigger>

  <SheetContent side="left" className="w-72 p-0">
    <SidebarContent />
  </SheetContent>
</Sheet>

          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <span className="font-bold tracking-tight">SafeSignal</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto min-h-[calc(100svh-4rem)] max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}