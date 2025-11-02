
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvokeLLM } from "@/api/integrations";
import {
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  WifiOff,
  Play,
  CreditCard
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { weatherPlayingConditions } from "@/api/functions";
import { courtRecommendations } from "@/api/functions";

export default function WeatherWidget({ currentLocation, courts, onPlayRecommendation }) {
  const [weather, setWeather] = useState(null);
  const [conditions, setConditions] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeatherAndConditions = useCallback(async () => {
    if (!currentLocation) return;
    setIsLoading(true);
    setError(null);
    setRecommendations(null); // Clear previous recommendations
    setWeather(null); // Clear previous weather
    setConditions(null); // Clear previous conditions

    try {
      // Step 1: Get weather and playing conditions
      const { data: conditionsData, error: conditionsError } = await weatherPlayingConditions({
        location: { // Updated format for location data
          lat: currentLocation.lat,
          lon: currentLocation.lng,
        }
      });

      if (conditionsError) {
        throw new Error(conditionsError);
      }

      if (conditionsData) {
        setWeather(conditionsData.weather);
        setConditions(conditionsData.conditions);

        // Step 2: If conditions are playable and we have courts, get court recommendations
        if (conditionsData.conditions?.is_playable && courts && courts.length > 0) {
          const { data: recsData, error: recsError } = await courtRecommendations({
            userLocation: currentLocation,
            courts: courts.map(c => ({
              name: c.name,
              distance: c.distance,
              court_type: c.court_type,
              total_courts: c.total_courts,
              amenities: c.amenities,
              availableCourts: c.availableCourts
            })),
            preferences: {} // Assuming default preferences for now
          });
          if (recsError) {
            console.warn("Could not get court recommendations:", recsError);
            // Don't throw, just proceed without recommendations if LLM fails
          }
          setRecommendations(recsData);
        }
      }
    } catch (err) {
      console.error("Error fetching weather or recommendations:", err);
      // More specific error messages can be added here based on 'err' properties
      if (err.message?.includes('Network Error') || !navigator.onLine) {
        setError("Unable to load weather data - you may be offline. The app works without weather info!");
      } else if (err.message?.includes('API quota exceeded') || err.response?.status === 429) {
        setError("Weather service busy or quota exceeded. Please try again later. All court features work perfectly!");
      } else if (err.message?.includes('timeout')) {
        setError("Weather request timed out. Please check your connection.");
      }
      else {
        setError("Weather data temporarily unavailable. Courts and games still work perfectly!");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, courts]);

  useEffect(() => {
    fetchWeatherAndConditions();
  }, [fetchWeatherAndConditions]);

  const handleRefresh = () => {
    fetchWeatherAndConditions();
  };

  if (!currentLocation) {
    return null;
  }

  if (error && !weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-orange-500" />
            Weather Temporarily Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {error}
              </p>
              {!navigator.onLine && (
                <p className="text-xs text-blue-600 mt-2">
                  ⚠️ You appear to be offline. Weather will load when connection is restored.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="w-full"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Trying Again...' : 'Retry Weather'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5" />
            Loading Conditions...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather || !conditions) {
    return null;
  }

  const getWeatherIcon = (condition) => {
    const lowerCondition = condition?.toLowerCase() || '';
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) return Sun;
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) return CloudRain;
    return Cloud;
  };

  const WeatherIcon = getWeatherIcon(weather.current.condition);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="w-5 h-5" />
          Playing Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WeatherIcon className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{Math.round(weather.current.temperature)}°F</p>
              <p className="text-sm text-gray-600 capitalize">{weather.current.condition}</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Feels like {Math.round(weather.current.feels_like)}°F</p>
            <p>Wind: {weather.current.wind_speed} mph</p>
          </div>
        </div>

        {/* Weather Alerts */}
        {weather.alerts && weather.alerts.length > 0 ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Weather Alert</span>
            </div>
            {weather.alerts.map((alert, index) => (
              <p key={index} className="text-sm text-red-700">{alert}</p>
            ))}
          </div>
        ) : conditions?.is_playable && (conditions?.recommendation === 'excellent' || conditions?.recommendation === 'good') ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Great Weather!</span>
                </div>
                <p className="text-sm text-green-700">{conditions.summary || 'Perfect conditions for outdoor sports today!'}</p>
            </div>
        ) : null}

        {/* Call to Action Button */}
        {conditions?.is_playable && (conditions?.recommendation === 'excellent' || conditions?.recommendation === 'good') ? (
            <Button
                onClick={() => onPlayRecommendation && onPlayRecommendation(recommendations)}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
                <Play className="w-4 h-4 mr-2" />
                Find Courts & Players Now
            </Button>
        ) : null}

        {/* Hourly Forecast */}
        <div>
          <p className="font-semibold text-sm text-gray-700 mb-2">Next 8 Hours:</p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {weather.forecast.slice(0, 4).map((hour, index) => (
              <div key={index} className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">{hour.time}</p>
                <p>{Math.round(hour.temperature)}°</p>
                <p className="text-gray-600">{hour.chance_of_rain}%</p>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="w-full"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Updating...' : 'Refresh Weather'}
        </Button>
      </CardContent>
    </Card>
  );
}
