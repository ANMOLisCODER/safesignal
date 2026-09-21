"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  Check,
  Copy,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";

type TrustedContact = {
  name: string;
  phone: string;
};

const STORAGE_KEY = "safesignal-trusted-contact";

export default function EmergencyPage() {
  const [contact, setContact] = useState<TrustedContact | null>(null);

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  const [locationLink, setLocationLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as TrustedContact;

        if (parsed.name && parsed.phone) {
          setContact(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function saveTrustedContact(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = contactName.trim();
    const phone = contactPhone.trim();

    if (!name || !phone) {
      return;
    }

    const newContact = {
      name,
      phone,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(newContact),
    );

    setContact(newContact);
    setContactName("");
    setContactPhone("");
    setShowContactForm(false);
    setErrorMessage("");
  }

  function editTrustedContact() {
    if (!contact) {
      return;
    }

    setContactName(contact.name);
    setContactPhone(contact.phone);
    setShowContactForm(true);
  }

  function removeTrustedContact() {
    localStorage.removeItem(STORAGE_KEY);

    setContact(null);
    setContactName("");
    setContactPhone("");
    setShowContactForm(false);
    setErrorMessage("");
  }

  function normalizeIndianPhone(phoneNumber: string) {
    const digits = phoneNumber.replace(/\D/g, "");

    if (digits.length === 10) {
      return `91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith("91")) {
      return digits;
    }

    return "";
  }

  async function shareLocation() {
    setLocationStatus("loading");
    setErrorMessage("");
    setCopied(false);

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setErrorMessage(
        "Location services are not supported by this browser.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;

        setLocationLink(link);
        setLocationStatus("ready");

        if (navigator.share) {
          try {
            await navigator.share({
              title: "My SafeSignal Location",
              text: "This is my current location.",
              url: link,
            });
          } catch {
            // User closed the share dialog.
          }
        }
      },
      (error) => {
        setLocationStatus("error");

        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage(
            "Location permission was denied. Please allow location access in your browser and try again.",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage(
            "Your current location could not be determined. Please try again.",
          );
        } else {
          setErrorMessage(
            "Location request timed out. Please try again.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }

  async function copyLocationLink() {
    if (!locationLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(locationLink);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setErrorMessage(
        "Could not copy the location link. Please use the share option instead.",
      );
    }
  }

  function callTrustedContact() {
    if (!contact) {
      return;
    }

    window.location.href = `tel:${contact.phone}`;
  }

  function messageTrustedContact() {
    if (!contact) {
      return;
    }

    const phone = normalizeIndianPhone(contact.phone);

    if (!phone) {
      setErrorMessage(
        "Please enter a valid Indian mobile number for your trusted contact.",
      );
      return;
    }

    const message = encodeURIComponent(
      "I may need help. Please contact me and check my location.",
    );

    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function sendEmergencyAlert() {
    if (!contact) {
      setErrorMessage(
        "Please add a trusted contact before sending an emergency alert.",
      );
      return;
    }

    const phone = normalizeIndianPhone(contact.phone);

    if (!phone) {
      setErrorMessage(
        "Please enter a valid Indian mobile number for your trusted contact.",
      );
      return;
    }

    setLocationStatus("loading");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setErrorMessage(
        "Location services are not supported by this browser.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;

        setLocationLink(link);
        setLocationStatus("ready");

        const message = encodeURIComponent(
          `🚨 I may need help.\n\nPlease contact me and check my location.\n\n📍 My current location:\n${link}`,
        );

        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

        window.open(
          whatsappUrl,
          "_blank",
          "noopener,noreferrer",
        );
      },
      (error) => {
        setLocationStatus("error");

        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage(
            "Location permission was denied. Please allow location access and try again.",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage(
            "Your current location could not be determined. Please try again.",
          );
        } else {
          setErrorMessage(
            "Location request timed out. Please try again.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to SafeSignal
        </Link>

        {/* Emergency card */}
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          {/* Hero */}
          <div className="border-b bg-destructive/5 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldAlert className="size-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-destructive">
                  Emergency Safety
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Need help right now?
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  If you are in immediate danger, prioritize getting
                  to a safer place and contacting emergency services
                  or someone you trust.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-6">
            {/* Call emergency services */}
            <div className="rounded-2xl border bg-background p-4 transition-colors hover:bg-accent/40 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Phone className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Call Emergency Services
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      If you are in immediate danger, contact the
                      appropriate emergency service.
                    </p>
                  </div>
                </div>

                <a
                  href="tel:112"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                >
                  <Phone className="size-4" />
                  Call 112
                </a>
              </div>
            </div>

            {/* Share location */}
            <div className="rounded-2xl border bg-background p-4 transition-colors hover:bg-accent/40 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <MapPin className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Share Your Location
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Generate a location link that you can share with
                      someone you trust.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={shareLocation}
                  disabled={locationStatus === "loading"}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MapPin className="size-4" />

                  {locationStatus === "loading"
                    ? "Getting location..."
                    : "Share location"}
                </button>
              </div>
            </div>

            {/* Trusted contact */}
            <div className="rounded-2xl border bg-background p-4 transition-colors hover:bg-accent/40 sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <UserRound className="size-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Contact Someone You Trust
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {contact
                          ? `${contact.name} is saved as your trusted contact.`
                          : "Add a trusted person for quick access during an emergency."}
                      </p>
                    </div>
                  </div>

                  {!showContactForm && (
                    <button
                      type="button"
                      onClick={() => {
                        if (contact) {
                          editTrustedContact();
                        } else {
                          setShowContactForm(true);
                        }
                      }}
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      {contact ? "Edit contact" : "Add contact"}
                    </button>
                  )}
                </div>

                {/* Add/edit form */}
                {showContactForm && (
                  <form
                    onSubmit={saveTrustedContact}
                    className="rounded-2xl border bg-muted/30 p-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="mb-2 block text-sm font-medium"
                        >
                          Contact name
                        </label>

                        <input
                          id="contact-name"
                          value={contactName}
                          onChange={(event) =>
                            setContactName(event.target.value)
                          }
                          placeholder="e.g. Mom"
                          required
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="mb-2 block text-sm font-medium"
                        >
                          Phone number
                        </label>

                        <input
                          id="contact-phone"
                          type="tel"
                          value={contactPhone}
                          onChange={(event) =>
                            setContactPhone(event.target.value)
                          }
                          placeholder="e.g. 9822683801"
                          required
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Check className="size-4" />
                        Save contact
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      This contact is stored only in this browser on this
                      device. SafeSignal does not send it to the server.
                    </p>
                  </form>
                )}

                {/* Saved contact */}
                {contact && !showContactForm && (
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{contact.name}</p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {contact.phone}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={callTrustedContact}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <Phone className="size-4" />
                            Call
                          </button>

                          <button
                            type="button"
                            onClick={messageTrustedContact}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-accent"
                          >
                            <MessageSquare className="size-4" />
                            Message
                          </button>

                          <button
                            type="button"
                            onClick={removeTrustedContact}
                            className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium text-destructive hover:bg-destructive/5"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* One-tap emergency alert */}
                      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">
                              One-tap emergency alert
                            </p>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Get your current location and prepare an
                              emergency WhatsApp message for {contact.name}.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={sendEmergencyAlert}
                            disabled={locationStatus === "loading"}
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <ShieldAlert className="size-4" />

                            {locationStatus === "loading"
                              ? "Getting location..."
                              : "Emergency Alert"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location result */}
          {locationStatus === "ready" && locationLink && (
            <div className="border-t bg-muted/30 p-5 sm:p-6">
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      Location link ready
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Your exact location is only being used on this
                      device to create the share link. SafeSignal does
                      not save it to the database.
                    </p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input
                        readOnly
                        value={locationLink}
                        className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-xs outline-none"
                      />

                      <button
                        type="button"
                        onClick={copyLocationLink}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        {copied ? (
                          <>
                            <Check className="size-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {locationStatus === "error" && (
            <div className="border-t bg-destructive/5 p-5 sm:p-6">
              <div className="rounded-2xl border border-destructive/20 bg-card p-4">
                <p className="text-sm font-medium text-destructive">
                  Emergency action unavailable
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Safety steps */}
        <section className="mt-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BellRing className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                If you feel unsafe
              </h2>

              <p className="text-sm text-muted-foreground">
                Consider these immediate steps.
              </p>
            </div>
          </div>

          <ol className="mt-5 space-y-3">
            {[
              "Move toward a populated, well-lit, or trusted place if possible.",
              "Contact emergency services if you are in immediate danger.",
              "Call or message someone you trust and tell them where you are.",
              "Avoid confronting the person if doing so could increase the risk.",
            ].map((step, index) => (
              <li
                key={step}
                className="flex gap-3 rounded-xl border bg-background p-4 text-sm leading-6"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </span>

                <span className="text-muted-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Disclaimer */}
        <div className="mt-6 rounded-2xl border bg-muted/40 p-4 text-center text-xs leading-5 text-muted-foreground">
          SafeSignal is a community safety platform and is not a
          replacement for emergency services.
        </div>
      </div>
    </main>
  );
}