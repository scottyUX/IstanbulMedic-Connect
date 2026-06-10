"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useAuth } from "@/contexts/AuthContext";

const UserContextProvider = () => {
  const { user, profile } = useAuth();

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

  return null;
};

export default UserContextProvider;
