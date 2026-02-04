"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import type { InputProps } from "@copilotkit/react-ui";
import { Send, Paperclip } from "lucide-react";

export interface LeilaInputHandle {
  setValue: (value: string) => void;
  submit: () => void;
}

const LeilaInput = forwardRef<LeilaInputHandle, InputProps>(
  ({ inProgress, onSend, chatReady, onStop, onUpload, hideStopButton }, ref) => {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async () => {
      if (!value.trim() || inProgress) return;
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
      <div className="leila-input-wrapper">
        <div className="leila-input-container">
          {/* Attachment button */}
          {onUpload && (
            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    onUpload(file);
                  }
                };
                input.click();
              }}
              className="leila-input-attach"
              disabled={inProgress || chatReady === false}
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your hair transplant..."
            disabled={inProgress || chatReady === false}
            className="leila-input"
            rows={1}
            style={{ pointerEvents: "auto" }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim() || inProgress || chatReady === false}
            className="leila-input-send"
            aria-label="Send message"
          >
            {inProgress ? (
              <div className="leila-spinner" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

LeilaInput.displayName = "LeilaInput";

export default LeilaInput;
