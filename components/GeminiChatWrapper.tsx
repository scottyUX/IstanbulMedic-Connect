"use client";

import { useMemo, useRef } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotChatInternal } from "@copilotkit/react-core";
import GeminiInput, { type GeminiInputHandle } from "./GeminiInput";

const GeminiChatWrapper = () => {
  const { visibleMessages } = useCopilotChatInternal();
  const inputRef = useRef<GeminiInputHandle>(null);

  const showGreeting = useMemo(() => {
    return !visibleMessages || visibleMessages.length === 0;
  }, [visibleMessages]);

  const handleSuggestionClick = (text: string) => {
    if (inputRef.current) {
      inputRef.current.setValue(text);
      // Small delay to ensure value is set
      setTimeout(() => {
        inputRef.current?.submit();
      }, 10);
    }
  };

  return (
    <div className="gemini-chat-wrapper">
      <div className="copilotKitChat">
        {/* Greeting when no messages */}
        {showGreeting && (
          <div className="gemini-greeting">
            <div className="gemini-icon">
              <div className="gemini-icon-diamond"></div>
              <div className="gemini-icon-diamond"></div>
              <div className="gemini-icon-diamond"></div>
              <div className="gemini-icon-diamond"></div>
            </div>
            <h2>Hi Scott</h2>
            <h1>Where should we start?</h1>
          </div>
        )}

        {/* Chat component */}
        <div className="gemini-chat-container">
          <CopilotChat
            labels={{
              placeholder: "Enter a prompt for Gemini",
            }}
            className="gemini-chat"
            Input={(props) => <GeminiInput {...props} ref={inputRef} />}
          />
        </div>

        {/* Custom Suggestion buttons - Widget triggers */}
        {showGreeting && (
          <div className="gemini-suggestions">
            <button
              className="gemini-suggestion-button"
              onClick={() => handleSuggestionClick("What's the weather in San Francisco?")}
            >
              <svg
                className="gemini-suggestion-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.38l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
              </svg>
              Check the weather
            </button>
            <button
              className="gemini-suggestion-button"
              onClick={() => handleSuggestionClick("Open a calculator")}
            >
              <svg
                className="gemini-suggestion-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
              Open calculator
            </button>
            <button
              className="gemini-suggestion-button"
              onClick={() => handleSuggestionClick("Create a todo list")}
            >
              <svg
                className="gemini-suggestion-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              Create todo list
            </button>
            <button
              className="gemini-suggestion-button"
              onClick={() => handleSuggestionClick("Open a note pad")}
            >
              <svg
                className="gemini-suggestion-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z" />
              </svg>
              Open note pad
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiChatWrapper;
