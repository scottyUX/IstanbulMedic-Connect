"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface LangchainInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function LangchainInput({ onSend, isLoading }: LangchainInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    const message = value.trim();
    setValue("");
    onSend(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="langchain-input-wrapper">
      <div className="langchain-input-container">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your hair transplant..."
          disabled={isLoading}
          className="langchain-input"
          rows={1}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="langchain-input-send"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="langchain-spinner" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
