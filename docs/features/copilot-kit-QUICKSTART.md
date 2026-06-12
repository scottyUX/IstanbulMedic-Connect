# Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Testing the Patterns

### Static Generative UI
1. Click the Copilot sidebar button (or it may open automatically)
2. Ask: "What's the weather in San Francisco?"
3. Watch as a predefined weather card component appears with the data

### Declarative Generative UI (A2UI)
1. The A2UI assistant sidebar should be available
2. Ask: "Create a contact form" or "Show me a product card"
3. The agent will generate A2UI JSON that renders as UI components

### Open-ended Generative UI (MCP Apps)
- This pattern requires an MCP server to be running
- See the README for setup instructions

## Troubleshooting

- **API Key Issues**: Make sure your `OPENAI_API_KEY` is set in `.env.local`
- **Port Already in Use**: Change the port with `npm run dev -- -p 3001`
- **Build Errors**: Try deleting `node_modules` and `.next`, then `npm install`
