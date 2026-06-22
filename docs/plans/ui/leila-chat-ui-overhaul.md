# Leila Chat UI Overhaul Plan

## The Problem

`CopilotChat` is a monolithic component — it bundles the AI connection, message rendering, input bar, and layout all together. This means we have no real control over positioning, styling, or UX without fighting its internal DOM structure via fragile CSS overrides.

Symptoms we hit:
- Input bar drifts up as messages appear (flex layout inside CopilotKit can't be reliably constrained from outside)
- Duplicate suggestion chips (CopilotKit renders its own, we had our own)
- Message bubble colors are Google/Gemini blue — off-brand
- No control over loading states between send and stream start
- Can't do a proper ChatGPT-style fixed-input layout without hacks

## What We Actually Need CopilotKit For

Only two things:
1. **`useCopilotChat` hook** — gives us `messages`, `appendMessage`, `isLoading`, `stopGeneration` to wire the AI without owning any UI
2. **`useCopilotAction` (LeilaGenUI)** — registers the frontend tools that render rich components (ConsultationScheduler, PhotoUploadWidget, etc.) inside the message thread

Everything else we build ourselves.

## Target Architecture

```
LeilaChat (owns layout)
├── messages area         ← our div, overflow-y: auto, flex-1
│   ├── MessageBubble     ← our component, full style control
│   │   └── (if tool call) → renders GenUI widget inline
│   └── TypingIndicator   ← immediate, shows on send
└── input bar             ← position: fixed bottom-0, our component
    └── LeilaInput        ← already built, keep as-is
```

```tsx
// Rough shape of the new LeilaChat
const { messages, appendMessage, isLoading } = useCopilotChat();

return (
  <div className="h-screen flex flex-col">
    {/* scrollable messages */}
    <div className="flex-1 overflow-y-auto pb-32 px-4">
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
      {isLoading && <TypingIndicator />}
    </div>

    {/* fixed input */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <LeilaInput onSend={appendMessage} inProgress={isLoading} />
      </div>
    </div>
  </div>
);
```

## Specific UI Changes

### Layout
- `h-screen` outer container, `overflow: hidden`
- Messages area: `flex-1 overflow-y-auto` — scrolls independently
- Input: `position: fixed; bottom: 0` — never moves, always visible
- Max-width container: ~768px centered, same as current

### Message Bubbles
- **User messages**: brand navy `#102544` background, white text, right-aligned, rounded `18px 18px 4px 18px`
- **Assistant messages**: light warm gray `#F5F4F2` background, dark text, left-aligned, rounded `18px 18px 18px 4px`
- Avatar (Leila photo) next to assistant messages — small, 28px circle
- Markdown rendered for assistant responses (use `react-markdown` or keep CopilotKit's markdown renderer)

### Loading / Typing Indicator
- Shows **immediately** on send (before `isLoading` from CopilotKit kicks in) — use local optimistic state
- Three animated dots, same styling as assistant message bubble
- Disappears when first token of response arrives

### Greeting Screen (when no messages yet)
- Keep current h2 + 4 quick-suggestion grid
- Suggestion cards: slightly upgraded — soft shadow, hover lift, brand navy border on hover
- When a suggestion is clicked → populate input and send immediately

### Input Bar
- Keep `LeilaInput` as-is (it's already solid)
- Add `padding-bottom: env(safe-area-inset-bottom)` for mobile notch safety
- Fix focus ring color to brand navy instead of `blue-500`

### Colors (align to brand)
- Primary: `#102544` (brand navy) — replaces Google blue everywhere
- User bubble: `#102544`
- Hover/focus: `#102544` with opacity variants
- Remove all Gemini-style CSS from globals.css once this is done

## Files to Change

| File | Change |
|---|---|
| `components/leila/LeilaChat.tsx` | Full rewrite — use `useCopilotChat` instead of `CopilotChat` |
| `components/leila/MessageBubble.tsx` | New component — user + assistant bubble variants |
| `components/leila/TypingIndicator.tsx` | New component — animated dots |
| `components/leila/LeilaInput.tsx` | Minor: fix focus color, safe-area padding |
| `app/globals.css` | Remove all the Gemini/CopilotKit overrides once we own the UI |

## Files to Keep Unchanged
- `components/leila/LeilaGenUI.tsx` — still needed for tool rendering
- `components/leila/UserContextProvider.tsx` — still needed
- `components/leila/ConsultationScheduler.tsx` — still needed
- `app/api/copilotkit-leila/route.ts` — backend unchanged
- `lib/agents/langchain/prompts/leila-system-prompt.ts` — unchanged

## How GenUI Still Works

`LeilaGenUI` registers tools via `useCopilotAction`. Those hooks are independent of whether we use `CopilotChat` or `useCopilotChat`. The tool render functions return React components that we render inside our custom `MessageBubble` when a message has a tool call attached.

CopilotKit attaches tool results to the messages array — we just need to check `message.role === 'tool'` or check for action results and render the appropriate widget.

## Notes
- `useCopilotChat` is in `@copilotkit/react-core` — already a dependency
- Check if `appendMessage` or `sendMessage` is the correct API name in v1.57
- The `LeilaGenUI` hidden div in `page.tsx` stays exactly as-is
