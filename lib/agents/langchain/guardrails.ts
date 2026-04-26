// lib/agents/langchain/guardrails.ts
//
// Runtime guardrails for the Leila AI assistant.
// These complement the system-prompt guardrails with programmatic checks
// that run BEFORE the user message reaches the LLM (input guardrails)
// and AFTER the LLM responds (output guardrails).

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuardrailResult {
  /** Whether the message passed the guardrail check */
  passed: boolean;
  /** Which guardrail was triggered (null if passed) */
  violation: GuardrailViolation | null;
  /** A safe response to return instead of calling the LLM */
  safeResponse: string | null;
}

export type GuardrailViolation =
  | 'medical_advice'
  | 'out_of_domain'
  | 'ranking_request'
  | 'fabrication_risk';

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate the user is requesting personal medical advice.
 * These look for direct "should I", "is it safe for me", "do I need", etc.
 */
const MEDICAL_ADVICE_PATTERNS: RegExp[] = [
  /\bis\s+(this|that|the)\s+(surgery|procedure|operation|treatment|transplant)\s+safe\s+for\s+me\b/i,
  /\bshould\s+i\s+(get|have|do|undergo|take|try|consider)\b/i,
  /\bdo\s+i\s+need\s+(a|an|the)?\s*(surgery|procedure|operation|treatment|transplant|medication)\b/i,
  /\bam\s+i\s+a?\s*(good|suitable|right|ideal)\s+candidate\b/i,
  /\bcan\s+you\s+(diagnose|prescribe|recommend\s+a\s+treatment\s+for)\b/i,
  /\bwhat\s+(medication|drug|medicine)\s+should\s+i\s+(take|use)\b/i,
  /\bis\s+(it|this)\s+safe\s+(for\s+me|if\s+i)\b/i,
  /\bwill\s+(i|this)\s+(be\s+ok|be\s+fine|work\s+for\s+me|suit\s+me)\b/i,
  /\bprescribe\s+(me|something)\b/i,
  /\bgive\s+me\s+a\s+diagnosis\b/i,
];

/**
 * Patterns that indicate a request for subjective rankings or "best" claims.
 */
const RANKING_PATTERNS: RegExp[] = [
  /\b(which|what)\s+(clinic|doctor|surgeon|hospital)\s+(is|has)\s+(the\s+)?(best|top|number\s+one|#\s*1|finest|greatest|leading)\b/i,
  /\bbest\s+(clinic|doctor|surgeon|hospital)\b/i,
  /\btop\s+(rated|ranked)?\s*(clinic|doctor|surgeon|hospital)\b/i,
  /\bwho\s+is\s+the\s+(best|top|number\s+one)\s+(surgeon|doctor)\b/i,
  /\brank\s+(the\s+)?(clinics|doctors|surgeons)\b/i,
  /\bwhich\s+(clinic|surgeon|doctor)\s+do\s+you\s+recommend\b/i,
];

/**
 * Topics that are clearly outside Leila's domain.
 * We check these to redirect the user back to hair restoration.
 */
const OUT_OF_DOMAIN_PATTERNS: RegExp[] = [
  /\b(stocks?|stock\s+market|bitcoin|crypto\s*currency|forex|trading\s+platform)\b/i,
  /\b(lawsuit|lawyer|attorney|legal\s+advice|sue)\b/i,
  /\b(recipe|cook|baking|ingredient)\b/i,
  /\b(weather|forecast|temperature)\s+(in|for|today)\b/i,
  /\b(write\s+me\s+(a|an)\s+(poem|essay|story|song|code))\b/i,
  /\b(homework|math\s+problem|solve\s+this\s+equation)\b/i,
  /\b(relationship\s+advice|dating\s+tips)\b/i,
  /\b(breast|liposuction|rhinoplasty|botox|facelift|tummy\s+tuck)\b/i,
];

// ---------------------------------------------------------------------------
// Safe responses
// ---------------------------------------------------------------------------

const SAFE_RESPONSES: Record<GuardrailViolation, string> = {
  medical_advice:
    "That's an important question that requires a personalised medical evaluation. " +
    "I'm not able to provide medical advice or tell you whether a specific procedure is right for you. " +
    "I'd recommend consulting with a qualified hair transplant surgeon who can assess your individual situation. " +
    'Would you like me to help you schedule a consultation?',

  ranking_request:
    "I'm not able to declare any clinic or surgeon as \"the best\" — that really depends on your individual needs and preferences. " +
    'What I can do is show you factual data like clinic scores, patient reviews, credentials, and pricing so you can compare and decide for yourself. ' +
    'Would you like me to look up that information for you?',

  out_of_domain:
    "That's outside my area of expertise — I specialise in hair restoration and transplant consultations. " +
    'Is there anything related to hair restoration I can help you with?',

  fabrication_risk:
    "I don't have that specific information in my database right now, " +
    "so I'd rather not guess. Let me help you find it another way or connect you with a clinic directly. " +
    'Would you like me to try a different search?',
};

// ---------------------------------------------------------------------------
// Input guardrails (run before LLM call)
// ---------------------------------------------------------------------------

/**
 * Check a user message against all input guardrails.
 * Returns immediately on the first violation found.
 */
export function checkInputGuardrails(userMessage: string): GuardrailResult {
  const text = userMessage.trim();

  // 1. Medical advice check
  if (matchesAnyPattern(text, MEDICAL_ADVICE_PATTERNS)) {
    return violation('medical_advice');
  }

  // 2. Ranking / "best" claims check
  if (matchesAnyPattern(text, RANKING_PATTERNS)) {
    return violation('ranking_request');
  }

  // 3. Out-of-domain check
  if (matchesAnyPattern(text, OUT_OF_DOMAIN_PATTERNS)) {
    return violation('out_of_domain');
  }

  return { passed: true, violation: null, safeResponse: null };
}

// ---------------------------------------------------------------------------
// Output guardrails (run after LLM response)
// ---------------------------------------------------------------------------

/**
 * Patterns in LLM output that indicate the model may have broken a guardrail.
 * These catch cases where the system prompt guardrails weren't enough.
 */
const OUTPUT_MEDICAL_ADVICE_PATTERNS: RegExp[] = [
  /\byou\s+should\s+(get|have|undergo|take|try)\s+(a\s+|an\s+)?(fue|fut|dhi|prp|hair\s+transplant|minoxidil|finasteride)\b/i,
  /\bi\s+recommend\s+(you|that\s+you)\s+(get|have|undergo|take|try)\b/i,
  /\byou\s+are\s+(a|an)\s+(good|great|ideal|perfect|suitable)\s+candidate\b/i,
  /\bthis\s+(procedure|surgery|treatment)\s+is\s+safe\s+for\s+you\b/i,
  /\byou\s+(need|require)\s+(a\s+|an\s+)?(fue|fut|dhi|surgery|hair\s+transplant|transplant|medication)\b/i,
];

const OUTPUT_RANKING_PATTERNS: RegExp[] = [
  /\bthe\s+best\s+(clinic|surgeon|doctor)\s+(is|in\s+istanbul|in\s+turkey|for\s+you)\b/i,
  /\b(clinic|surgeon|doctor)\s+\w+\s+is\s+the\s+(best|top|number\s+one|#\s*1)\b/i,
];

/**
 * Check an LLM response for guardrail violations.
 */
export function checkOutputGuardrails(llmResponse: string): GuardrailResult {
  const text = llmResponse.trim();

  if (matchesAnyPattern(text, OUTPUT_MEDICAL_ADVICE_PATTERNS)) {
    return violation('medical_advice');
  }

  if (matchesAnyPattern(text, OUTPUT_RANKING_PATTERNS)) {
    return violation('ranking_request');
  }

  return { passed: true, violation: null, safeResponse: null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function violation(type: GuardrailViolation): GuardrailResult {
  return {
    passed: false,
    violation: type,
    safeResponse: SAFE_RESPONSES[type],
  };
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export const _testing = {
  MEDICAL_ADVICE_PATTERNS,
  RANKING_PATTERNS,
  OUT_OF_DOMAIN_PATTERNS,
  OUTPUT_MEDICAL_ADVICE_PATTERNS,
  OUTPUT_RANKING_PATTERNS,
  SAFE_RESPONSES,
  matchesAnyPattern,
};
