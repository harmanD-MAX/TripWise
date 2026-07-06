"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Cloud, Sun, CloudRain, CloudLightning, Loader2 } from "lucide-react";

export default function WeatherWidget({ destination }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      if (!destination) return;
      try {
        const res = await api.get(`/api/weather?location=${encodeURIComponent(destination)}`);
        setWeather(res.data);
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [destination]);

  if (loading) {
    return <div className="animate-pulse bg-[#202123] h-32 rounded-xl border border-gray-700 w-full"></div>;
  }

  if (!weather) return null;

  const getWeatherIcon = (condition, className) => {
    const c = condition.toLowerCase();
    if (c.includes("sun") || c.includes("clear")) return <Sun className={className + " text-yellow-400"} />;
    if (c.includes("rain")) return <CloudRain className={className + " text-blue-400"} />;
    if (c.includes("storm") || c.includes("lightning")) return <CloudLightning className={className + " text-purple-400"} />;
    return <Cloud className={className + " text-gray-400"} />;
  };

  return (
    <div className="bg-[#2A2B32] rounded-2xl border border-gray-700 overflow-hidden shadow-sm p-6 mb-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Current Weather */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#202123] rounded-full flex items-center justify-center border border-gray-700">
            {getWeatherIcon(weather.current_condition, "h-8 w-8")}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Current Weather</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{weather.current_temperature}°C</span>
              <span className="text-gray-400 font-medium">{weather.current_condition}</span>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="flex flex-wrap gap-2 md:gap-4 flex-1 md:justify-end">
          {weather.forecast.map((day, idx) => (
            <div key={idx} className="bg-[#202123] rounded-xl border border-gray-700 p-3 flex flex-col items-center justify-center min-w-[70px]">
              <span className="text-xs font-semibold text-gray-400 mb-2">{day.day}</span>
              {getWeatherIcon(day.condition, "h-5 w-5 mb-1")}
              <span className="text-sm font-bold text-white">{day.temperature}°</span>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
