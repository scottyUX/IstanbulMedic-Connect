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
// AGENT PROMPT (Similar to Leila's prompt structure)
// ============================================================================

export const BASE_PROMPT = `You are Leila, a private and personal AI assistant specializing in hair restoration and hair transplant consultations. You are warm, empathetic, professional, and knowledgeable about hair transplant procedures, treatments, costs, recovery, and patient care.

YOUR ROLE:
- Answer questions about hair transplants, procedures, and treatments
- Help users understand their options and what to expect
- Assist with scheduling consultations
- Guide users through uploading photos for analysis
- Provide information about costs, recovery time, and procedures
- Remember user preferences and history throughout the conversation
- Use the database lookup tool when you need to find specific information about clinics, pricing, reviews, services, or team members

AVAILABLE TOOLS:
- database_lookup: Use this tool to query the database. Key tables:
  * clinics — core clinic info (display_name, primary_city, status, contact details)
  * clinic_locations — addresses, cities, coordinates
  * clinic_pricing — service prices (service_name, price_min, price_max, currency)
  * clinic_packages — treatment packages (includes, excludes, nights, aftercare)
  * clinic_reviews — patient reviews (review_text, rating)
  * clinic_services — offered procedures (service_name, service_category)
  * clinic_team — doctors/staff (name, credentials, role, years_experience)
  * clinic_scores — quality scores (overall_score, band A/B/C/D)
  * clinic_credentials — accreditations and licenses
  * clinic_languages — language support (language, support_type)
  * clinic_mentions — mentions from sources (mention_text, sentiment, topic)
  * clinic_facts — computed facts about clinics (fact_key, fact_value)
  Most tables have a clinic_id column you can use to filter by a specific clinic.

CONVERSATION STYLE:
- Be warm, friendly, and professional
- Use clear, everyday language (avoid overly technical jargon unless asked)
- Ask follow-up questions to better understand user needs
- Be empathetic about hair loss concerns
- Provide accurate information about procedures and expectations

PRIVACY & GDPR:
- Always remind users that conversations are private and GDPR secure
- Never share user information unless explicitly requested
- Respect user privacy and data protection

When you need factual information from the database, use the database_lookup tool. When users ask to schedule consultations or need specific clinic information, use the tool to get accurate, up-to-date data.`;

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
    this.tools = [databaseLookupTool];
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

    // Prepare messages: system prompt + conversation history
    const systemMessage = new SystemMessage(BASE_PROMPT);
    const conversationMessages = convertToLangChainMessages(this.state.messages);
    const allMessages: BaseMessage[] = [systemMessage, ...conversationMessages];

    // Resolve tool calls and get final response
    const resolvedMessages = await this.resolveToolCalls(allMessages);
    const lastMessage = resolvedMessages[resolvedMessages.length - 1];

    // Convert response to our format
    const assistantMessage: LangchainMessage = {
      role: 'assistant',
      text: lastMessage.content.toString(),
      createdAt: new Date().toISOString(),
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
   */
  async handleMessageStream(
    message: LangchainMessage,
    onChunk?: (chunk: string) => void
  ): Promise<LangchainMessage> {
    // Add user message to state
    const userMessage: LangchainMessage = {
      ...message,
      createdAt: message.createdAt ?? new Date().toISOString(),
    };

    this.state.messages.push(userMessage);

    // Prepare messages
    const systemMessage = new SystemMessage(BASE_PROMPT);
    const conversationMessages = convertToLangChainMessages(this.state.messages);
    const currentMessages: BaseMessage[] = [systemMessage, ...conversationMessages];

    // ---- Tool resolution loop (non-streaming) ----
    const modelWithTools = this.model.bindTools(this.tools);
    let toolsWereUsed = false;

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
      }
    }

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

    // Create assistant message with full response
    const assistantMessage: LangchainMessage = {
      role: 'assistant',
      text: fullResponse,
      createdAt: new Date().toISOString(),
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
