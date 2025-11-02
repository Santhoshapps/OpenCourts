import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PickleballTournament, PickleballTeam } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, MapPin, Users, Plus } from "lucide-react";
import { createPageUrl } from "@/utils";
import { TOURNAMENT_FORMATS } from "@/components/pickleball/constants";

export default function PickleballTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [organizerTeams, setOrganizerTeams] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setIsLoading(true);
    try {
      const [tournamentsData, teamsData] = await Promise.all([
        PickleballTournament.list("-start_date"),
        PickleballTeam.list()
      ]);

      setTournaments(tournamentsData.filter(t => t.participant_type === 'team'));

      const teamsMap = teamsData.reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
      }, {});
      setOrganizerTeams(teamsMap);
    } catch (error) {
      console.error("Error loading tournaments:", error);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "registration": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Tournaments</h1>
            <p className="text-gray-600">Find and join pickleball tournaments for teams.</p>
          </div>
          {/* Note: Tournament creation is handled from the Team Details page for a specific team */}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-6 bg-gray-200 rounded w-3/4"></div></CardHeader>
                <CardContent><div className="h-4 bg-gray-200 rounded w-full mb-2"></div><div className="h-4 bg-gray-200 rounded w-1/2"></div></CardContent>
              </Card>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">No Team Tournaments Found</h3>
            <p className="text-gray-500 mt-2">Check back later or create a tournament with your team!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map(tournament => (
              <Card key={tournament.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div>
                  <CardHeader>
                    <CardTitle className="truncate">{tournament.name}</CardTitle>
                    <p className="text-sm text-gray-500">Organized by: {organizerTeams[tournament.organizer_team_id]?.name || 'Unknown'}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className={getStatusColor(tournament.status)}>{tournament.status}</Badge>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500"/><span>{new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500"/><span>{tournament.city}, {tournament.state}</span></div>
                      <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gray-500"/><span>{TOURNAMENT_FORMATS[tournament.format]?.name || 'Custom Format'}</span></div>
                    </div>
                  </CardContent>
                </div>
                <CardFooter>
                  <Link to={createPageUrl(`PickleballTournamentDetails?id=${tournament.id}`)} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}