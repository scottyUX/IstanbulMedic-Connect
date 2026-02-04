"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { createA2UIMessageRenderer } from "@copilotkit/a2ui-renderer";
import StaticGenUI from "@/components/StaticGenUI";
import GeminiChatWrapper from "@/components/GeminiChatWrapper";

// A2UI theme for UI generation
const a2uiTheme = {
  primaryColor: "#6366f1",
  font: "Inter, system-ui, sans-serif",
};

// Create A2UI renderer for generating UI components
const A2UIRenderer = createA2UIMessageRenderer({ theme: a2uiTheme });

export default function Home() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      renderActivityMessages={[A2UIRenderer]}
      showDevConsole={false}
    >
      {/* Render StaticGenUI to register frontend tools - hidden but hooks must execute */}
      <div style={{ display: "none" }}>
        <StaticGenUI />
      </div>
      <div className="min-h-screen bg-[#f7f8fc]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Chat Interface - Gemini Style */}
          <div className="rounded-lg bg-white shadow-sm">
            <GeminiChatWrapper />
          </div>
        </div>
      </div>
    </CopilotKit>
  );
}
