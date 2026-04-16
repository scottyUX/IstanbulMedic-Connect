/**
 * LLM Extraction for HRN Thread Analysis using Tool Use
 *
 * Uses OpenAI's function calling for reliable structured output.
 * Output maps directly to `forum_thread_llm_analysis` table.
 */

import OpenAI from "openai";

export const EXTRACTION_PROMPT_VERSION = "v1.0";
export const EXTRACTION_MODEL = "gpt-4o-mini";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ThreadInput {
  threadTitle: string;
  opText: string;
  lastAuthorPostText?: string;
  threadUrl: string;
}

export interface ExtractionResult {
  // Attribution
  attributed_clinic_name: string | null;
  attributed_doctor_name: string | null;

  // Sentiment (both score and label)
  sentiment_score: number; // -1.0 to 1.0
  sentiment_label: "positive" | "mixed" | "negative";
  satisfaction_label: "satisfied" | "mixed" | "regretful";

  // Content analysis
  summary_short: string;
  main_topics: string[];
  issue_keywords: string[];
  is_repair_case: boolean;
  has_12_month_followup: boolean;

  // Secondary mentions
  secondary_clinic_mentions: Array<{
    clinic_name: string;
    doctor_name?: string;
    role: "mentioned" | "compared" | "repair_source";
    sentiment?: "positive" | "mixed" | "negative";
  }>;

  // Evidence
  evidence_snippets: {
    clinic_attribution?: string;
    sentiment?: string;
    is_repair_case?: string;
    satisfaction?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Schema (OpenAI Function Calling format)
// ─────────────────────────────────────────────────────────────────────────────

const EXTRACTION_FUNCTION: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "extract_thread_signals",
    description:
      "Extract structured signals from a hair transplant forum thread.",
    parameters: {
      type: "object",
      properties: {
        attributed_clinic_name: {
          type: ["string", "null"],
          description:
            "The PRIMARY clinic this thread is about. Use the clinic's commonly known name. Null if unclear.",
        },
        attributed_doctor_name: {
          type: ["string", "null"],
          description:
            "The PRIMARY doctor who performed the procedure. Use format 'Dr. [Last Name]'. Null if unclear.",
        },

        sentiment_score: {
          type: "number",
          description:
            "Overall sentiment from -1.0 (very negative) to 1.0 (very positive). 0 is neutral.",
        },
        sentiment_label: {
          type: "string",
          enum: ["positive", "mixed", "negative"],
          description: "Overall sentiment category",
        },
        satisfaction_label: {
          type: "string",
          enum: ["satisfied", "mixed", "regretful"],
          description: "Author's satisfaction with their results",
        },

        summary_short: {
          type: "string",
          description:
            "1-2 sentences summarizing the thread in neutral language. Focus on: procedure details, timeline, and outcome.",
        },

        main_topics: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "density",
              "hairline",
              "donor_area",
              "healing",
              "communication",
              "value",
              "doctor_involvement",
              "technician_quality",
              "aftercare",
              "natural_results",
              "scar",
              "growth_timeline",
              "other",
            ],
          },
          description: "Topics discussed in the thread",
        },

        issue_keywords: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "shock_loss",
              "poor_density",
              "unnatural_hairline",
              "visible_scarring",
              "infection",
              "poor_growth",
              "overharvesting",
              "bad_communication",
              "regret",
              "revision_needed",
              "other",
            ],
          },
          description:
            "Issues ACTUALLY experienced by the author. Only include if author reports experiencing this — NOT if they mention NOT having it.",
        },

        is_repair_case: {
          type: "boolean",
          description:
            "True if THIS procedure was a repair/revision of a previous hair transplant",
        },

        has_12_month_followup: {
          type: "boolean",
          description:
            "True if the thread contains results from 12+ months post-procedure",
        },

        secondary_clinic_mentions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              clinic_name: { type: "string" },
              doctor_name: { type: "string" },
              role: {
                type: "string",
                enum: ["mentioned", "compared", "repair_source"],
              },
              sentiment: {
                type: "string",
                enum: ["positive", "mixed", "negative"],
              },
            },
            required: ["clinic_name", "role"],
          },
          description: "Other clinics mentioned that are NOT the primary subject",
        },

        evidence_snippets: {
          type: "object",
          properties: {
            clinic_attribution: {
              type: "string",
              description: "Exact quote that identifies the clinic (max 200 chars)",
            },
            sentiment: {
              type: "string",
              description: "Exact quote that best represents overall sentiment",
            },
            is_repair_case: {
              type: "string",
              description: "Exact quote if this is a repair case",
            },
            satisfaction: {
              type: "string",
              description: "Exact quote about satisfaction with results",
            },
          },
          description: "Brief exact quotes supporting each classification",
        },
      },
      required: [
        "sentiment_score",
        "sentiment_label",
        "satisfaction_label",
        "summary_short",
        "main_topics",
        "issue_keywords",
        "is_repair_case",
        "has_12_month_followup",
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert at analyzing hair transplant forum threads. Your job is to extract structured data from patient experience posts.

## Key Rules

1. **Clinic Attribution:** The PRIMARY clinic is where THIS procedure was performed, not clinics mentioned for comparison or previous work. If ambiguous, use null.

2. **Negation Awareness:** For issue_keywords, ONLY include issues the author ACTUALLY experienced.
   - "I had no shock loss" → do NOT include shock_loss
   - "I experienced significant shock loss" → include shock_loss
   - "Unlike others, I didn't have density issues" → do NOT include poor_density

3. **Sentiment Score:** Use the full range from -1.0 to 1.0:
   - 0.7 to 1.0: Very positive, happy with results
   - 0.3 to 0.7: Positive but with minor concerns
   - -0.3 to 0.3: Mixed or neutral
   - -0.7 to -0.3: Negative, disappointed
   - -1.0 to -0.7: Very negative, major regret

4. **Repair Cases:** is_repair_case is true ONLY if THIS specific procedure was to fix/repair a previous hair transplant.

5. **12-Month Followup:** Look for "12 months", "1 year", "one year", "18 months", "2 years" or longer in results updates.

6. **Evidence Snippets:** Include brief exact quotes (under 200 chars) that support your classifications.

7. **Be Conservative:** When uncertain, use null for attribution fields rather than guessing.`;

// ─────────────────────────────────────────────────────────────────────────────
// Main Extraction Function
// ─────────────────────────────────────────────────────────────────────────────

export async function extractThreadSignals(
  client: OpenAI,
  input: ThreadInput
): Promise<ExtractionResult | null> {
  const { threadTitle, opText, lastAuthorPostText, threadUrl } = input;

  const hasUpdate = lastAuthorPostText && lastAuthorPostText.length > 50;

  const userMessage = `Analyze this hair transplant forum thread and extract structured signals.

## Thread Information

**Title:** ${threadTitle}
**URL:** ${threadUrl}

**Original Post:**
${opText}

${hasUpdate ? `**Author's Latest Update:**\n${lastAuthorPostText}` : ""}

Extract the signals using the extract_thread_signals function.`;

  try {
    const response = await client.chat.completions.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      tools: [EXTRACTION_FUNCTION],
      tool_choice: { type: "function", function: { name: "extract_thread_signals" } },
    });

    // Get the function call from the response
    const message = response.choices[0]?.message;
    const toolCall = message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "extract_thread_signals") {
      console.error("No function call in response:", message);
      return null;
    }

    const result = JSON.parse(toolCall.function.arguments) as ExtractionResult;

    // Post-validation
    if (!validateExtractionResult(result)) {
      console.error("Validation failed for extraction result");
      return null;
    }

    return result;
  } catch (error) {
    console.error("Extraction API error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateExtractionResult(result: ExtractionResult): boolean {
  // Check required fields
  if (
    result.sentiment_score === undefined ||
    result.sentiment_label === undefined ||
    result.satisfaction_label === undefined ||
    !result.summary_short
  ) {
    console.error("Missing required fields");
    return false;
  }

  // Check sentiment_score range
  if (result.sentiment_score < -1 || result.sentiment_score > 1) {
    console.error("sentiment_score out of range:", result.sentiment_score);
    return false;
  }

  // Check enum values
  if (!["positive", "mixed", "negative"].includes(result.sentiment_label)) {
    console.error("Invalid sentiment_label:", result.sentiment_label);
    return false;
  }

  if (!["satisfied", "mixed", "regretful"].includes(result.satisfaction_label)) {
    console.error("Invalid satisfaction_label:", result.satisfaction_label);
    return false;
  }

  // Ensure arrays exist
  result.main_topics = result.main_topics || [];
  result.issue_keywords = result.issue_keywords || [];
  result.secondary_clinic_mentions = result.secondary_clinic_mentions || [];
  result.evidence_snippets = result.evidence_snippets || {};

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants for reference
// ─────────────────────────────────────────────────────────────────────────────

export const VALID_TOPICS = [
  "density",
  "hairline",
  "donor_area",
  "healing",
  "communication",
  "value",
  "doctor_involvement",
  "technician_quality",
  "aftercare",
  "natural_results",
  "scar",
  "growth_timeline",
  "other",
] as const;

export const VALID_ISSUE_KEYWORDS = [
  "shock_loss",
  "poor_density",
  "unnatural_hairline",
  "visible_scarring",
  "infection",
  "poor_growth",
  "overharvesting",
  "bad_communication",
  "regret",
  "revision_needed",
  "other",
] as const;
