
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourtSession, Court, Player } from "@/api/entities";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

export default function DailyActivityChart({ municipality, dateRange }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDailyData = async () => {
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
        // Using Set to get unique player_ids from sessions
        const playerIds = [...new Set(sessions.map(s => s.player_id))];
        const players = await Player.list(); // Assuming Player.list() fetches all players
        const playersMap = new Map(players.map(p => [p.id, p]));

        // Group sessions by day
        const dailySessionsMap = new Map();
        
        sessions.forEach(session => {
          const date = format(new Date(session.start_time), 'yyyy-MM-dd');
          const player = playersMap.get(session.player_id);
          const isGuest = player?.is_guest === true;
          
          if (!dailySessionsMap.has(date)) {
            dailySessionsMap.set(date, {
              date,
              displayDate: format(new Date(session.start_time), 'MMM d'),
              totalSessions: 0,
              guestSessions: 0,
              registeredSessions: 0
            });
          }
          
          const dayData = dailySessionsMap.get(date);
          dayData.totalSessions++;
          
          if (isGuest) {
            dayData.guestSessions++;
          } else {
            dayData.registeredSessions++;
          }
        });

        // Convert to array and sort by date
        const dailyData = Array.from(dailySessionsMap.values())
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setChartData(dailyData);
      } catch (error) {
        console.error("Error loading daily data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyData();
  }, [municipality, dateRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.displayDate}</p>
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
          <CardTitle>Daily Activity</CardTitle>
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
        <CardTitle>Daily Activity Trends</CardTitle>
        <p className="text-sm text-gray-600">Court check-ins over time, showing guest vs registered user activity</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayDate"
                fontSize={11}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="registeredSessions"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Registered Users"
              />
              <Area
                type="monotone"
                dataKey="guestSessions"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Guest Players"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
