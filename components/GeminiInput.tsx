"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import type { InputProps } from "@copilotkit/react-ui";

export interface GeminiInputHandle {
  setValue: (value: string) => void;
  submit: () => void;
}

const GeminiInput = forwardRef<GeminiInputHandle, InputProps>(({
  inProgress,
  onSend,
  chatReady,
  onStop,
  onUpload,
  hideStopButton,
}, ref) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!value.trim() || inProgress) return;
    // Only check chatReady if it's explicitly false, not undefined
    if (chatReady === false) return;
    const message = value.trim();
    setValue("");
    await onSend(message);
  };

  useImperativeHandle(ref, () => ({
    setValue: (newValue: string) => {
      setValue(newValue);
    },
    submit: () => {
      handleSubmit();
    },
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="gemini-input-wrapper">
      <div className="gemini-input-icons">
        {/* Lock icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        {/* Plus icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a prompt for Gemini"
        disabled={inProgress || chatReady === false}
        className="copilotKitInput gemini-input"
        rows={1}
        autoFocus
        style={{ pointerEvents: "auto" }}
      />
      <div className="gemini-input-right-icons">
        {/* Dropdown icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        {/* Microphone icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </div>
    </div>
  );
});

GeminiInput.displayName = "GeminiInput";

export default GeminiInput;
