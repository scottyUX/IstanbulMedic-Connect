# Generative UI Playground

A Next.js playground for experimenting with three patterns of Generative UI using CopilotKit:

1. **Static Generative UI** - Predefined components selected and filled by the agent
2. **Declarative Generative UI (A2UI)** - Agent generates JSON UI specifications
3. **Open-ended Generative UI (MCP Apps)** - Agent embeds full UI surfaces

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (or other LLM provider)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

### Static Generative UI
- Uses `useFrontendTool` hook to bind predefined React components
- Agent selects which component to show and fills it with data
- Example: Ask "What's the weather in San Francisco?" to see a weather card

### Declarative Generative UI (A2UI)
- Agent generates A2UI JSON specifications
- Frontend renders structured UI based on the spec
- Example: Ask "Create a contact form" to see a form generated from JSON

### Open-ended Generative UI (MCP Apps)
- Agent can embed external applications
- Requires MCP server setup
- Most flexible but requires more configuration

## Project Structure

```
gen-ui-playground/
├── app/
│   ├── api/
│   │   ├── copilotkit/
│   │   │   └── route.ts          # Main CopilotKit API route
│   │   └── copilotkit-a2ui/
│   │       └── route.ts          # A2UI-specific API route
│   ├── layout.tsx
│   └── page.tsx                  # Main playground page
├── components/
│   ├── StaticGenUI.tsx           # Static Generative UI demo
│   ├── DeclarativeGenUI.tsx      # A2UI demo
│   ├── MCPAppsGenUI.tsx          # MCP Apps demo
│   ├── A2UIPage.tsx              # A2UI wrapper component
│   ├── WeatherCard.tsx           # Weather display component
│   └── WeatherLoadingState.tsx   # Loading state component
└── README.md
```

## Learn More

- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [Generative UI Article](https://dev.to/copilotkit/the-developers-guide-to-generative-ui-in-2026-1bh3)
- [AG-UI Protocol](https://docs.copilotkit.ai)
- [A2UI Specification](https://ai.google.dev/a2ui)

## Next Steps

- Configure MCP Apps middleware for open-ended Generative UI
- Add more example components for Static Generative UI
- Experiment with different A2UI templates
- Customize the A2UI theme

# Supabase
## Getting Set Up for local development

### Prerequisites

- updated npm
- a container runtime compatible with Docker APIs (Docker Desktop)

### Installation & Set UP
- follow this guide: https://supabase.com/docs/guides/local-development?queryGroups=package-manager&package-manager=npm
- update .env with (from running supabase start or supabase status)
  - SUPABASE_URL=http://...(project url under APIs)
  - SUPABASE_ANON_KEY=sb_publishable_...
  - SUPABASE_SERVICE_ROLE_KEY=sb_secret_....
  - DATABASE_URL=postgresql://postgres:postgres@...
- Login to supabase using - supabase login
- Link to the DB Scott made for us using - supabase link --project-ref ioofmlovhjvnnqvczeri



