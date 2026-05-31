"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCopilotChatInternal } from "@copilotkit/react-core";
import type { Message } from "@ag-ui/core";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import LangchainInput from "./LangchainInput";

const QUICK_SUGGESTIONS = [
  "Schedule a free consultation",
  "What is a hair transplant?",
  "How much does it cost?",
  "What is the recovery time?",
];

const VISIBLE_ROLES = new Set(["user", "assistant"]);

const LangchainChat = () => {
  const { messages, sendMessage, isLoading } = useCopilotChatInternal();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const [inputBarHeight, setInputBarHeight] = useState(96);

  const filteredMessages = (messages as Message[]).filter((m) => {
    if (!VISIBLE_ROLES.has(m.role)) return false;
    if (m.role === "assistant") {
      return typeof m.content === "string" && m.content.trim().length > 0;
    }
    return true;
  });

  const showGreeting = filteredMessages.length === 0;

  // Detect manual scroll-up so auto-scroll doesn't fight the user
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll to bottom on new messages / loading state, unless user scrolled up
  useEffect(() => {
    if (userScrolledUpRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Reset scroll-up flag when conversation starts fresh
  useEffect(() => {
    if (showGreeting) userScrolledUpRef.current = false;
  }, [showGreeting]);

  // Keep the bottom reserve space aligned with the fixed composer height.
  useEffect(() => {
    const el = inputBarRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateHeight = () => {
      setInputBarHeight(el.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      userScrolledUpRef.current = false;
      await (sendMessage as any)({
        id: crypto.randomUUID(),
        role: "user" as const,
        content: text,
      });
    },
    [isLoading, sendMessage],
  );

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white overflow-hidden">
      {showGreeting ? (
        /* ── Greeting ── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#FAFAFA]">
          <div className="max-w-2xl w-full text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">
              Hi, I&apos;m Leila &mdash; your private AI assistant. How can I
              help today?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={isLoading}
                  className="px-6 py-3 text-left bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#102544] hover:shadow-md hover:-translate-y-0.5 transition-all text-gray-700 font-medium disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Message thread ── */
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 pt-6"
          style={{ paddingBottom: inputBarHeight + 16 }}
        >
          <div className="max-w-2xl mx-auto">
            {filteredMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* ── Fixed input bar ── */}
      <div
        ref={inputBarRef}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-10"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-2xl mx-auto">
          <LangchainInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default LangchainChat;
