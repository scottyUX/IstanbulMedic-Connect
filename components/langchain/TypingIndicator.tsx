"use client";

const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-[#102544] flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white">
        L
      </div>
      <div
        className="bg-[#F5F4F2] px-4 py-3 flex items-center gap-1"
        style={{ borderRadius: "18px 18px 18px 4px" }}
      >
        <div className="langchain-thinking-dots flex items-center gap-1" aria-label="Assistant is typing">
          <span
            className="inline-block h-2 w-2 rounded-full bg-[#9CA3AF] animate-pulse"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-[#9CA3AF] animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-[#9CA3AF] animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
