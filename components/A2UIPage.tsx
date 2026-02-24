"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { createA2UIMessageRenderer } from "@copilotkit/a2ui-renderer";
import type { ReactNode } from "react";

import { a2uiViewerTheme } from "@/lib/a2ui/viewer-theme";

// Create A2UI renderer
const A2UIRenderer = createA2UIMessageRenderer({ theme: a2uiViewerTheme });

interface A2UIPageProps {
  children: ReactNode;
}

const A2UIPage = ({ children }: A2UIPageProps) => {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-a2ui"
      renderActivityMessages={[A2UIRenderer]}
      showDevConsole={false}
    >
      {children}
      <CopilotSidebar
        defaultOpen
        labels={{ title: "A2UI Assistant" }}
      />
    </CopilotKit>
  );
};

export default A2UIPage;
