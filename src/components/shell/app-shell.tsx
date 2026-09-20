"use client";

import Link from "next/link";
import {
  Bell,
  Home,
  Map,
  Menu,
  Shield,
} from "lucide-react";

import { SafetyAssistant } from "@/components/assistant/safety-assistant";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
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
    href: "/report",
    label: "Report",
    icon: Bell,
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
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="size-5" />
            </div>

            <span className="text-sm font-semibold tracking-tight">
              SafeSignal
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              },
            )}
          </nav>

          <div className="md:hidden">
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
                <Menu className="size-5" />
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[280px]"
              >
                <div className="mt-8 flex flex-col gap-2">
                  {navigation.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      );
                    },
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {children}

      <SafetyAssistant />
    </div>
  );
}