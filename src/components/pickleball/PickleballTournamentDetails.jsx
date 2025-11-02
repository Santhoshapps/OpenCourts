import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PickleballParticipant, PickleballMatch, Player } from "@/api/entities";
import { Calendar, MapPin, Users, Trophy, DollarSign, Clock, Star } from "lucide-react";
import { format } from "date-fns";

import PickleballScoreReport from "./PickleballScoreReport";
import PickleballStandings from "./PickleballStandings";
import PickleballSchedule from "./PickleballSchedule";

export default function PickleballTournamentDetails({ 
  tournament, 
  formatInfo, 
  onClose, 
  onJoin, 
  currentPlayer 
}) {
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showScoreReport, setShowScoreReport] = useState(null);

  useEffect(() => {
    if (tournament) {
      loadTournamentData();
    }
  }, [tournament]);

  const loadTournamentData = async () => {
    setIsLoading(true);
    try {
      const [participantsData, matchesData, allPlayers] = await Promise.all([
        PickleballParticipant.filter({ tournament_id: tournament.id }),
        PickleballMatch.filter({ tournament_id: tournament.id }),
        Player.list()
      ]);

      setParticipants(participantsData);
      setMatches(matchesData);

      // Create players lookup
      const playersMap = {};
      allPlayers.forEach(player => {
        playersMap[player.id] = player;
      });
      setPlayers(playersMap);
    } catch (error) {
      console.error("Error loading tournament data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => {
    if (!currentPlayer) {
      alert("Please make sure you're logged in to join tournaments.");
      return;
    }

    // Check if already joined
    const alreadyJoined = participants.some(p => p.player_id === currentPlayer.id);
    if (alreadyJoined) {
      alert("You're already registered for this tournament!");
      return;
    }

    // Check skill level compatibility
    const playerSkill = currentPlayer.ntrp_rating || 3.5;
    const tournamentSkill = parseFloat(tournament.skill_level);
    if (Math.abs(playerSkill - tournamentSkill) > 0.5) {
      const confirmJoin = confirm(
        `This tournament is for ${tournament.skill_level} level players, but your rating is ${playerSkill}. ` +
        "You may find the competition too easy or too challenging. Do you still want to join?"
      );
      if (!confirmJoin) return;
    }

    // Different joining processes based on format
    if (tournament.format.includes('set_partner') && !tournament.format.includes('individual')) {
      // Need to select a partner
      alert("This format requires a partner. Partner selection feature coming soon!");
      return;
    }

    onJoin(tournament, {
      current_ranking: participants.length + 1
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registration': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canJoin = tournament.status === 'registration' && 
                 participants.length < tournament.max_participants &&
                 currentPlayer &&
                 !participants.some(p => p.player_id === currentPlayer.id);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{tournament.name}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getStatusColor(tournament.status)}>
                {tournament.status}
              </Badge>
              <Badge variant="outline">
                {formatInfo?.icon} {formatInfo?.name}
              </Badge>
              <Badge variant="outline">
                <Star className="w-3 h-3 mr-1" />
                {tournament.skill_level} Level
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {canJoin && (
              <Button onClick={handleJoin} className="bg-teal-600 hover:bg-teal-700">
                Join Tournament
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Tournament Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-gray-600" />
            <div className="font-semibold">{participants.length}/{tournament.max_participants}</div>
            <div className="text-xs text-gray-600">Participants</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-gray-600" />
            <div className="font-semibold">
              {format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'd')}
            </div>
            <div className="text-xs text-gray-600">Duration</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-gray-600" />
            <div className="font-semibold">{tournament.city}, {tournament.state}</div>
            <div className="text-xs text-gray-600">Location</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-gray-600" />
            <div className="font-semibold">
              {tournament.entry_fee > 0 ? `$${tournament.entry_fee}` : 'Free'}
            </div>
            <div className="text-xs text-gray-600">Entry Fee</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Format Description */}
            <div>
              <h3 className="font-semibold mb-2">Tournament Format</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <strong>{formatInfo?.name}:</strong> {formatInfo?.description}
                </p>
              </div>
            </div>

            {/* Description */}
            {tournament.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{tournament.description}</p>
              </div>
            )}

            {/* Tournament Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Tournament Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions per week:</span>
                    <span>{tournament.sessions_per_week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{tournament.duration_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Games per match:</span>
                    <span>{tournament.games_per_match}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tournament Type:</span>
                    <span>{formatInfo?.name}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Prizes</h3>
                {tournament.prize_structure ? (
                  <p className="text-sm text-gray-600">{tournament.prize_structure}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No prizes specified</p>
                )}
              </div>
            </div>

            {/* Rules */}
            {tournament.rules && (
              <div>
                <h3 className="font-semibold mb-2">Tournament Rules</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
                    {tournament.rules}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  Participants ({participants.length}/{tournament.max_participants})
                </h3>
                {tournament.status === 'registration' && (
                  <Badge variant="outline">Registration Open</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((participant) => {
                  const player = players[participant.player_id];
                  return (
                    <Card key={participant.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-teal-800">
                            {player?.display_name?.[0] || '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{player?.display_name || 'Unknown'}</div>
                          {player?.ntrp_rating && (
                            <div className="text-xs text-gray-600">
                              {player.ntrp_rating} NTRP
                            </div>
                          )}
                        </div>
                        {participant.current_ranking && (
                          <Badge variant="outline" className="text-xs">
                            #{participant.current_ranking}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {participants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No participants yet. Be the first to join!
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="standings" className="mt-6">
            <PickleballStandings 
              tournament={tournament}
              participants={participants}
              matches={matches}
              players={players}
            />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <PickleballSchedule 
              tournament={tournament}
              matches={matches}
              players={players}
              onScoreReport={setShowScoreReport}
              currentPlayer={currentPlayer}
            />
          </TabsContent>
        </Tabs>

        {/* Score Report Modal */}
        {showScoreReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <PickleballScoreReport
                match={showScoreReport}
                tournament={tournament}
                players={players}
                onClose={() => setShowScoreReport(null)}
                onScoreSubmitted={loadTournamentData}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}