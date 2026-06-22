/**
 * Error thrown when a guardrail blocks a tool action.
 *
 * `category` lets callers (and the LLM, via the tool result envelope) know
 * which guardrail fired without leaking the underlying input that tripped it.
 */
export class GuardrailError extends Error {
  category: string;

  constructor(category: string, message: string) {
    super(message);
    this.name = "GuardrailError";
    this.category = category;
  }
}
