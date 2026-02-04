"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { createA2UIMessageRenderer } from "@copilotkit/a2ui-renderer";

// Simple A2UI theme
const a2uiTheme = {
  primaryColor: "#9B8AFF",
  font: "Plus Jakarta Sans",
};

// Create A2UI renderer
const A2UIRenderer = createA2UIMessageRenderer({ theme: a2uiTheme });

interface A2UIPageProps {
  children: React.ReactNode;
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
        labels={{ modalHeaderTitle: "A2UI Assistant" }}
      />
    </CopilotKit>
  );
};

export default A2UIPage;
