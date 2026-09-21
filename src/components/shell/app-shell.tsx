"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FileWarning,
  Home,
  Map,
  Menu,
  Newspaper,
  Route,
  Shield,
  Siren,
} from "lucide-react";

import { SafetyAssistant } from "@/components/assistant/safety-assistant";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AppShellProps = {
  children: React.ReactNode;
};

const navigation = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/safety-map",
    label: "Safety Map",
    icon: Map,
  },
  {
    href: "/safe-route",
    label: "Safe Route",
    icon: Route,
  },
  {
    href: "/news",
    label: "News",
    icon: Newspaper,
  },
  {
    href: "/report",
    label: "Report",
    icon: FileWarning,
  },
  {
    href: "/emergency",
    label: "Emergency",
    icon: Siren,
  },
  {
    href: "/authority",
    label: "Authority",
    icon: Shield,
  },
];

export function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur transition-[background-color,box-shadow] duration-300">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* LOGO */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <Shield className="size-5 transition-transform duration-200 group-hover:rotate-3" />
            </div>

            <span className="text-sm font-semibold tracking-tight transition-opacity duration-200 group-hover:opacity-75">
              SafeSignal
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`group inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-200 ease-out xl:px-3 xl:text-sm ${
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:-translate-y-px hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`size-4 shrink-0 transition-transform duration-200 ${
                      active
                        ? "scale-105"
                        : "group-hover:scale-105"
                    }`}
                  />

                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* TABLET / MOBILE MENU */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    aria-label="Open navigation"
                  />
                }
              >
                <Menu className="size-5 transition-transform duration-200" />
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[300px]"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Shield className="size-4" />
                    </div>

                    SafeSignal
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex flex-col gap-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={
                          active ? "page" : undefined
                        }
                        className={`group flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:translate-x-1 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon
                          className={`size-4 transition-transform duration-200 ${
                            active
                              ? "scale-105"
                              : "group-hover:scale-105"
                          }`}
                        />

                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 border-t pt-5">
                  <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                    <Bell className="mt-0.5 size-4 text-muted-foreground" />

                    <div>
                      <p className="text-sm font-medium">
                        Safety Assistant
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Ask the floating AI assistant for safety guidance.
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div
        key={pathname}
        className="safesignal-page-enter"
      >
        {children}
      </div>

      <SafetyAssistant />
    </div>
  );
}