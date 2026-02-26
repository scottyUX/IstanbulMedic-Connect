// types/langchain.ts
export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface LangchainMessage {
  id?: string;
  role: Role;
  text: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface AgentState {
  conversationId?: string;
  messages: LangchainMessage[];
  lastUpdated?: string;
  variables?: Record<string, any>;
}

export interface DatabaseLookupInput {
  query: string;
  table?: 'clinics' | 'users' | 'consultations' | string;
  filters?: Record<string, any>;
}

export interface DatabaseLookupResult {
  results: Record<string, any>[];
  metadata?: {
    table?: string;
    count?: number;
    tookMs?: number;
  };
  error?: string | null;
}