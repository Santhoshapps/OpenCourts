
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourtSession, Court, Player } from "@/api/entities";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function HourlyActivityChart({ municipality, dateRange }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHourlyData = async () => {
      setIsLoading(true);
      try {
        // Get courts for this municipality
        const courts = await Court.filter(municipality ? { municipality_id: municipality.id } : {});
        const courtIds = courts.map(c => c.id);

        // Get sessions for these courts
        const allSessions = await CourtSession.list();
        const sessions = allSessions.filter(session => {
          const sessionDate = new Date(session.start_time);
          const isInDateRange = sessionDate >= new Date(dateRange.start) && sessionDate <= new Date(dateRange.end);
          const isInMunicipality = !municipality || courtIds.includes(session.court_id);
          return isInDateRange && isInMunicipality;
        });

        // Get player data to distinguish guests
        // Only fetch players if there are sessions, otherwise playerIds would be empty and list() might fetch all players
        const playerIds = [...new Set(sessions.map(s => s.player_id))];
        const players = playerIds.length > 0 ? await Player.list() : []; // Optimization: Fetch players only if needed
        const playersMap = new Map(players.map(p => [p.id, p]));

        // Group sessions by hour of day
        const hourlyData = Array.from({ length: 24 }, (_, hour) => {
          const hourSessions = sessions.filter(session => {
            const sessionHour = new Date(session.start_time).getHours();
            return sessionHour === hour;
          });

          // Separate guest and registered sessions
          const guestSessions = hourSessions.filter(session => {
            const player = playersMap.get(session.player_id);
            return player?.is_guest === true;
          });
          
          const registeredSessions = hourSessions.filter(session => {
            const player = playersMap.get(session.player_id);
            return player?.is_guest !== true;
          });

          return {
            hour: hour === 0 ? "12 AM" : 
                  hour < 12 ? `${hour} AM` : 
                  hour === 12 ? "12 PM" : 
                  `${hour - 12} PM`,
            hourNumber: hour,
            totalSessions: hourSessions.length,
            guestSessions: guestSessions.length,
            registeredSessions: registeredSessions.length
          };
        });

        setChartData(hourlyData);
      } catch (error) {
        console.error("Error loading hourly data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHourlyData();
  }, [municipality, dateRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">Registered Users: {data.registeredSessions}</p>
          <p className="text-emerald-600">Guest Players: {data.guestSessions}</p>
          <p className="font-medium">Total Check-ins: {data.totalSessions}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hourly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity by Hour of Day</CardTitle>
        <p className="text-sm text-gray-600">Court check-ins throughout the day, by user type</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour"
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="registeredSessions" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Registered Users"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="guestSessions" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Guest Players"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="totalSessions" 
                stroke="#6b7280" 
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Total Check-ins"
                dot={{ fill: '#6b7280', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
