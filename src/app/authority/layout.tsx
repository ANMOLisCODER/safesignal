"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const AUTH_KEY = "safesignal-authority-auth";

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/authority/login") {
      setIsChecking(false);
      return;
    }

    const authenticated =
      sessionStorage.getItem(AUTH_KEY) === "true";

    if (!authenticated) {
      router.replace("/authority/login");
      return;
    }

    setIsChecking(false);
  }, [pathname, router]);

  useEffect(() => {
    function clearAuthoritySession() {
      sessionStorage.removeItem(AUTH_KEY);
    }

    window.addEventListener(
      "pagehide",
      clearAuthoritySession,
    );

    return () => {
      window.removeEventListener(
        "pagehide",
        clearAuthoritySession,
      );
    };
  }, []);

  if (isChecking) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">
          Checking authority access...
        </div>
      </main>
    );
  }

  return children;
}