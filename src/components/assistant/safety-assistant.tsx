"use client";

import {
  Bot,
  MessageCircle,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AssistantApiResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

const initialMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm SafeSignal AI. I can help you understand safety signals, report a concern, or think through practical steps if you feel unsafe.",
};

export function SafetyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    initialMessage,
  ]);

  const [isSending, setIsSending] = useState(false);

  async function sendMessage() {
    const trimmed = message.trim();

    if (!trimmed || isSending) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);

    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
        }),
      });

      const result =
        (await response.json()) as AssistantApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "Unable to get a response.",
        );
      }

      if (!result.message) {
        throw new Error(
          "The assistant returned an empty response.",
        );
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.message,
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
      {/* AI Chat Panel */}
      <div
        className={`fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-3xl border bg-background shadow-2xl transition-all duration-300 ease-out ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
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
            onClick={() => setIsOpen(false)}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
            aria-label="Close assistant"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="max-h-[55vh] min-h-72 space-y-3 overflow-y-auto p-4">
          {messages.map((item) => (
            <div
              key={item.id}
              className={
                item.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={
                  item.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-5 text-primary-foreground"
                    : "max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-6"
                }
              >
                {item.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-p:first:mt-0 prose-p:last:mb-0 prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-semibold prose-headings:first:mt-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:font-semibold">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {item.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  item.content
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span>Thinking</span>
                  <span className="animate-pulse">
                    .
                  </span>
                  <span className="animate-pulse [animation-delay:200ms]">
                    .
                  </span>
                  <span className="animate-pulse [animation-delay:400ms]">
                    .
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer + Input */}
        <div className="border-t p-3">
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />

            <p className="text-[11px] leading-4 text-muted-foreground">
              SafeSignal AI provides safety guidance and is
              not an emergency service.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value.slice(0, 1000),
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask about safety..."
              rows={2}
              disabled={isSending}
              className="min-h-11 flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!message.trim() || isSending}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating AI Button */}
      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        className={`fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
          isOpen
            ? "rotate-90"
            : "rotate-0"
        }`}
        aria-label={
          isOpen
            ? "Close SafeSignal AI"
            : "Open SafeSignal AI"
        }
      >
        <span className="transition-transform duration-300">
          {isOpen ? (
            <X className="size-6" />
          ) : (
            <MessageCircle className="size-6" />
          )}
        </span>
      </button>
    </>
  );
}