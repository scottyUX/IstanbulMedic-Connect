import { describe, it, expect } from 'vitest';
import {
  checkInputGuardrails,
  checkOutputGuardrails,
  _testing,
  type GuardrailResult,
} from '@/lib/agents/langchain/guardrails';

// =============================================================================
// Helpers
// =============================================================================

function expectBlocked(result: GuardrailResult, expectedViolation: string) {
  expect(result.passed).toBe(false);
  expect(result.violation).toBe(expectedViolation);
  expect(result.safeResponse).toBeTruthy();
}

function expectPassed(result: GuardrailResult) {
  expect(result.passed).toBe(true);
  expect(result.violation).toBeNull();
  expect(result.safeResponse).toBeNull();
}

// =============================================================================
// INPUT GUARDRAILS
// =============================================================================

describe('checkInputGuardrails', () => {
  // ---------------------------------------------------------------------------
  // Medical advice detection
  // ---------------------------------------------------------------------------

  describe('medical advice', () => {
    const medicalAdviceInputs = [
      'Is this surgery safe for me?',
      'Should I get a hair transplant?',
      'Should I have FUE or FUT?',
      'Should I undergo a transplant at my age?',
      'Should I try minoxidil first?',
      'Do I need a surgery to fix my hairline?',
      'Do I need a transplant?',
      'Do I need medication for my hair loss?',
      'Am I a good candidate for a hair transplant?',
      'Am I a suitable candidate for FUE?',
      'Can you diagnose my hair loss?',
      'Can you prescribe something for my hair loss?',
      'What medication should I take for thinning hair?',
      'What drug should I use for regrowth?',
      'Is it safe for me to get surgery after chemotherapy?',
      'Is it safe if I have diabetes?',
      'Will this work for me?',
      'Will I be ok after the procedure?',
      'Prescribe me something for hair regrowth',
      'Give me a diagnosis',
    ];

    it.each(medicalAdviceInputs)(
      'blocks: "%s"',
      (input) => {
        expectBlocked(checkInputGuardrails(input), 'medical_advice');
      }
    );

    it('safe response mentions consulting a professional', () => {
      const result = checkInputGuardrails('Is this surgery safe for me?');
      expect(result.safeResponse).toContain('qualified');
      expect(result.safeResponse).toContain('consultation');
    });
  });

  // ---------------------------------------------------------------------------
  // Ranking / "best" claims
  // ---------------------------------------------------------------------------

  describe('ranking requests', () => {
    const rankingInputs = [
      'Which clinic has the best surgeon?',
      'Which clinic is the best in Istanbul?',
      'What clinic has the top surgeon?',
      'Best clinic for hair transplant?',
      'Best doctor for FUE?',
      'Top rated clinic in Turkey',
      'Top clinic for hair restoration',
      'Who is the best surgeon in Turkey?',
      'Who is the number one doctor?',
      'Rank the clinics for me',
      'Rank the surgeons by quality',
      'Which doctor do you recommend?',
      'Which clinic do you recommend?',
    ];

    it.each(rankingInputs)(
      'blocks: "%s"',
      (input) => {
        expectBlocked(checkInputGuardrails(input), 'ranking_request');
      }
    );

    it('safe response offers to show factual data', () => {
      const result = checkInputGuardrails('Which clinic has the best surgeon?');
      expect(result.safeResponse).toContain('scores');
      expect(result.safeResponse).toContain('reviews');
    });
  });

  // ---------------------------------------------------------------------------
  // Out-of-domain topics
  // ---------------------------------------------------------------------------

  describe('out-of-domain', () => {
    const outOfDomainInputs = [
      'What stocks should I invest in?',
      'Tell me the bitcoin price',
      'I need a lawyer for my case',
      'Can you give me legal advice?',
      'Give me a recipe for chocolate cake',
      'What is the weather in London today?',
      'Write me a poem about love',
      'Write me an essay on climate change',
      'Help me with my homework',
      'Solve this math problem for me',
      'Give me relationship advice',
      'Give me dating tips',
      'Tell me about breast augmentation',
      'How much does liposuction cost?',
      'Can you recommend a rhinoplasty surgeon?',
      'Is botox worth it?',
      'How much does a facelift cost?',
    ];

    it.each(outOfDomainInputs)(
      'blocks: "%s"',
      (input) => {
        expectBlocked(checkInputGuardrails(input), 'out_of_domain');
      }
    );

    it('safe response redirects to hair restoration', () => {
      const result = checkInputGuardrails('What stocks should I invest in?');
      expect(result.safeResponse).toContain('hair restoration');
    });
  });

  // ---------------------------------------------------------------------------
  // Legitimate questions that SHOULD pass
  // ---------------------------------------------------------------------------

  describe('legitimate queries (should pass)', () => {
    const legitimateInputs = [
      'What is FUE hair transplant?',
      'How much does a hair transplant cost in Turkey?',
      'What is the recovery time for FUE?',
      'Can you show me clinics in Istanbul?',
      'How many grafts do I typically need for a receding hairline?',
      'What is the difference between FUE and FUT?',
      'Tell me about PRP therapy for hair',
      'What should I expect during recovery?',
      'How long do hair transplant results last?',
      'Can you help me schedule a consultation?',
      'What are the clinic scores?',
      'Show me patient reviews',
      'What credentials does the clinic have?',
      'Hello, I need help with hair loss',
      'How does the hair transplant procedure work?',
      'What aftercare is included?',
      'Tell me about DHI technique',
      'What is the success rate of hair transplants?',
    ];

    it.each(legitimateInputs)(
      'passes: "%s"',
      (input) => {
        expectPassed(checkInputGuardrails(input));
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles empty string', () => {
      expectPassed(checkInputGuardrails(''));
    });

    it('handles whitespace-only string', () => {
      expectPassed(checkInputGuardrails('   '));
    });

    it('handles very long input without false positive', () => {
      const longInput =
        'I have been thinking about getting a hair transplant for a while now and I would really like to know about the different techniques available, specifically FUE and FUT, and how they compare in terms of recovery time and cost.';
      expectPassed(checkInputGuardrails(longInput));
    });

    it('is case-insensitive', () => {
      expectBlocked(
        checkInputGuardrails('SHOULD I GET A HAIR TRANSPLANT?'),
        'medical_advice'
      );
    });

    it('detects guardrail violation even with surrounding text', () => {
      expectBlocked(
        checkInputGuardrails(
          'Hey Leila, I was wondering, is this surgery safe for me given my age?'
        ),
        'medical_advice'
      );
    });

    it('does not false-positive on "should I know" (educational)', () => {
      // "should I know" doesn't match "should I get/have/do/undergo/take/try/consider"
      expectPassed(
        checkInputGuardrails('What should I know about the procedure?')
      );
    });

    it('does not false-positive on "best practices"', () => {
      // "best" without clinic/doctor/surgeon/hospital context should pass
      expectPassed(
        checkInputGuardrails('What are the best practices for aftercare?')
      );
    });

    it('does not false-positive on "invest time in recovery"', () => {
      expectPassed(
        checkInputGuardrails('How much time do I need to invest in recovery?')
      );
    });
  });
});

// =============================================================================
// OUTPUT GUARDRAILS
// =============================================================================

describe('checkOutputGuardrails', () => {
  // ---------------------------------------------------------------------------
  // Medical advice in output
  // ---------------------------------------------------------------------------

  describe('medical advice in output', () => {
    const unsafeOutputs = [
      'You should get a FUE transplant for your case.',
      'You should have FUT done as soon as possible.',
      'You should undergo a hair transplant.',
      'You should take minoxidil daily.',
      'You should try finasteride for regrowth.',
      'I recommend you get a hair transplant.',
      'I recommend that you undergo FUE.',
      'You are a good candidate for a hair transplant.',
      'You are an ideal candidate for FUE.',
      'This procedure is safe for you.',
      'You need a FUE surgery to fix your hairline.',
      'You need a transplant as soon as possible.',
      'You require a hair transplant.',
    ];

    it.each(unsafeOutputs)(
      'blocks output: "%s"',
      (output) => {
        expectBlocked(checkOutputGuardrails(output), 'medical_advice');
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Ranking in output
  // ---------------------------------------------------------------------------

  describe('ranking in output', () => {
    const rankingOutputs = [
      'The best clinic in Istanbul is ClinicX.',
      'The best surgeon for you is Dr. Smith.',
      'The best doctor in Turkey is Dr. Johnson.',
      'Clinic ABC is the best.',
      'Surgeon XYZ is the number one.',
      'Doctor Doe is the top.',
    ];

    it.each(rankingOutputs)(
      'blocks output: "%s"',
      (output) => {
        expectBlocked(checkOutputGuardrails(output), 'ranking_request');
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Safe outputs that should pass
  // ---------------------------------------------------------------------------

  describe('safe outputs (should pass)', () => {
    const safeOutputs = [
      'FUE is a minimally invasive hair transplant technique that involves extracting individual follicular units.',
      'Here are the clinics I found in our database with their scores and reviews.',
      'The recovery time for FUE is typically 7-10 days.',
      'I would recommend consulting with a qualified surgeon for a personalised assessment.',
      'Based on the data, here are the clinic scores so you can compare.',
      'Hair transplant costs in Turkey typically range from €1,500 to €5,000.',
      'PRP therapy is a complementary treatment that can support hair regrowth.',
    ];

    it.each(safeOutputs)(
      'passes output: "%s"',
      (output) => {
        expectPassed(checkOutputGuardrails(output));
      }
    );
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      expectPassed(checkOutputGuardrails(''));
    });

    it('is case-insensitive', () => {
      expectBlocked(
        checkOutputGuardrails('YOU SHOULD GET A FUE TRANSPLANT.'),
        'medical_advice'
      );
    });
  });
});

// =============================================================================
// SAFE RESPONSES
// =============================================================================

describe('safe responses', () => {
  it('medical_advice response does not contain medical claims', () => {
    const resp = _testing.SAFE_RESPONSES.medical_advice;
    expect(resp).not.toMatch(/you should/i);
    expect(resp).not.toMatch(/you need/i);
    expect(resp).toContain('consultation');
  });

  it('ranking_request response does not rank clinics', () => {
    const resp = _testing.SAFE_RESPONSES.ranking_request;
    // The response mentions "the best" only in a disclaimer context (not as a claim)
    expect(resp).not.toMatch(/\bis the best\b/i);
    expect(resp).toContain('compare');
  });

  it('out_of_domain response redirects to hair restoration', () => {
    const resp = _testing.SAFE_RESPONSES.out_of_domain;
    expect(resp).toContain('hair restoration');
  });

  it('fabrication_risk response is honest about missing data', () => {
    const resp = _testing.SAFE_RESPONSES.fabrication_risk;
    expect(resp).toContain("don't have");
  });
});

// =============================================================================
// SYSTEM PROMPT (versioned module)
// =============================================================================

describe('leila system prompt', () => {
  // Lazy import to avoid circular dependency issues with mocks in agent.test.ts
  let LEILA_SYSTEM_PROMPT: string;
  let PROMPT_VERSION: string;
  let PROMPT_SECTIONS: Record<string, string>;

  beforeAll(async () => {
    const mod = await import(
      '@/lib/agents/langchain/prompts/leila-system-prompt'
    );
    LEILA_SYSTEM_PROMPT = mod.LEILA_SYSTEM_PROMPT;
    PROMPT_VERSION = mod.PROMPT_VERSION;
    PROMPT_SECTIONS = mod.PROMPT_SECTIONS;
  });

  it('has a valid semver version', () => {
    expect(PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('contains persona section', () => {
    expect(LEILA_SYSTEM_PROMPT).toContain('Leila');
    expect(LEILA_SYSTEM_PROMPT).toContain('hair restoration');
  });

  it('contains guardrail instructions', () => {
    expect(LEILA_SYSTEM_PROMPT).toContain('SAFETY GUARDRAILS');
    expect(LEILA_SYSTEM_PROMPT).toContain('NO MEDICAL ADVICE');
    expect(LEILA_SYSTEM_PROMPT).toContain('NO FABRICATED DATA');
    expect(LEILA_SYSTEM_PROMPT).toContain('NO RANKING');
    expect(LEILA_SYSTEM_PROMPT).toContain('STAY IN DOMAIN');
  });

  it('contains GDPR section', () => {
    expect(LEILA_SYSTEM_PROMPT).toContain('GDPR');
  });

  it('contains database_lookup tool reference', () => {
    expect(LEILA_SYSTEM_PROMPT).toContain('database_lookup');
  });

  it('contains all expected tool tables', () => {
    const expectedTables = [
      'clinics',
      'clinic_locations',
      'clinic_pricing',
      'clinic_packages',
      'clinic_reviews',
      'clinic_services',
      'clinic_team',
      'clinic_scores',
      'clinic_credentials',
      'clinic_languages',
      'clinic_mentions',
      'clinic_facts',
    ];
    for (const table of expectedTables) {
      expect(LEILA_SYSTEM_PROMPT).toContain(table);
    }
  });

  it('exports individual prompt sections', () => {
    expect(PROMPT_SECTIONS.PERSONA).toBeTruthy();
    expect(PROMPT_SECTIONS.ROLE).toBeTruthy();
    expect(PROMPT_SECTIONS.TOOLS).toBeTruthy();
    expect(PROMPT_SECTIONS.CONVERSATION_STYLE).toBeTruthy();
    expect(PROMPT_SECTIONS.GUARDRAILS).toBeTruthy();
  });
});
