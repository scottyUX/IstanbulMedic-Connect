// lib/agents/langchain/agent.ts
import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { AgentState, LangchainMessage } from '@/types/langchain';
import { databaseLookupTool } from './tools/databaseLookup';
import { clinicSummaryTool } from './tools/clinicSummary';
import { doctorProfileTool } from './tools/doctorProfile';
import { clinicReviewsTool } from './tools/clinicReviews';
import { clinicPackagesTool } from './tools/clinicPackages';
import { clinicComparisonTool } from './tools/clinicComparison';
import { LEILA_SYSTEM_PROMPT, PROMPT_VERSION } from './prompts/leila-system-prompt';
import { checkInputGuardrails, checkOutputGuardrails } from './guardrails';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Langchain agent will be inert.');
}

// OpenAI Model Configuration
const MODEL_NAME = 'gpt-4o-mini'; // Can switch to 'gpt-4o' for better quality
const TEMPERATURE = 0.7; // Higher = more creative, Lower = more focused
const MAX_TOOL_ROUNDS = 5; // Safety limit for tool-calling loops

// ============================================================================
// AGENT PROMPT — sourced from versioned module
// ============================================================================

/** @deprecated Import directly from './prompts/leila-system-prompt' instead */
export const BASE_PROMPT = LEILA_SYSTEM_PROMPT;

export { PROMPT_VERSION };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converts our custom LangchainMessage type to LangChain's BaseMessage format
 */
function convertToLangChainMessages(messages: LangchainMessage[]) {
  return messages.map(msg => {
    switch (msg.role) {
      case 'user':
        return new HumanMessage({ content: msg.text });
      case 'assistant':
        return new AIMessage({ content: msg.text });
      case 'system':
        return new SystemMessage({ content: msg.text });
      default:
        return new HumanMessage({ content: msg.text });
    }
  });
}

// ============================================================================
// CARD-AWARENESS HELPERS
// ============================================================================

// Each helper returns a human-readable description of what the card shows,
// mirroring the exact fields rendered in the corresponding React component.

function describeClinicProfileCard(result: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = JSON.parse(result)?.summary as Record<string, any>;
    if (!s) return 'a ClinicProfileCard (no data)';
    const parts: string[] = [`name: "${s.display_name}"`];
    if (s.location) parts.push(`location: ${s.location.city}, ${s.location.country}`);
    if (s.score) parts.push(`trust score: ${s.score.overall_score} (Band ${s.score.band})`);
    if (s.short_description) parts.push(`description: "${s.short_description}"`);
    if (s.specialties?.length) parts.push(`specialties: ${s.specialties.slice(0, 5).map((sp: { service_name: string }) => sp.service_name).join(', ')}`);
    if (s.pricing?.length) {
      const priceStr = s.pricing.slice(0, 3).map((p: { service_name: string; price_min?: number; price_max?: number; currency?: string }) =>
        `${p.service_name}${p.price_min != null ? ` (${p.currency ?? '€'}${p.price_min}–${p.price_max})` : ''}`
      ).join(', ');
      parts.push(`pricing: ${priceStr}`);
    }
    if (s.team?.length) {
      const teamStr = s.team.slice(0, 3).map((t: { name?: string; role: string; credentials: string }) =>
        `${t.name ?? t.role} — ${t.credentials}`
      ).join('; ');
      parts.push(`team: ${teamStr}`);
    }
    if (s.review_count != null) parts.push(`reviews: ${s.review_count}`);
    if (s.years_in_operation != null) parts.push(`years in operation: ${s.years_in_operation}`);
    if (s.languages?.length) parts.push(`languages: ${s.languages.map((l: { language: string }) => l.language).join(', ')}`);
    if (s.media?.length) parts.push(`images: ${s.media.length} photo${s.media.length === 1 ? '' : 's'} shown`);
    return `a ClinicProfileCard showing — ${parts.join(' | ')}`;
  } catch {
    return 'a ClinicProfileCard';
  }
}

function describeReviewsCard(result: string): string {
  try {
    const { clinic, aggregate, reviews } = JSON.parse(result);
    return (
      `a ReviewsCard for "${clinic.display_name}" showing — ` +
      `average rating: ${aggregate.average_rating?.toFixed(1) ?? '—'} | ` +
      `total reviews: ${aggregate.total_count} | ` +
      `${reviews.length} review excerpts with star distribution`
    );
  } catch {
    return 'a ReviewsCard';
  }
}

function describePackagesCard(result: string): string {
  try {
    const { clinic, packages } = JSON.parse(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = packages.map((p: any) => p.package_name).join(', ');
    return `a PackagesCard for "${clinic.display_name}" showing ${packages.length} package(s): ${names}`;
  } catch {
    return 'a PackagesCard';
  }
}

function describeDoctorProfileCard(result: string): string {
  try {
    const { doctors } = JSON.parse(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = doctors.map((d: any) => `${d.name ?? d.role} (${d.credentials})`).join(', ');
    return `a DoctorProfileCard showing: ${names}`;
  } catch {
    return 'a DoctorProfileCard';
  }
}

function describeComparisonTable(result: string): string {
  try {
    const { clinics, comparison } = JSON.parse(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = clinics.map((c: any) => c.display_name).join(' vs ');
    const dims = Object.keys(comparison).join(', ');
    return `a ClinicComparisonTable comparing ${names} across: ${dims}`;
  } catch {
    return 'a ClinicComparisonTable';
  }
}

function describeDatabaseResultsCard(result: string): string {
  try {
    const { metadata } = JSON.parse(result);
    return `a DatabaseResultsCard showing ${metadata.count} result(s) from the "${metadata.table}" table`;
  } catch {
    return 'a DatabaseResultsCard';
  }
}

function describeCard(name: string, result: string): string {
  switch (name) {
    case 'clinic_summary':  return describeClinicProfileCard(result);
    case 'clinic_reviews':  return describeReviewsCard(result);
    case 'clinic_packages': return describePackagesCard(result);
    case 'doctor_profile':  return describeDoctorProfileCard(result);
    case 'clinic_comparison': return describeComparisonTable(result);
    case 'database_lookup': return describeDatabaseResultsCard(result);
    default: return `a ${name} card`;
  }
}

function buildCardAwarenessMessage(
  cards: Array<{ name: string; result: string }>
): string {
  const lines = cards.map(({ name, result }) => `- ${describeCard(name, result)}`).join('\n');
  return (
    `[Card context] You just displayed the following card(s) to the user:\n${lines}\n\n` +
    `The card shows all the details — no need to list every field. ` +
    `Respond in 1–2 sentences: (1) mention 1–2 key facts from the card inline ` +
    `(e.g. trust score, city, or top specialty — whichever is most relevant) so they land in conversation history, ` +
    `then (2) suggest one concrete next step (view packages, read reviews, compare clinics, or book a consultation).`
  );
}

// ============================================================================
// LANGCHAIN AGENT CLASS
// ============================================================================

export class LangchainAgent {
  state: AgentState;
  model: ChatOpenAI;
  tools: StructuredToolInterface[];

  constructor(initial?: Partial<AgentState>) {
    // Initialize state
    this.state = {
      conversationId: initial?.conversationId,
      messages: initial?.messages ?? [],
      lastUpdated: new Date().toISOString(),
      variables: initial?.variables ?? {},
    };

    // Initialize OpenAI model
    this.model = new ChatOpenAI({
      modelName: MODEL_NAME,
      temperature: TEMPERATURE,
      openAIApiKey: OPENAI_API_KEY,
    });

    // Register tools
    this.tools = [
      databaseLookupTool,
      clinicSummaryTool,
      doctorProfileTool,
      clinicReviewsTool,
      clinicPackagesTool,
      clinicComparisonTool,
    ];
  }

  /**
   * Execute a tool by name with given arguments
   */
  private async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const tool = this.tools.find((t) => t.name === name);
    if (!tool) {
      return JSON.stringify({ error: `Tool '${name}' not found` });
    }
    try {
      const result = await tool.invoke(args);
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Tool execution failed',
      });
    }
  }

  /**
   * Resolve tool calls in a loop until the model returns a text response.
   * Returns the final list of messages including all tool interactions.
   */
  private async resolveToolCalls(
    currentMessages: BaseMessage[]
  ): Promise<BaseMessage[]> {
    const modelWithTools = this.model.bindTools(this.tools);
    const messages = [...currentMessages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await modelWithTools.invoke(messages);
      messages.push(response);

      // No tool calls — model produced a final text response
      if (!response.tool_calls || response.tool_calls.length === 0) {
        return messages;
      }

      // Execute each tool call and add results
      for (const toolCall of response.tool_calls) {
        const result = await this.executeTool(toolCall.name, toolCall.args);
        messages.push(
          new ToolMessage({
            content: result,
            tool_call_id: toolCall.id ?? '',
          })
        );
      }
    }

    // Safety: if we hit the max rounds, do one final call without tools
    const finalResponse = await this.model.invoke(messages);
    messages.push(finalResponse);
    return messages;
  }

  /**
   * Handle a single message (non-streaming)
   * Use this for simple request/response interactions
   */
  async handleMessage(message: LangchainMessage): Promise<LangchainMessage> {
    // Add user message to state
    const userMessage: LangchainMessage = {
      ...message,
      createdAt: message.createdAt ?? new Date().toISOString(),
    };

    this.state.messages.push(userMessage);

    // --- Input guardrails ---
    const inputCheck = checkInputGuardrails(userMessage.text);
    if (!inputCheck.passed) {
      const guardedMessage: LangchainMessage = {
        role: 'assistant',
        text: inputCheck.safeResponse!,
        createdAt: new Date().toISOString(),
        metadata: { guardrail: inputCheck.violation },
      };
      this.state.messages.push(guardedMessage);
      this.state.lastUpdated = new Date().toISOString();
      return guardedMessage;
    }

    // Prepare messages: system prompt + conversation history
    const systemMessage = new SystemMessage(LEILA_SYSTEM_PROMPT);
    const conversationMessages = convertToLangChainMessages(this.state.messages);
    const allMessages: BaseMessage[] = [systemMessage, ...conversationMessages];

    // Resolve tool calls and get final response
    const resolvedMessages = await this.resolveToolCalls(allMessages);
    const lastMessage = resolvedMessages[resolvedMessages.length - 1];

    let responseText = lastMessage.content.toString();

    // --- Output guardrails ---
    const outputCheck = checkOutputGuardrails(responseText);
    if (!outputCheck.passed) {
      responseText = outputCheck.safeResponse!;
    }

    // Convert response to our format
    const assistantMessage: LangchainMessage = {
      role: 'assistant',
      text: responseText,
      createdAt: new Date().toISOString(),
      ...(outputCheck.violation && { metadata: { guardrail: outputCheck.violation } }),
    };

    // Update state
    this.state.messages.push(assistantMessage);
    this.state.lastUpdated = new Date().toISOString();

    return assistantMessage;
  }

  /**
   * Handle a message with streaming support
   * Use this for real-time response generation in the UI
   *
   * Strategy: resolve tool calls with non-streaming invoke(),
   * then stream the final text response for real-time token delivery.
   *
   * @param message - The user's message
   * @param onChunk - Callback that receives each token as it's generated
   * @param onToolCall - Callback that receives each completed tool call (id, name, args, result)
   */
  async handleMessageStream(
    message: LangchainMessage,
    onChunk?: (chunk: string) => void,
    onToolCall?: (call: {
      id: string;
      name: string;
      args: Record<string, unknown>;
      result: string;
    }) => void | Promise<void>
  ): Promise<LangchainMessage> {
    // Add user message to state
    const userMessage: LangchainMessage = {
      ...message,
      createdAt: message.createdAt ?? new Date().toISOString(),
    };

    this.state.messages.push(userMessage);

    // --- Input guardrails ---
    const inputCheck = checkInputGuardrails(userMessage.text);
    if (!inputCheck.passed) {
      const safeText = inputCheck.safeResponse!;
      onChunk?.(safeText);
      const guardedMessage: LangchainMessage = {
        role: 'assistant',
        text: safeText,
        createdAt: new Date().toISOString(),
        metadata: { guardrail: inputCheck.violation },
      };
      this.state.messages.push(guardedMessage);
      this.state.lastUpdated = new Date().toISOString();
      return guardedMessage;
    }

    // Prepare messages
    const systemMessage = new SystemMessage(LEILA_SYSTEM_PROMPT);
    const conversationMessages = convertToLangChainMessages(this.state.messages);
    const currentMessages: BaseMessage[] = [systemMessage, ...conversationMessages];

    // ---- Tool resolution loop (non-streaming) ----
    const modelWithTools = this.model.bindTools(this.tools);
    let toolsWereUsed = false;
    const renderedCards: Array<{ name: string; result: string }> = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await modelWithTools.invoke(currentMessages);

      // No tool calls — ready for final streaming response
      if (!response.tool_calls || response.tool_calls.length === 0) {
        break;
      }

      // Execute tool calls
      toolsWereUsed = true;
      currentMessages.push(response);

      for (const toolCall of response.tool_calls) {
        const result = await this.executeTool(toolCall.name, toolCall.args);
        currentMessages.push(
          new ToolMessage({
            content: result,
            tool_call_id: toolCall.id ?? '',
          })
        );
        renderedCards.push({ name: toolCall.name, result });
        if (onToolCall) {
          await onToolCall({
            id: toolCall.id ?? '',
            name: toolCall.name,
            args: toolCall.args ?? {},
            result,
          });
        }
      }
    }

    // Inject card-awareness context so the final response doesn't repeat what the card displays
    if (renderedCards.length > 0) {
      currentMessages.push(new SystemMessage(buildCardAwarenessMessage(renderedCards)));
    }

    // Conversational memory: prior turns are injected at the adapter layer (adapter.ts)
    // by initializing the agent with input.messages before this method is called.

    // ---- Final streaming response ----
    const streamingModel = new ChatOpenAI({
      modelName: MODEL_NAME,
      temperature: TEMPERATURE,
      openAIApiKey: OPENAI_API_KEY,
      streaming: true,
    });

    // If tools were used, stream without tools bound (final answer only)
    // If no tools were used, bind tools in case the model decides to use them
    // (unlikely since we already checked, but keeps behavior consistent)
    const finalModel = toolsWereUsed
      ? streamingModel
      : streamingModel.bindTools(this.tools);

    const stream = await finalModel.stream(currentMessages);

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.content.toString();
      if (content) {
        fullResponse += content;
        onChunk?.(content);
      }
    }

    // --- Output guardrails ---
    let finalText = fullResponse;
    const outputCheck = checkOutputGuardrails(fullResponse);
    if (!outputCheck.passed) {
      finalText = outputCheck.safeResponse!;
    }

    // Create assistant message with full response
    const assistantMessage: LangchainMessage = {
      role: 'assistant',
      text: finalText,
      createdAt: new Date().toISOString(),
      ...(outputCheck.violation && { metadata: { guardrail: outputCheck.violation } }),
    };

    // Update state
    this.state.messages.push(assistantMessage);
    this.state.lastUpdated = new Date().toISOString();

    return assistantMessage;
  }

  /**
   * Get current conversation state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Get all messages in the conversation
   */
  getMessages(): LangchainMessage[] {
    return [...this.state.messages];
  }

  /**
   * Clear conversation history (keep same conversation ID)
   */
  clearMessages(): void {
    this.state.messages = [];
    this.state.lastUpdated = new Date().toISOString();
  }

  /**
   * Reset the entire agent (new conversation)
   */
  reset(conversationId?: string): void {
    this.state = {
      conversationId: conversationId ?? this.state.conversationId,
      messages: [],
      lastUpdated: new Date().toISOString(),
      variables: {},
    };
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Create a new agent instance
 */
export function createAgent(conversationId?: string): LangchainAgent {
  return new LangchainAgent({ conversationId });
}
