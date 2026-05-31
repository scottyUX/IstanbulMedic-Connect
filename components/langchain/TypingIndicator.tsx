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
        <span className="leila-typing-dot" />
        <span className="leila-typing-dot" />
        <span className="leila-typing-dot" />
      </div>
    </div>
  );
};

export default TypingIndicator;
