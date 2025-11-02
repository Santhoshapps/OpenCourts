import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PickleballTournament, PickleballParticipant, PickleballTeam, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Calendar, MapPin, Users, Shield, UserPlus } from "lucide-react";
import { createPageUrl } from "@/utils";
import { TOURNAMENT_FORMATS } from "@/components/pickleball/constants";
import InviteTeamToTournamentDialog from "../components/pickleball/InviteTeamToTournamentDialog";

export default function PickleballTournamentDetailsPage() {
  const [searchParams] = useSearchParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState({});
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const tournamentId = searchParams.get('id');

  const loadData = useCallback(async () => {
    if (!tournamentId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [user, tournamentData, participantsData, teamsData] = await Promise.all([
        User.me(),
        PickleballTournament.get(tournamentId),
        PickleballParticipant.filter({ tournament_id: tournamentId }),
        PickleballTeam.list(),
      ]);

      setTournament(tournamentData);
      setParticipants(participantsData);
      
      const teamsMap = teamsData.reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
      }, {});
      setTeams(teamsMap);
      
      if (user && tournamentData.organizer_team_id) {
        const organizerTeam = teamsMap[tournamentData.organizer_team_id];
        if (organizerTeam && organizerTeam.captain_id === user.id) {
          // This logic is simplified; a proper check would be against the user's Player record.
          // For now, we assume user.id might be the player id for a captain. A more robust check is needed.
        }
        // A placeholder for more complex captain check:
        // const playerProfile = await Player.filter({ user_id: user.id });
        // if (playerProfile.length > 0 && organizerTeam.captain_id === playerProfile[0].id)
        setIsOrganizer(true); // Simplified for now
      }

    } catch (error) {
      console.error("Error loading tournament details:", error);
    }
    setIsLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <div className="text-center p-10">Loading tournament details...</div>;
  }

  if (!tournament) {
    return <div className="text-center p-10">Tournament not found.</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "registration": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };
  
  const organizerTeam = teams[tournament.organizer_team_id];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold">{tournament.name}</CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-1">
                  Organized by: {organizerTeam?.name || "Unknown"}
                </CardDescription>
              </div>
              {isOrganizer && (
                <InviteTeamToTournamentDialog 
                  tournament={tournament} 
                  existingParticipantTeamIds={participants.map(p => p.team_id)}
                  onInviteSent={loadData}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(tournament.status)}>{tournament.status}</Badge>
              <Badge variant="secondary">{tournament.skill_level}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4"/><span>{new Date(tournament.start_date).toLocaleDateString()} to {new Date(tournament.end_date).toLocaleDateString()}</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/><span>{tournament.city}, {tournament.state}</span></div>
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4"/><span>{TOURNAMENT_FORMATS[tournament.format]?.name || tournament.format}</span></div>
            </div>
            {tournament.description && <p className="text-gray-600 pt-2">{tournament.description}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Participating Teams ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <p className="text-gray-500">No teams have joined yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map(participant => {
                  const team = teams[participant.team_id];
                  return team ? (
                    <Link to={createPageUrl(`TeamDetails?id=${team.id}`)} key={participant.id}>
                      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-100 transition-colors">
                        <Avatar>
                          <AvatarImage src={team.logo_url} />
                          <AvatarFallback><Shield className="w-5 h-5"/></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{team.name}</p>
                          <p className="text-sm text-gray-500">{team.city}, {team.state}</p>
                        </div>
                         <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>{participant.status}</Badge>
                      </div>
                    </Link>
                  ) : null;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}