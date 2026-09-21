"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "safesignal-authority-auth";

export default function AuthorityLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password.",
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "Unable to sign in.",
        );
      }

      sessionStorage.setItem(
        AUTH_KEY,
        "true",
      );

      router.replace("/authority");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="safesignal-card-enter rounded-3xl border bg-card p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldAlert className="size-5" />
            </div>

            <div>
              <p className="text-sm font-medium text-primary">
                SafeSignal Authority
              </p>

              <h1 className="text-xl font-semibold tracking-tight">
                Authority Login
              </h1>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in to access the SafeSignal safety
              intelligence dashboard.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="authority@safesignal.local"
                autoComplete="username"
                disabled={isLoading}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter authority password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading
                ? "Signing in..."
                : "Sign in"}

              {!isLoading && (
                <ArrowRight className="size-4" />
              )}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-muted/50 px-3 py-2.5">
            <p className="text-center text-[11px] leading-4 text-muted-foreground">
              Authority access only. Public SafeSignal
              features do not require login.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}