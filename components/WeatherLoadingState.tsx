interface WeatherLoadingStateProps {
  location?: string;
}

const WeatherLoadingState = ({ location }: WeatherLoadingStateProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <div className="animate-pulse">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200"></div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200"></div>
          <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
        </div>
        {location && (
          <p className="mt-4 text-sm text-gray-500">
            Loading weather for {location}...
          </p>
        )}
      </div>
    </div>
  );
};

export default WeatherLoadingState;
