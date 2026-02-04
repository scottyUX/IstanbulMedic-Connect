"use client";

import { useState, useRef, useEffect } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import LeilaInput from "./LeilaInput";
import type { InputProps } from "@copilotkit/react-ui";

const LEILA_QUICK_SUGGESTIONS = [
  "Schedule a free consultation",
  "What is a hair transplant?",
  "How much does it cost?",
  "What is the recovery time?",
];

interface LeilaChatProps {
  onConversationStart?: () => void;
  initialPrompt?: string;
}

const LeilaChat = ({ onConversationStart, initialPrompt }: LeilaChatProps) => {
  const [showGreeting, setShowGreeting] = useState(true);
  const [hasConversationStarted, setHasConversationStarted] = useState(false);
  const [hasSentInitialPrompt, setHasSentInitialPrompt] = useState(false);
  const chatReadyRef = useRef<boolean | undefined>(undefined);
  const inputRef = useRef<{ setValue: (value: string) => void; submit: () => void } | null>(null);

  const handleConversationStart = () => {
    if (!hasConversationStarted) {
      setHasConversationStarted(true);
      setShowGreeting(false);
      onConversationStart?.();
    }
  };

  // Reset hasSentInitialPrompt when initialPrompt changes
  useEffect(() => {
    if (!initialPrompt) {
      setHasSentInitialPrompt(false);
    }
  }, [initialPrompt]);

  // Automatically send initial prompt when provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !hasSentInitialPrompt && inputRef.current) {
      setHasSentInitialPrompt(true);
      handleConversationStart();
      // Small delay to ensure chat is ready
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setValue(initialPrompt);
          setTimeout(() => {
            inputRef.current?.submit();
          }, 50);
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, hasSentInitialPrompt]);

  const handleSuggestionClick = (suggestion: string) => {
    handleConversationStart();
    // Wait for chat to be ready before submitting
    const attemptSubmit = (attempts = 0) => {
      if (attempts > 10) return; // Max 10 attempts (5 seconds)
      
      // Check if chat is ready (not explicitly false)
      if (chatReadyRef.current !== false && inputRef.current) {
        inputRef.current.setValue(suggestion);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.submit();
          }
        }, 100);
      } else {
        // Retry after 500ms if chat not ready
        setTimeout(() => attemptSubmit(attempts + 1), 500);
      }
    };
    
    // Start attempting after a short delay to allow chat to initialize
    setTimeout(() => attemptSubmit(), 200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex flex-col">
        {/* Greeting Screen */}
        {showGreeting && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#FAFAFA]">
            <div className="max-w-2xl w-full text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Hi, I&apos;m Leila — your private AI assistant. How can I help today?
              </h2>
              
              {/* Quick Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                {LEILA_QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-6 py-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-700 font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Component */}
        <div className="flex flex-col px-4 pt-4 pb-4 flex-1">
          <CopilotChat
            labels={{
              placeholder: "Ask me anything about your hair transplant...",
              initial: showGreeting ? undefined : "Hi, I'm Leila — your private AI assistant. How can I help today?",
            }}
            className="flex-1 min-h-[420px] rounded-2xl border border-gray-100 shadow-sm"
            suggestions={showGreeting ? LEILA_QUICK_SUGGESTIONS.map((s) => ({ title: s, message: s })) : []}
            Input={(props: InputProps) => {
              // Track chatReady state using ref
              chatReadyRef.current = props.chatReady;
              
              return (
                <LeilaInput
                  {...props}
                  ref={inputRef}
                  onSend={async (message) => {
                    handleConversationStart();
                    return props.onSend?.(message) ?? Promise.resolve();
                  }}
                />
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LeilaChat;
