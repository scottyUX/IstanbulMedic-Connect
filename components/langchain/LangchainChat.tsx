"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCopilotChatInternal } from "@copilotkit/react-core";
import type { Message } from "@ag-ui/core";
import type { CopilotKitMessage } from "@/types/langchain";
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

function isCopilotBridge(r: unknown): boolean {
  if (!r || typeof r !== "object") return false;
  const t = (r as { type?: { name?: string; displayName?: string } }).type;
  return (
    t?.name === "CoAgentStateRenderBridge" ||
    t?.displayName === "CoAgentStateRenderBridge"
  );
}

const LangchainChat = () => {
  const { messages, sendMessage, isLoading } = useCopilotChatInternal();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const [inputBarHeight, setInputBarHeight] = useState(96);
  const [awaitingAssistant, setAwaitingAssistant] = useState(false);

  const filteredMessages = (messages as Message[]).filter((m) => {
    if (m.id?.startsWith("coagent-state-render-")) return false;
    if (!VISIBLE_ROLES.has(m.role)) return false;
    if (m.role === "assistant") {
      const hasText =
        typeof m.content === "string" && m.content.trim().length > 0;
      const genUIResult = (m as CopilotKitMessage).generativeUI?.();
      const hasRealGenUI =
        genUIResult != null && genUIResult !== false && !isCopilotBridge(genUIResult);
      return hasText || hasRealGenUI;
    }
    return true;
  });

  // Swap adjacent text-only / genUI-only assistant pairs so the card renders above the text.
  // The text message is created first by the adapter (TEXT_MESSAGE_START fires before tool calls),
  // so without this it would appear above the card even though the card arrived visually first.
  const hasRealGenUI = (m: Message) => {
    const r = (m as CopilotKitMessage).generativeUI?.();
    if (r == null || r === false) return false;
    return !isCopilotBridge(r);
  };
  const orderedMessages = [...filteredMessages];
  for (let i = 0; i < orderedMessages.length - 1; i++) {
    const curr = orderedMessages[i];
    const next = orderedMessages[i + 1];
    if (curr.role !== "assistant" || next.role !== "assistant") continue;
    const currHasText = typeof curr.content === "string" && curr.content.trim().length > 0;
    const nextHasText = typeof next.content === "string" && next.content.trim().length > 0;
    if (currHasText && !hasRealGenUI(curr) && hasRealGenUI(next) && !nextHasText) {
      orderedMessages[i] = next;
      orderedMessages[i + 1] = curr;
    }
  }

  const lastVisibleMessage = orderedMessages[orderedMessages.length - 1];
  const showTypingIndicator = awaitingAssistant || isLoading;
  // Excludes isLoading: CopilotKit briefly sets isLoading=true on init, which used to
  // flash the conversation UI before settling. awaitingAssistant is only ever set by
  // user action, so it correctly gates the greeting without the init-flash.
  const showGreeting = filteredMessages.length === 0 && !awaitingAssistant;

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

  // Auto-scroll to bottom on new messages / loading state, unless user scrolled up.
  // rAF defers until after browser layout so scrollHeight is correct even when the
  // greeting UI unmounts and the first message mounts in the same render cycle.
  useEffect(() => {
    if (userScrolledUpRef.current) return;
    const frame = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isLoading]);

  // Reset scroll flag when conversation is cleared
  useEffect(() => {
    if (filteredMessages.length === 0) {
      userScrolledUpRef.current = false;
    }
  }, [filteredMessages.length]);

  useEffect(() => {
    if (lastVisibleMessage?.role === "assistant") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAwaitingAssistant(false);
    }
  }, [lastVisibleMessage]);

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
      setAwaitingAssistant(true);
      try {
        await (sendMessage as unknown as (msg: Message) => Promise<void>)({
          id: crypto.randomUUID(),
          role: "user" as const,
          content: text,
        });
      } catch (error) {
        setAwaitingAssistant(false);
        throw error;
      }
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
            {orderedMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {showTypingIndicator && <TypingIndicator />}
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
