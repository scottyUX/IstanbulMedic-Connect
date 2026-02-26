"use client";

import { useState, useRef, useEffect } from "react";
import type { LangchainMessage } from "@/types/langchain";
import LangchainInput from "./LangchainInput";

const QUICK_SUGGESTIONS = [
  "Schedule a free consultation",
  "What is a hair transplant?",
  "How much does it cost?",
  "What is the recovery time?",
];

export default function LangchainChat() {
  const [messages, setMessages] = useState<LangchainMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showGreeting, setShowGreeting] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  // Detect when the user manually scrolls away from the bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100;
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [showGreeting]);

  // Auto-scroll the container only — never the page
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || userScrolledUpRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, streamingText]);

  const sendMessage = async (text: string) => {
    const userMessage: LangchainMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setStreamingText("");
    setShowGreeting(false);
    userScrolledUpRef.current = false;

    try {
      const response = await fetch("/api/langchain-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingText(fullText);
      }

      const assistantMessage: LangchainMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: fullText,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingText("");
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: LangchainMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Sorry, something went wrong. Please try again.",
        createdAt: new Date().toISOString(),
        metadata: { error: true },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex flex-col">
        {/* Greeting Screen */}
        {showGreeting && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#FAFAFA]">
            <div className="max-w-2xl w-full text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Hi, I&apos;m Leila &mdash; your private AI assistant. How can I
                help today?
              </h2>

              {/* Quick Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="px-6 py-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-700 font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        {!showGreeting && (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto w-full space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      msg.role === "user"
                        ? "bg-[#1a73e8] text-white rounded-[18px_18px_4px_18px] px-4 py-3 max-w-[80%]"
                        : `bg-[#f1f3f4] text-[#202124] rounded-[18px_18px_18px_4px] px-4 py-3 max-w-[80%]${
                            msg.metadata?.error ? " border border-red-200" : ""
                          }`
                    }
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {/* Streaming response */}
              {isLoading && streamingText && (
                <div className="flex justify-start">
                  <div className="bg-[#f1f3f4] text-[#202124] rounded-[18px_18px_18px_4px] px-4 py-3 max-w-[80%]">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {streamingText}
                      <span className="inline-block w-[2px] h-[1em] bg-[#202124] ml-0.5 align-middle animate-pulse" />
                    </p>
                  </div>
                </div>
              )}

              {/* Thinking indicator */}
              {isLoading && !streamingText && (
                <div className="flex justify-start">
                  <div className="bg-[#f1f3f4] text-[#202124] rounded-[18px_18px_18px_4px] px-4 py-3">
                    <div className="langchain-thinking-dots flex gap-1">
                      <span className="w-2 h-2 bg-[#5f6368] rounded-full" />
                      <span className="w-2 h-2 bg-[#5f6368] rounded-full" />
                      <span className="w-2 h-2 bg-[#5f6368] rounded-full" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <LangchainInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
