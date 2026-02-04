"use client";

import { useState, useMemo, useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { createA2UIMessageRenderer } from "@copilotkit/a2ui-renderer";
import LeilaHero from "@/components/leila/LeilaHero";
import LeilaNarrative from "@/components/leila/LeilaNarrative";
import LeilaChat from "@/components/leila/LeilaChat";
import LeilaGenUI from "@/components/leila/LeilaGenUI";
import UserContextProvider from "@/components/leila/UserContextProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

// A2UI theme for Leila
const leilaTheme = {
  primaryColor: "#2563eb", // Blue-600
  font: "Inter, system-ui, sans-serif",
} as any;

export default function LeilaPage() {
  const [showChat, setShowChat] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const { logout, user, profile, isAuthenticated, loading } = useAuth();

  // Auto-show chat when user is authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      setShowChat(true);
      setHeroCollapsed(true);
    } else if (!loading && !isAuthenticated) {
      // Reset to hero view when logged out
      setShowChat(false);
      setHeroCollapsed(false);
    }
  }, [isAuthenticated, user, loading]);

  // Console log user profile
  useEffect(() => {
    if (user) {
      console.log("=== Google User Profile ===");
      console.log("User ID:", user.id);
      console.log("Email:", user.email);
      console.log("Full User Object:", user);
      console.log("User Metadata:", user.user_metadata);
      console.log("App Metadata:", user.app_metadata);
      console.log("Is Authenticated:", isAuthenticated);
      console.log("===========================");
    } else {
      console.log("No user logged in");
    }
    
    if (profile) {
      console.log("=== Fetched User Profile (from API) ===");
      console.log("Profile:", profile);
      console.log("======================================");
    }
  }, [user, profile, isAuthenticated]);

  // Create A2UI renderer - must be stable (useMemo)
  const A2UIRenderer = useMemo(
    () => createA2UIMessageRenderer({ theme: leilaTheme }),
    []
  );

  // Memoize the renderActivityMessages array to prevent React warnings
  const renderActivityMessages = useMemo(() => [A2UIRenderer], [A2UIRenderer]);

  const handleStartConsultation = (question: string) => {
    // Only set initialPrompt if a question is provided
    // If empty, just open chat to show question buttons
    if (question.trim()) {
      setInitialPrompt(question);
    } else {
      setInitialPrompt(null);
    }
    setShowChat(true);
    setHeroCollapsed(true);
  };

  const handleConversationStart = () => {
    setHeroCollapsed(true);
  };

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-leila"
      renderActivityMessages={renderActivityMessages}
      showDevConsole={false}
    >
      {/* Render LeilaGenUI to register frontend tools - hidden but hooks must execute */}
      <div style={{ display: "none" }}>
        <LeilaGenUI />
        <UserContextProvider />
      </div>
      <main className="min-h-screen bg-[#FAFAFA]">
        {/* Logout button - top right */}
        {user && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              onClick={logout}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 shadow-sm"
            >
              Logout
            </Button>
          </div>
        )}
        {/* Show hero only when not authenticated */}
        {!loading && !isAuthenticated && (
          <>
            <LeilaHero
              onGetStarted={handleStartConsultation}
              pending={showChat && !heroCollapsed}
            />
            <LeilaNarrative />
          </>
        )}

        {/* Show chat when authenticated */}
        {!loading && isAuthenticated && (
          <div className="mt-0">
            <LeilaChat
              onConversationStart={handleConversationStart}
              initialPrompt={initialPrompt ?? undefined}
            />
          </div>
        )}
      </main>
    </CopilotKit>
  );
}
