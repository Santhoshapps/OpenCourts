import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

export default function PickleballStandings({ tournament, participants, matches, players }) {
  // Calculate standings based on tournament format
  const calculateStandings = () => {
    const standings = participants.map(participant => {
      const player = players[participant.player_id];
      
      // Calculate stats from matches
      const playerMatches = matches.filter(match => 
        match.team1_player1_id === participant.player_id ||
        match.team1_player2_id === participant.player_id ||
        match.team2_player1_id === participant.player_id ||
        match.team2_player2_id === participant.player_id
      );

      let wins = 0;
      let losses = 0;
      let pointsFor = 0;
      let pointsAgainst = 0;

      playerMatches.forEach(match => {
        if (match.status === 'completed') {
          const isTeam1 = match.team1_player1_id === participant.player_id || 
                          match.team1_player2_id === participant.player_id;
          
          if (isTeam1) {
            pointsFor += match.team1_score || 0;
            pointsAgainst += match.team2_score || 0;
            if (match.winner_team === 1) wins++;
            else losses++;
          } else {
            pointsFor += match.team2_score || 0;
            pointsAgainst += match.team1_score || 0;
            if (match.winner_team === 2) wins++;
            else losses++;
          }
        }
      });

      const winPercentage = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
      const pointDifferential = pointsFor - pointsAgainst;

      return {
        ...participant,
        player,
        wins,
        losses,
        pointsFor,
        pointsAgainst,
        winPercentage,
        pointDifferential,
        matchesPlayed: wins + losses
      };
    });

    // Sort by win percentage, then by point differential
    return standings.sort((a, b) => {
      if (a.winPercentage !== b.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.pointDifferential - a.pointDifferential;
    });
  };

  const standings = calculateStandings();

  const getRankIcon = (position) => {
    switch (position) {
      case 1: return <Trophy className="w-4 h-4 text-yellow-600" />;
      case 2: return <Medal className="w-4 h-4 text-gray-400" />;
      case 3: return <Award className="w-4 h-4 text-amber-600" />;
      default: return <span className="w-4 h-4 flex items-center justify-center text-xs font-medium">#{position}</span>;
    }
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1: return "bg-yellow-50 border-yellow-200";
      case 2: return "bg-gray-50 border-gray-200";
      case 3: return "bg-amber-50 border-amber-200";
      default: return "bg-white border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Current Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {standings.length > 0 ? (
          <div className="space-y-3">
            {standings.map((standing, index) => {
              const position = index + 1;
              return (
                <div
                  key={standing.id}
                  className={`p-4 border rounded-lg ${getRankColor(position)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRankIcon(position)}
                      <div>
                        <div className="font-medium">
                          {standing.player?.display_name || 'Unknown Player'}
                        </div>
                        {standing.player?.ntrp_rating && (
                          <div className="text-xs text-gray-600">
                            {standing.player.ntrp_rating} NTRP
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{standing.wins}-{standing.losses}</div>
                        <div className="text-xs text-gray-600">W-L</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {standing.winPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Win %</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                        </div>
                        <div className="text-xs text-gray-600">+/-</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{standing.pointsFor}</div>
                        <div className="text-xs text-gray-600">Points</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No standings available yet. Matches need to be completed to generate standings.
          </div>
        )}

        {tournament.status === 'completed' && standings.length > 0 && (
          <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="font-semibold text-teal-800 mb-2">🏆 Tournament Complete!</h3>
            <p className="text-teal-700">
              Congratulations to <strong>{standings[0]?.player?.display_name}</strong> for winning the tournament!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}