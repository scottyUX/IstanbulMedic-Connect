"use client";

const MCPAppsGenUI = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Open-ended Generative UI (MCP Apps)</h2>
      <p className="text-gray-600">
        The agent returns full UI surfaces (HTML, iframes, or embedded
        applications). The frontend acts as a container.
      </p>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> MCP Apps require an MCP server to be running.
          This pattern allows agents to embed external applications and tools
          directly into the interface.
        </p>
        <p className="mt-2 text-sm text-yellow-800">
          To enable MCP Apps, configure the MCPAppsMiddleware in your API route
          and connect to an MCP server.
        </p>
      </div>
    </div>
  );
};

export default MCPAppsGenUI;
