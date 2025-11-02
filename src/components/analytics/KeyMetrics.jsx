
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourtSession, Player } from "@/api/entities";
import { Users, Clock, TrendingUp, UserCheck } from "lucide-react";

export default function KeyMetrics({ municipality, dateRange }) {
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    uniquePlayers: 0,
    guestSessions: 0,
    registeredSessions: 0,
    averageSessionLength: 0,
    totalPlayTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        // Get all court sessions for this municipality's courts
        const sessions = await CourtSession.list();
        
        // Filter sessions by date range and municipality
        const filteredSessions = sessions.filter(session => {
          const sessionDate = new Date(session.start_time);
          const isInDateRange = sessionDate >= new Date(dateRange.start) && sessionDate <= new Date(dateRange.end);
          
          // If we have municipality data, filter by it (you'd need to join with Court data)
          return isInDateRange;
        });

        // Get all players involved in these sessions
        const playerIds = [...new Set(filteredSessions.map(s => s.player_id))];
        const players = await Player.list();
        const playersMap = new Map(players.map(p => [p.id, p]));

        // Calculate metrics
        const totalSessions = filteredSessions.length;
        const uniquePlayers = playerIds.length;
        
        // Separate guest and registered user sessions
        const guestSessions = filteredSessions.filter(session => {
          const player = playersMap.get(session.player_id);
          return player?.is_guest === true;
        }).length;
        
        const registeredSessions = totalSessions - guestSessions;

        // Calculate average session length
        const completedSessions = filteredSessions.filter(s => s.actual_end_time);
        const totalMinutes = completedSessions.reduce((total, session) => {
          const start = new Date(session.start_time);
          const end = new Date(session.actual_end_time);
          return total + ((end - start) / (1000 * 60));
        }, 0);
        
        const averageSessionLength = completedSessions.length > 0 ? 
          Math.round(totalMinutes / completedSessions.length) : 0;
        
        const totalPlayTime = Math.round(totalMinutes / 60); // Convert to hours

        setMetrics({
          totalSessions,
          uniquePlayers,
          guestSessions,
          registeredSessions,
          averageSessionLength,
          totalPlayTime
        });
      } catch (error) {
        console.error("Error loading metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [municipality, dateRange]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalSessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            All court check-ins
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Players</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.uniquePlayers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total active players
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Guest Check-ins</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{metrics.guestSessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalSessions > 0 ? Math.round((metrics.guestSessions / metrics.totalSessions) * 100) : 0}% of total sessions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{metrics.registeredSessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalSessions > 0 ? Math.round((metrics.registeredSessions / metrics.totalSessions) * 100) : 0}% of total sessions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageSessionLength}</div>
          <p className="text-xs text-muted-foreground">
            minutes per session
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Play Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalPlayTime.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            hours played
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
