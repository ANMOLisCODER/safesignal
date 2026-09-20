"use client";

import {
  Bot,
  MessageCircle,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const initialMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm SafeSignal AI. I can help you understand safety signals, report a concern, or think through practical steps if you feel unsafe.",
};

export function SafetyAssistant() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([
      initialMessage,
    ]);

  const [isSending, setIsSending] =
    useState(false);

  async function sendMessage() {
    const trimmed =
      message.trim();

    if (
      !trimmed ||
      isSending
    ) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setMessage("");
    setIsSending(true);

    try {
      const response =
        await fetch(
          "/api/assistant",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: trimmed,
            }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            "Unable to get a response.",
        );
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.response,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "Assistant message failed:",
        error,
      );

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I couldn't process that right now. If you are in immediate danger, contact the appropriate local emergency service.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-3xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  SafeSignal AI
                </p>

                <p className="text-xs text-muted-foreground">
                  Safety assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsOpen(false)
              }
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[55vh] min-h-72 space-y-3 overflow-y-auto p-4">
            {messages.map(
              (item) => (
                <div
                  key={item.id}
                  className={
                    item.role ===
                    "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      item.role ===
                      "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground"
                        : "max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-5"
                    }
                  >
                    {item.content}
                  </div>
                </div>
              ),
            )}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />

              <p className="text-[11px] leading-4 text-muted-foreground">
                SafeSignal AI provides safety
                guidance and is not an emergency
                service.
              </p>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value.slice(
                      0,
                      1000,
                    ),
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Ask about safety..."
                rows={2}
                disabled={isSending}
                className="min-h-11 flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() =>
                  void sendMessage()
                }
                disabled={
                  !message.trim() ||
                  isSending
                }
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          setIsOpen((current) =>
            !current,
          )
        }
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"
        aria-label={
          isOpen
            ? "Close SafeSignal AI"
            : "Open SafeSignal AI"
        }
      >
        {isOpen ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </button>
    </>
  );
}