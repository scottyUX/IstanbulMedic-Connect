"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useAuth } from "@/contexts/AuthContext";

/**
 * UserContextProvider exposes user profile data to CopilotKit agent
 * via useCopilotReadable hook. The agent automatically receives this
 * context with each message.
 */
const UserContextProvider = () => {
  const { user, profile, loading } = useAuth();

  // Expose user context to CopilotKit agent
  useCopilotReadable({
    description: "Current authenticated user information including profile data from Google OAuth",
    value: {
      userId: user?.id,
      email: user?.email,
      fullName: profile?.full_name,
      givenName: profile?.given_name,
      familyName: profile?.family_name,
      avatarUrl: profile?.avatar_url,
      createdAt: profile?.created_at,
      isAuthenticated: !!user,
    },
  });

  // This component doesn't render anything - it only exposes context
  return null;
};

export default UserContextProvider;
