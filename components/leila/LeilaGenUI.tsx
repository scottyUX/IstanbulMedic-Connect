"use client";

import { useFrontendTool, useCopilotAction } from "@copilotkit/react-core";
import ConsultationScheduler from "./ConsultationScheduler";

// Treatment Information Card
interface TreatmentInfoCardProps {
  title: string;
  description: string;
  duration?: string;
  cost?: string;
  recoveryTime?: string;
}

const TreatmentInfoCard = (props: TreatmentInfoCardProps) => {
  const { title, description, duration, cost, recoveryTime } = props;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="space-y-2">
        {duration && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Duration:</span>
            <span>{duration}</span>
          </div>
        )}
        {cost && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Cost:</span>
            <span>{cost}</span>
          </div>
        )}
        {recoveryTime && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Recovery Time:</span>
            <span>{recoveryTime}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Photo Upload Widget
interface PhotoUploadWidgetProps {
  purpose?: string;
}

const PhotoUploadWidget = ({ purpose }: PhotoUploadWidgetProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {purpose || "Upload Your Scalp Photos"}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload photos of your scalp so I can review your hairline, density, and thinning patterns.
      </p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h12m-4 4v12m0 0l-4-4m4 4l4-4"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
        </div>
      </div>
    </div>
  );
};

const LeilaGenUI = () => {
  // Knowledge Base Search Action (Backend)
  useCopilotAction({
    name: "search_knowledge_base",
    description:
      "Search the knowledge base for information about hair restoration procedures, treatments, costs, recovery times, and patient care. Use this when you need to find specific information from the knowledge base.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The search query to find relevant information",
        required: true,
      },
    ],
    handler: async ({ query }: { query: string }) => {
      try {
        const response = await fetch("/api/search-knowledge-base", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const error = await response.json();
          return `Error searching knowledge base: ${error.error || "Unknown error"}`;
        }

        const data = await response.json();
        return data.result || "No information found in the knowledge base.";
      } catch (error) {
        console.error("Error calling search API:", error);
        return `Error searching knowledge base: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });

  // Consultation Scheduling Tool
  useFrontendTool({
    name: "schedule_consultation",
    description: "Schedule a free hair transplant consultation. Use this when users want to book a consultation, schedule an appointment, or ask about booking a consultation. Always use this tool when users mention scheduling, booking, or consultation appointments.",
    parameters: [
      {
        name: "date",
        type: "string",
        description: "Preferred consultation date in YYYY-MM-DD format (optional, user may not specify)",
        required: false,
      },
      {
        name: "time",
        type: "string",
        description: "Preferred consultation time like '10:00 AM' or '2:00 PM' (optional, user may not specify)",
        required: false,
      },
    ],
    handler: async ({ date, time }) => {
      // Return the data that will be used to render the widget
      return JSON.stringify({ 
        date: date || "", 
        time: time || "",
        timestamp: new Date().toISOString(),
      });
    },
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, args, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          return <ConsultationScheduler date={data.date} time={data.time} />;
        } catch (e) {
          console.error("Error parsing consultation data:", e);
          return <ConsultationScheduler />;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-md mx-auto">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Preparing consultation scheduler...</span>
            </div>
          </div>
        );
      }
      return null;
    },
  });

  // Treatment Information Tool
  useFrontendTool({
    name: "show_treatment_info",
    description: "Display information about hair transplant treatments, procedures, costs, or recovery. Use this when users ask about treatments, procedures, costs, or recovery time.",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Title of the treatment or procedure",
        required: true,
      },
      {
        name: "description",
        type: "string",
        description: "Description of the treatment",
        required: true,
      },
      {
        name: "duration",
        type: "string",
        description: "Duration of the procedure (optional)",
        required: false,
      },
      {
        name: "cost",
        type: "string",
        description: "Cost information (optional)",
        required: false,
      },
      {
        name: "recoveryTime",
        type: "string",
        description: "Recovery time information (optional)",
        required: false,
      },
    ],
    handler: async ({ title, description, duration, cost, recoveryTime }) => {
      return JSON.stringify({
        title,
        description,
        duration: duration || "",
        cost: cost || "",
        recoveryTime: recoveryTime || "",
      });
    },
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, args, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          return (
            <TreatmentInfoCard
              title={data.title}
              description={data.description}
              duration={data.duration}
              cost={data.cost}
              recoveryTime={data.recoveryTime}
            />
          );
        } catch (e) {
          return <div className="text-red-600">Error displaying treatment information</div>;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <div className="text-gray-500">Loading treatment information...</div>;
      }
      return null;
    },
  });

  // Photo Upload Tool
  useFrontendTool({
    name: "upload_scalp_photos",
    description: "Open a photo upload widget for users to upload scalp photos for analysis. Use this when users want to upload photos or share images of their scalp.",
    parameters: [
      {
        name: "purpose",
        type: "string",
        description: "Purpose of the photo upload (optional)",
        required: false,
      },
    ],
    handler: async ({ purpose }) => {
      return JSON.stringify({ purpose: purpose || "Upload Your Scalp Photos" });
    },
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, args, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          return <PhotoUploadWidget purpose={data.purpose} />;
        } catch (e) {
          return <PhotoUploadWidget />;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <div className="text-gray-500">Preparing photo upload...</div>;
      }
      return null;
    },
  });

  return null; // This component only registers tools, doesn't render anything
};

export default LeilaGenUI;
