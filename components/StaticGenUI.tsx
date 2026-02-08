"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import WeatherCard from "./WeatherCard";
import WeatherLoadingState from "./WeatherLoadingState";
import Calculator from "./Calculator";
import TodoList from "./TodoList";
import NotePad from "./NotePad";

interface WeatherData {
  location: string;
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
}

// Mock weather data function
const getMockWeather = (location: string): WeatherData => {
  const conditions = ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"];
  return {
    location,
    temperature: Math.floor(Math.random() * 40) + 50,
    conditions: conditions[Math.floor(Math.random() * conditions.length)],
    humidity: Math.floor(Math.random() * 50) + 30,
    windSpeed: Math.floor(Math.random() * 20) + 5,
  };
};

const StaticGenUI = () => {
  // Weather Tool
  useFrontendTool({
    name: "get_weather",
    description: "Get current weather information for a location",
    parameters: [
      {
        name: "location",
        type: "string",
        description: "The city or location to get weather for",
        required: true,
      },
    ],
    handler: async ({ location }) => {
      await new Promise((r) => setTimeout(r, 500));
      return JSON.stringify(getMockWeather(location));
    },
    render: ({ status, args, result }) => {
      if (status === "inProgress" || status === "executing") {
        return <WeatherLoadingState location={args?.location} />;
      }
      if (status === "complete" && result) {
        try {
          let data: WeatherData;
          if (typeof result === "string") {
            data = JSON.parse(result) as WeatherData;
          } else {
            data = result as WeatherData;
          }
          
          if (!data.location || typeof data.temperature !== "number") {
            return <div className="text-red-600">Invalid weather data format</div>;
          }
          
          return (
            <WeatherCard
              location={data.location}
              temperature={data.temperature}
              conditions={data.conditions}
              humidity={data.humidity}
              windSpeed={data.windSpeed}
            />
          );
        } catch (e) {
          return (
            <div className="text-red-600">
              Error parsing weather data: {String(e)}
            </div>
          );
        }
      }
      return <></>;
    },
  });

  // Calculator Tool
  useFrontendTool({
    name: "open_calculator",
    description: "Open a calculator widget for performing calculations",
    parameters: [
      {
        name: "initialValue",
        type: "number",
        description: "Optional initial value for the calculator",
        required: false,
      },
    ],
    handler: async ({ initialValue }) => {
      return JSON.stringify({ initialValue: initialValue || 0 });
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          return <Calculator initialValue={data.initialValue || 0} />;
        } catch (e) {
          return <Calculator />;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <div className="text-gray-500">Opening calculator...</div>;
      }
      return <></>;
    },
  });

  // Todo List Tool
  useFrontendTool({
    name: "create_todo_list",
    description: "Create a todo list widget with initial tasks",
    parameters: [
      {
        name: "todos",
        type: "string[]",
        description: "Optional array of initial todo items",
        required: false,
      },
    ],
    handler: async ({ todos }) => {
      return JSON.stringify({ todos: todos || [] });
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          return <TodoList initialTodos={data.todos || []} />;
        } catch (e) {
          return <TodoList />;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <div className="text-gray-500">Creating todo list...</div>;
      }
      return <></>;
    },
  });

  // Note Pad Tool
  useFrontendTool({
    name: "open_note_pad",
    description: "Open a note pad widget for taking notes",
    parameters: [
      {
        name: "note",
        type: "string",
        description: "Optional initial note text",
        required: false,
      },
      {
        name: "title",
        type: "string",
        description: "Optional title for the note pad",
        required: false,
      },
    ],
    handler: async ({ note, title }) => {
      return JSON.stringify({ note: note || "", title: title || "Quick Note" });
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          return (
            <NotePad
              initialNote={data.note || ""}
              title={data.title || "Quick Note"}
            />
          );
        } catch (e) {
          return <NotePad />;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <div className="text-gray-500">Opening note pad...</div>;
      }
      return <></>;
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Static Generative UI</h2>
      <p className="text-gray-600">
        The agent can open various widgets. Try asking:
      </p>
      <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600">
        <li>&quot;What&apos;s the weather in San Francisco?&quot;</li>
        <li>&quot;Open a calculator&quot;</li>
        <li>&quot;Create a todo list with groceries&quot;</li>
        <li>&quot;Open a note pad&quot;</li>
      </ul>
    </div>
  );
};

export default StaticGenUI;
