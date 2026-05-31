import { Observable } from "rxjs";
import { AbstractAgent } from "@ag-ui/client";
import {
  EventType,
  type BaseEvent,
  type RunAgentInput,
  type RunStartedEvent,
  type RunFinishedEvent,
  type RunErrorEvent,
  type TextMessageStartEvent,
  type TextMessageContentEvent,
  type TextMessageEndEvent,
  type ToolCallStartEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type ToolCallResultEvent,
} from "@ag-ui/core";
import { LangchainAgent } from "./agent";
import type { LangchainMessage } from "@/types/langchain";

/**
 * AbstractAgent adapter that bridges CopilotKit's ag-ui runtime to the
 * server-side LangchainAgent. A fresh LangchainAgent is built per run() call
 * so requests never share state.
 *
 * Event sequence:
 *   RUN_STARTED
 *   (TOOL_CALL_START / ARGS / END / RESULT)*        — when tools fire
 *   (TEXT_MESSAGE_START → TEXT_MESSAGE_CONTENT* → TEXT_MESSAGE_END)?
 *   RUN_FINISHED
 *
 * On error:
 *   ... whatever was already emitted ...
 *   TEXT_MESSAGE_END (only if a message had been opened)
 *   RUN_ERROR
 *
 * The response text is buffered until handleMessageStream resolves so that
 * the streaming path runs through the agent's output guardrails before any
 * delta reaches the client.
 */
export class LangchainAgentAdapter extends AbstractAgent {
  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const { threadId, runId } = input;
      const messageId = `msg-${runId}`;
      let textMessageOpen = false;

      const emitTextMessageEnd = () => {
        if (!textMessageOpen) return;
        const end = {
          type: EventType.TEXT_MESSAGE_END,
          messageId,
        } satisfies TextMessageEndEvent;
        subscriber.next(end);
        textMessageOpen = false;
      };

      (async () => {
        // RUN_STARTED
        const started = {
          type: EventType.RUN_STARTED,
          threadId,
          runId,
        } satisfies RunStartedEvent;
        subscriber.next(started);

        // Build a fresh LangchainAgent per run — do not share state across requests.
        const agent = new LangchainAgent({ conversationId: threadId });

        // Pull the latest user message; fall back to "" if absent (the agent
        // will handle the empty input via its guardrails).
        const latestUser = [...input.messages].reverse().find(
          (m): m is typeof m & { role: "user"; content: unknown } =>
            m.role === "user",
        );
        const userText =
          typeof latestUser?.content === "string"
            ? latestUser.content
            : Array.isArray(latestUser?.content)
              ? latestUser.content
                  .filter((part): part is { type: "text"; text: string } => part.type === "text")
                  .map((part) => part.text)
                  .join("")
              : "";

        const userMessage: LangchainMessage = {
          role: "user",
          text: userText,
        };

        // Open the assistant message immediately so tool call events are
        // emitted inside an active message context — CopilotKit needs this
        // to associate genUI renders with the correct message.
        const start = {
          type: EventType.TEXT_MESSAGE_START,
          messageId,
          role: "assistant" as const,
        } satisfies TextMessageStartEvent;
        subscriber.next(start);
        textMessageOpen = true;

        // Buffer text chunks; emit them as a single TEXT_MESSAGE_CONTENT after
        // the agent finishes (so output guardrails run before tokens leave the
        // server). Empty chunks are dropped.
        const buffered: string[] = [];
        const onChunk = (chunk: string) => {
          if (chunk && chunk.length > 0) {
            buffered.push(chunk);
          }
        };

        const onToolCall = (call: {
          id: string;
          name: string;
          args: Record<string, unknown>;
          result: string;
        }) => {
          const toolStart = {
            type: EventType.TOOL_CALL_START,
            toolCallId: call.id,
            toolCallName: call.name,
          } satisfies ToolCallStartEvent;
          subscriber.next(toolStart);

          const toolArgs = {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: call.id,
            delta: JSON.stringify(call.args ?? {}),
          } satisfies ToolCallArgsEvent;
          subscriber.next(toolArgs);

          const toolEnd = {
            type: EventType.TOOL_CALL_END,
            toolCallId: call.id,
          } satisfies ToolCallEndEvent;
          subscriber.next(toolEnd);

          const toolResult = {
            type: EventType.TOOL_CALL_RESULT,
            messageId: `${messageId}-tool-${call.id}`,
            toolCallId: call.id,
            content: call.result,
            role: "tool" as const,
          } satisfies ToolCallResultEvent;
          subscriber.next(toolResult);
        };

        try {
          const finalMessage = await agent.handleMessageStream(
            userMessage,
            onChunk,
            onToolCall,
          );

          // Prefer the agent's final, guardrail-checked text; if missing,
          // fall back to whatever was buffered from the stream.
          const finalText = finalMessage.text || buffered.join("");

          if (finalText.length > 0) {
            const content = {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: finalText,
            } satisfies TextMessageContentEvent;
            subscriber.next(content);

            emitTextMessageEnd();
          }

          const finished = {
            type: EventType.RUN_FINISHED,
            threadId,
            runId,
          } satisfies RunFinishedEvent;
          subscriber.next(finished);
          subscriber.complete();
        } catch (err) {
          // If we had partially emitted a text message before the error
          // (chunks were buffered but the agent threw before completing),
          // open and close that message so the client sees a clean envelope.
          if (buffered.length > 0 && !textMessageOpen) {
            const partialStart = {
              type: EventType.TEXT_MESSAGE_START,
              messageId,
              role: "assistant" as const,
            } satisfies TextMessageStartEvent;
            subscriber.next(partialStart);
            textMessageOpen = true;

            const partialContent = {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: buffered.join(""),
            } satisfies TextMessageContentEvent;
            subscriber.next(partialContent);
          }
          emitTextMessageEnd();

          const errorEvent = {
            type: EventType.RUN_ERROR,
            message: err instanceof Error ? err.message : String(err),
          } satisfies RunErrorEvent;
          subscriber.next(errorEvent);
          subscriber.complete();
        }
      })();
    });
  }
}
