
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourtSession, Court, Player } from "@/api/entities";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function UtilizationChart({ municipality, dateRange }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUtilizationData = async () => {
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
        // Filter for sessions that actually have a player_id to avoid unnecessary fetches or errors
        const sessionPlayerIds = sessions.map(s => s.player_id).filter(Boolean);
        const uniquePlayerIds = [...new Set(sessionPlayerIds)];
        let players = [];
        if (uniquePlayerIds.length > 0) {
            players = await Player.filter({ id: uniquePlayerIds }); // Assuming Player.filter can take an array of IDs
        } else {
            players = await Player.list(); // Fallback if no sessions or no specific player IDs to filter by
        }
        
        const playersMap = new Map(players.map(p => [p.id, p]));

        // Group sessions by court
        const courtUtilization = courts.map(court => {
          const courtSessions = sessions.filter(s => s.court_id === court.id);
          
          // Separate guest and registered sessions
          const guestSessions = courtSessions.filter(session => {
            const player = playersMap.get(session.player_id);
            return player?.is_guest === true;
          });
          
          const registeredSessions = courtSessions.filter(session => {
            const player = playersMap.get(session.player_id);
            return player?.is_guest !== true;
          });

          return {
            name: court.name.length > 20 ? court.name.substring(0, 20) + "..." : court.name,
            fullName: court.name,
            totalSessions: courtSessions.length,
            guestSessions: guestSessions.length,
            registeredSessions: registeredSessions.length,
            utilization: Math.round((courtSessions.length / (court.total_courts || 1)) * 10) / 10
          };
        });

        // Sort by total utilization
        courtUtilization.sort((a, b) => b.totalSessions - a.totalSessions);

        setChartData(courtUtilization);
      } catch (error) {
        console.error("Error loading utilization data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUtilizationData();
  }, [municipality, dateRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.fullName}</p>
          <p className="text-blue-600">Registered Users: {data.registeredSessions}</p>
          <p className="text-emerald-600">Guest Players: {data.guestSessions}</p>
          <p className="font-medium">Total Sessions: {data.totalSessions}</p>
          <p className="text-sm text-gray-600">Utilization: {data.utilization} sessions per court</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Court Utilization</CardTitle>
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
        <CardTitle>Court Utilization by User Type</CardTitle>
        <p className="text-sm text-gray-600">Check-ins per court, separated by registered users and guests</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="registeredSessions" 
                stackId="a"
                fill="#3b82f6" 
                name="Registered Users"
              />
              <Bar 
                dataKey="guestSessions" 
                stackId="a"
                fill="#10b981" 
                name="Guest Players"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
