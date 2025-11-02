import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, TrendingUp, TrendingDown, Minus, Star } from "lucide-react";

export default function LadderStandings({ participants, players, currentPlayer, tournamentType }) {
  const getPositionIcon = (position) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold">#{position}</span>;
  };

  const getPositionChange = (participant) => {
    const change = participant.initial_position - participant.current_position;
    if (change > 0) return { icon: TrendingUp, color: "text-green-600", text: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: "text-red-600", text: change };
    return { icon: Minus, color: "text-gray-400", text: "0" };
  };

  const getWinPercentage = (participant) => {
    const totalGames = participant.wins + participant.losses;
    if (totalGames === 0) return 0;
    return Math.round((participant.wins / totalGames) * 100);
  };

  // Safe check for tournamentType
  const isPointsRobin = tournamentType === 'points_robin';

  const renderPositionalParticipant = (participant, index) => {
    const player = players[participant.player_id];
    const isCurrentUser = participant.player_id === currentPlayer?.id;
    const positionChange = getPositionChange(participant);
    const ChangeIcon = positionChange.icon;
    
    return (
      <div
        key={participant.id}
        className={`flex items-center gap-4 p-4 rounded-lg border ${
          isCurrentUser 
            ? "border-emerald-200 bg-emerald-50" 
            : "border-gray-200 bg-white"
        }`}
      >
        {/* Position */}
        <div className="flex items-center gap-2">
          {getPositionIcon(participant.current_position)}
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isCurrentUser ? "text-emerald-900" : "text-gray-900"}`}>
              {player?.display_name || "Unknown Player"}
            </span>
            {isCurrentUser && (
              <Badge className="bg-emerald-100 text-emerald-800">You</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
            <span>{participant.wins || 0}W - {participant.losses || 0}L</span>
            <span>{getWinPercentage(participant)}% win rate</span>
            {player?.ntrp_rating && (
              <span>NTRP {player.ntrp_rating}</span>
            )}
          </div>
        </div>

        {/* Position Change */}
        <div className={`flex items-center gap-1 ${positionChange.color}`}>
          <ChangeIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{positionChange.text}</span>
        </div>
      </div>
    );
  };
  
  const renderPointsParticipant = (participant, index) => {
    const player = players[participant.player_id];
    const isCurrentUser = participant.player_id === currentPlayer?.id;
    
    return (
      <div
        key={participant.id}
        className={`flex items-center gap-4 p-4 rounded-lg border ${
          isCurrentUser 
            ? "border-emerald-200 bg-emerald-50" 
            : "border-gray-200 bg-white"
        }`}
      >
        {/* Rank */}
        <div className="flex items-center gap-2">
          {getPositionIcon(index + 1)}
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isCurrentUser ? "text-emerald-900" : "text-gray-900"}`}>
              {player?.display_name || "Unknown Player"}
            </span>
            {isCurrentUser && (
              <Badge className="bg-emerald-100 text-emerald-800">You</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
            <span>{participant.wins || 0}W - {participant.losses || 0}L</span>
            <span>{getWinPercentage(participant)}% win rate</span>
            {player?.ntrp_rating && (
              <span>NTRP {player.ntrp_rating}</span>
            )}
          </div>
        </div>

        {/* Points */}
        <div className="flex items-center gap-1 text-emerald-700">
          <Star className="w-4 h-4" />
          <span className="text-lg font-bold">{participant.points || 0}</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {isPointsRobin ? 'Points Standings' : 'Ladder Standings'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {participants.map((participant, index) => 
            isPointsRobin
              ? renderPointsParticipant(participant, index)
              : renderPositionalParticipant(participant, index)
          )}
        </div>

        {participants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No participants yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}