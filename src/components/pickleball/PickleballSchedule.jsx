import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Edit } from "lucide-react";
import { format } from "date-fns";

export default function PickleballSchedule({ tournament, matches, players, onScoreReport, currentPlayer }) {
  const [filter, setFilter] = useState('all'); // all, scheduled, completed

  const filteredMatches = matches.filter(match => {
    switch (filter) {
      case 'scheduled': return match.status !== 'completed';
      case 'completed': return match.status === 'completed';
      default: return true;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canReportScore = (match) => {
    if (!currentPlayer || match.status === 'completed') return false;
    
    return match.team1_player1_id === currentPlayer.id ||
           match.team1_player2_id === currentPlayer.id ||
           match.team2_player1_id === currentPlayer.id ||
           match.team2_player2_id === currentPlayer.id;
  };

  const getPlayerName = (playerId) => {
    return players[playerId]?.display_name || 'Unknown';
  };

  const getTeamDisplay = (player1Id, player2Id) => {
    const player1 = getPlayerName(player1Id);
    const player2 = player2Id ? getPlayerName(player2Id) : null;
    
    if (player2) {
      return `${player1} / ${player2}`;
    }
    return player1;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Match Schedule
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('scheduled')}
            >
              Scheduled
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMatches.length > 0 ? (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div key={match.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {match.round_number && (
                      <div className="text-xs text-gray-500 mb-1">
                        Round {match.round_number}
                      </div>
                    )}
                    <div className="font-medium mb-2">
                      <span className="text-teal-700">
                        {getTeamDisplay(match.team1_player1_id, match.team1_player2_id)}
                      </span>
                      <span className="mx-2 text-gray-400">vs</span>
                      <span className="text-blue-700">
                        {getTeamDisplay(match.team2_player1_id, match.team2_player2_id)}
                      </span>
                    </div>
                    
                    {match.session_date && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(match.session_date), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(match.session_date), 'h:mm a')}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                    {canReportScore(match) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onScoreReport(match)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {match.status === 'completed' ? 'Edit Score' : 'Report Score'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Score Display */}
                {match.status === 'completed' && (match.team1_score || match.team2_score) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-center font-medium">
                      <span className={match.winner_team === 1 ? 'text-green-600 font-bold' : ''}>
                        {match.team1_score || 0}
                      </span>
                      <span className="mx-3 text-gray-400">-</span>
                      <span className={match.winner_team === 2 ? 'text-green-600 font-bold' : ''}>
                        {match.team2_score || 0}
                      </span>
                    </div>
                    
                    {match.game_scores && match.game_scores.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 text-center">
                        Game Scores: {match.game_scores.map(game => 
                          `${game.team1_score}-${game.team2_score}`
                        ).join(', ')}
                      </div>
                    )}

                    {match.winner_team && (
                      <div className="mt-2 text-sm text-center text-green-700 font-medium">
                        Winner: {match.winner_team === 1 
                          ? getTeamDisplay(match.team1_player1_id, match.team1_player2_id)
                          : getTeamDisplay(match.team2_player1_id, match.team2_player2_id)
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {filter === 'all' ? 'No matches scheduled yet.' :
             filter === 'scheduled' ? 'No upcoming matches.' :
             'No completed matches yet.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}