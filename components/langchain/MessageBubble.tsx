"use client";

import ReactMarkdown from "react-markdown";
import type { Message } from "@ag-ui/core";
import type { CopilotKitMessage } from "@/types/langchain";

function isCopilotBridge(r: unknown): boolean {
  if (!r || typeof r !== "object") return false;
  const t = (r as { type?: { name?: string; displayName?: string } }).type;
  return (
    t?.name === "CoAgentStateRenderBridge" ||
    t?.displayName === "CoAgentStateRenderBridge"
  );
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const ckMsg = message as CopilotKitMessage;
  const rawGenUI = ckMsg.generativeUI?.();
  const genUI = isCopilotBridge(rawGenUI) ? null : rawGenUI;
  const genUIPosition: "before" | "after" = ckMsg.generativeUIPosition ?? "after";
  const content = typeof message.content === "string" ? message.content : "";

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="bg-[#102544] text-white px-4 py-3 max-w-[80%] text-[15px] leading-relaxed"
          style={{ borderRadius: "18px 18px 4px 18px" }}
        >
          {content}
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    const hasText = content.trim().length > 0;
    const hasGenUI = genUI != null && genUI !== false;

    if (!hasText && !hasGenUI) return null;

    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[#102544] flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white mt-0.5">
          L
        </div>
        <div className="flex flex-col gap-2 max-w-[80%]">
          {hasGenUI && genUIPosition === "before" && <div>{genUI}</div>}
          {hasText && (
            <div
              className="bg-[#F5F4F2] text-gray-900 px-4 py-3 text-[15px] leading-relaxed"
              style={{ borderRadius: "18px 18px 18px 4px" }}
            >
              <div className="leila-markdown">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          )}
          {hasGenUI && genUIPosition !== "before" && <div>{genUI}</div>}
        </div>
      </div>
    );
  }

  return null;
};

export default MessageBubble;
