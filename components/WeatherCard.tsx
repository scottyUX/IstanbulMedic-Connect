interface WeatherData {
  location: string;
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherCardProps {
  location: string;
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
}

const WeatherCard = ({
  location,
  temperature,
  conditions,
  humidity,
  windSpeed,
}: WeatherCardProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="mb-4 text-xl font-semibold text-gray-800">{location}</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Temperature:</span>
          <span className="text-2xl font-bold text-blue-600">
            {temperature}°F
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Conditions:</span>
          <span className="font-medium text-gray-800">{conditions}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Humidity:</span>
          <span className="font-medium text-gray-800">{humidity}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Wind Speed:</span>
          <span className="font-medium text-gray-800">{windSpeed} mph</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
