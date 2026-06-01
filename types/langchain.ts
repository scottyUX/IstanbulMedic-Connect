// types/langchain.ts
import type { Message } from "@ag-ui/core";
import type { ReactElement } from "react";

export type Role = 'user' | 'assistant' | 'system' | 'tool';

/** CopilotKit augments ag-ui Message objects at runtime with generative-UI helpers. */
export type CopilotKitMessage = Message & {
  generativeUI?: () => ReactElement | false | null;
  generativeUIPosition?: "before" | "after";
};

export interface LangchainMessage {
  id?: string;
  role: Role;
  text: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentState {
  conversationId?: string;
  messages: LangchainMessage[];
  lastUpdated?: string;
  variables?: Record<string, unknown>;
}

export interface DatabaseLookupInput {
  query: string;
  table?: 'clinics' | 'users' | 'consultations' | string;
  filters?: Record<string, unknown>;
}

export interface DatabaseLookupResult {
  results: Record<string, unknown>[];
  metadata?: {
    table?: string;
    count?: number;
    tookMs?: number;
  };
  error?: string | null;
}