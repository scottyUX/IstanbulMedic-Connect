"use client";

const DeclarativeGenUI = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Declarative Generative UI (A2UI)</h2>
      <p className="text-gray-600">
        The agent returns structured UI specifications (JSON) that the frontend
        renders. Try asking: &quot;Create a contact form&quot; or
        &quot;Show me a card with product information&quot;
      </p>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This pattern uses A2UI renderer. The agent
          will generate JSON specifications that describe UI components like
          forms, cards, and buttons.
        </p>
      </div>
    </div>
  );
};

export default DeclarativeGenUI;
