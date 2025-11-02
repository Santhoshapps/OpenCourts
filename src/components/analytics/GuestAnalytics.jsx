import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourtSession, Player, Court } from "@/api/entities";
import { Users, UserCheck, Clock, MapPin, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { format, parseISO, differenceInDays } from "date-fns";

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function GuestAnalytics({ municipality, dateRange }) {
  const [guestMetrics, setGuestMetrics] = useState({
    totalGuestSessions: 0,
    uniqueGuestPlayers: 0,
    guestSessionPercentage: 0,
    averageGuestSessionLength: 0,
    mostPopularGuestCourts: [],
    guestActivityByHour: [],
    guestActivityByDay: [],
    guestRetentionData: [],
    guestVsRegisteredDaily: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGuestAnalytics = async () => {
      setIsLoading(true);
      try {
        // Get courts for this municipality
        const courts = await Court.filter(municipality ? { municipality_id: municipality.id } : {});
        const courtIds = courts.map(c => c.id);
        const courtsMap = new Map(courts.map(c => [c.id, c]));

        // Get all sessions
        const allSessions = await CourtSession.list();
        const filteredSessions = allSessions.filter(session => {
          const sessionDate = new Date(session.start_time);
          const isInDateRange = sessionDate >= new Date(dateRange.start) && sessionDate <= new Date(dateRange.end);
          const isInMunicipality = !municipality || courtIds.includes(session.court_id);
          return isInDateRange && isInMunicipality;
        });

        // Get all players
        const players = await Player.list();
        const playersMap = new Map(players.map(p => [p.id, p]));

        // Separate guest and registered sessions
        const guestSessions = filteredSessions.filter(session => {
          const player = playersMap.get(session.player_id);
          return player?.is_guest === true;
        });

        const registeredSessions = filteredSessions.filter(session => {
          const player = playersMap.get(session.player_id);
          return player?.is_guest !== true;
        });

        // Basic metrics
        const totalGuestSessions = guestSessions.length;
        const uniqueGuestPlayers = [...new Set(guestSessions.map(s => s.player_id))].length;
        const guestSessionPercentage = filteredSessions.length > 0 ? 
          Math.round((totalGuestSessions / filteredSessions.length) * 100) : 0;

        // Average session length for guests
        const completedGuestSessions = guestSessions.filter(s => s.actual_end_time);
        const totalGuestMinutes = completedGuestSessions.reduce((total, session) => {
          const start = new Date(session.start_time);
          const end = new Date(session.actual_end_time);
          return total + ((end - start) / (1000 * 60));
        }, 0);
        const averageGuestSessionLength = completedGuestSessions.length > 0 ? 
          Math.round(totalGuestMinutes / completedGuestSessions.length) : 0;

        // Most popular courts for guests
        const courtUsage = new Map();
        guestSessions.forEach(session => {
          const court = courtsMap.get(session.court_id);
          if (court) {
            const courtName = court.name;
            courtUsage.set(courtName, (courtUsage.get(courtName) || 0) + 1);
          }
        });
        
        const mostPopularGuestCourts = Array.from(courtUsage.entries())
          .map(([name, count]) => ({ name, sessions: count }))
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 5);

        // Guest activity by hour
        const guestActivityByHour = Array.from({ length: 24 }, (_, hour) => {
          const hourGuestSessions = guestSessions.filter(session => {
            return new Date(session.start_time).getHours() === hour;
          });

          return {
            hour: hour === 0 ? "12 AM" : 
                  hour < 12 ? `${hour} AM` : 
                  hour === 12 ? "12 PM" : 
                  `${hour - 12} PM`,
            guestSessions: hourGuestSessions.length
          };
        });

        // Guest activity by day of week
        const guestActivityByDay = Array.from({ length: 7 }, (_, dayIndex) => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayGuestSessions = guestSessions.filter(session => {
            return new Date(session.start_time).getDay() === dayIndex;
          });

          return {
            day: dayNames[dayIndex],
            guestSessions: dayGuestSessions.length
          };
        });

        // Guest retention analysis (return visits within timeframe)
        const guestPlayerSessions = new Map();
        guestSessions.forEach(session => {
          const playerId = session.player_id;
          if (!guestPlayerSessions.has(playerId)) {
            guestPlayerSessions.set(playerId, []);
          }
          guestPlayerSessions.get(playerId).push(new Date(session.start_time));
        });

        const returnGuests = Array.from(guestPlayerSessions.entries())
          .filter(([playerId, sessionDates]) => sessionDates.length > 1).length;

        const guestRetentionData = [
          { name: 'One-time Users', value: uniqueGuestPlayers - returnGuests, percentage: Math.round(((uniqueGuestPlayers - returnGuests) / uniqueGuestPlayers) * 100) },
          { name: 'Return Users', value: returnGuests, percentage: Math.round((returnGuests / uniqueGuestPlayers) * 100) }
        ];

        // Guest vs Registered daily comparison
        const dailyComparisonMap = new Map();
        
        // Process guest sessions
        guestSessions.forEach(session => {
          const date = format(new Date(session.start_time), 'yyyy-MM-dd');
          if (!dailyComparisonMap.has(date)) {
            dailyComparisonMap.set(date, {
              date,
              displayDate: format(new Date(session.start_time), 'MMM d'),
              guestSessions: 0,
              registeredSessions: 0
            });
          }
          dailyComparisonMap.get(date).guestSessions++;
        });

        // Process registered sessions
        registeredSessions.forEach(session => {
          const date = format(new Date(session.start_time), 'yyyy-MM-dd');
          if (!dailyComparisonMap.has(date)) {
            dailyComparisonMap.set(date, {
              date,
              displayDate: format(new Date(session.start_time), 'MMM d'),
              guestSessions: 0,
              registeredSessions: 0
            });
          }
          dailyComparisonMap.get(date).registeredSessions++;
        });

        const guestVsRegisteredDaily = Array.from(dailyComparisonMap.values())
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setGuestMetrics({
          totalGuestSessions,
          uniqueGuestPlayers,
          guestSessionPercentage,
          averageGuestSessionLength,
          mostPopularGuestCourts,
          guestActivityByHour,
          guestActivityByDay,
          guestRetentionData,
          guestVsRegisteredDaily
        });

      } catch (error) {
        console.error("Error loading guest analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGuestAnalytics();
  }, [municipality, dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guest Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {guestMetrics.totalGuestSessions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {guestMetrics.guestSessionPercentage}% of all sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {guestMetrics.uniqueGuestPlayers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Individual guest users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {guestMetrics.averageGuestSessionLength}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average guest play time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {guestMetrics.guestRetentionData.find(d => d.name === 'Return Users')?.percentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Guests who return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest vs Registered Daily Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Guest vs Registered Users (Daily)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={guestMetrics.guestVsRegisteredDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="guestSessions" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.7}
                  name="Guest Sessions"
                />
                <Area 
                  type="monotone" 
                  dataKey="registeredSessions" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.7}
                  name="Registered Sessions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Guest Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Guest User Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={guestMetrics.guestRetentionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {guestMetrics.guestRetentionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest Activity by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Activity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={guestMetrics.guestActivityByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="guestSessions" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Guest Activity by Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Activity by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={guestMetrics.guestActivityByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="guestSessions" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Courts for Guests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Most Popular Courts (Guests)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {guestMetrics.mostPopularGuestCourts.map((court, index) => (
              <div key={court.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{court.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">{court.sessions}</div>
                  <div className="text-xs text-gray-500">guest sessions</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}