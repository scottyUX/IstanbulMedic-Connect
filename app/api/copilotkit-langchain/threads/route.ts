// CopilotKit 1.57+ fetches this to list agent threads on load and before each run.
// Our adapter is stateless (no persistent threads), so we return an empty list.
export function GET() {
  return Response.json({ threads: [] });
}
