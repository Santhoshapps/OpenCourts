import React from "react";
import { LadderMatch, LadderParticipant } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Clock, Trophy, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

import ScoreReport from "./ScoreReport";

export default function MatchHistory({ matches, players, currentPlayer, onRefresh, tournament }) {
  const [showScoreReport, setShowScoreReport] = React.useState(false);
  const [selectedMatch, setSelectedMatch] = React.useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "proposed":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const handleAcceptMatch = async (match) => {
    try {
      await LadderMatch.update(match.id, { 
        status: "accepted",
        confirmed_date: match.proposed_date
      });
      onRefresh();
      alert("Match accepted! You can now report the score after playing.");
    } catch (error) {
      console.error("Error accepting match:", error);
      alert("Failed to accept match. Please try again.");
    }
  };

  const handleRejectMatch = async (match) => {
    try {
      await LadderMatch.update(match.id, { status: "cancelled" });
      onRefresh();
    } catch (error) {
      console.error("Error rejecting match:", error);
      alert("Failed to reject match. Please try again.");
    }
  };

  const handleReportScore = (match) => {
    setSelectedMatch(match);
    setShowScoreReport(true);
  };

  const handleScoreSubmit = async (scoreData) => {
    if (!tournament) {
      alert("Tournament data is not available. Please refresh the page.");
      return;
    }

    try {
      // Update match with score
      await LadderMatch.update(selectedMatch.id, {
        status: "completed",
        winner_id: scoreData.winner_id,
        score: scoreData.score
      });

      if (tournament.tournament_type === 'points_robin') {
        // Points-based logic: Win=20pts, Loss=10pts
        const winnerParticipant = await LadderParticipant.filter({ 
          tournament_id: tournament.id, 
          player_id: scoreData.winner_id 
        });
        const loserId = scoreData.winner_id === selectedMatch.challenger_id 
          ? selectedMatch.opponent_id 
          : selectedMatch.challenger_id;
        const loserParticipant = await LadderParticipant.filter({ 
          tournament_id: tournament.id, 
          player_id: loserId 
        });

        if (winnerParticipant.length > 0) {
          await LadderParticipant.update(winnerParticipant[0].id, {
            points: (winnerParticipant[0].points || 0) + 20,
            wins: (winnerParticipant[0].wins || 0) + 1
          });
        }
        if (loserParticipant.length > 0) {
          await LadderParticipant.update(loserParticipant[0].id, {
            points: (loserParticipant[0].points || 0) + 10,
            losses: (loserParticipant[0].losses || 0) + 1
          });
        }

      } else {
        // Positional logic: Winner moves up, loser moves down or stays
        if (scoreData.winner_id === selectedMatch.challenger_id) {
          // Challenger won - they take opponent's position, opponent moves down
          const challengerParticipant = await LadderParticipant.filter({
            tournament_id: selectedMatch.tournament_id,
            player_id: selectedMatch.challenger_id
          });
          const opponentParticipant = await LadderParticipant.filter({
            tournament_id: selectedMatch.tournament_id,
            player_id: selectedMatch.opponent_id
          });

          if (challengerParticipant.length > 0 && opponentParticipant.length > 0) {
            const newChallengerPosition = selectedMatch.opponent_position_before;
            const newOpponentPosition = selectedMatch.challenger_position_before;

            await LadderParticipant.update(challengerParticipant[0].id, {
              current_position: newChallengerPosition,
              wins: (challengerParticipant[0].wins || 0) + 1
            });

            await LadderParticipant.update(opponentParticipant[0].id, {
              current_position: newOpponentPosition,
              losses: (opponentParticipant[0].losses || 0) + 1
            });
          }
        } else {
          // Opponent won - positions stay the same, just update win/loss records
          const challengerParticipant = await LadderParticipant.filter({
            tournament_id: selectedMatch.tournament_id,
            player_id: selectedMatch.challenger_id
          });
          const opponentParticipant = await LadderParticipant.filter({
            tournament_id: selectedMatch.tournament_id,
            player_id: selectedMatch.opponent_id
          });

          if (challengerParticipant.length > 0) {
            await LadderParticipant.update(challengerParticipant[0].id, {
              losses: (challengerParticipant[0].losses || 0) + 1
            });
          }

          if (opponentParticipant.length > 0) {
            await LadderParticipant.update(opponentParticipant[0].id, {
              wins: (opponentParticipant[0].wins || 0) + 1
            });
          }
        }
      }

      setShowScoreReport(false);
      setSelectedMatch(null);
      onRefresh();
      alert("Score reported successfully! Ladder positions have been updated.");
    } catch (error) {
      console.error("Error reporting score:", error);
      alert("Failed to report score. Please try again.");
    }
  };

  const sortedMatches = matches.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-4">
      {sortedMatches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-600">Propose a challenge to get started!</p>
          </CardContent>
        </Card>
      ) : (
        sortedMatches.map((match) => {
          const challenger = players[match.challenger_id];
          const opponent = players[match.opponent_id];
          const isUserInvolved = match.challenger_id === currentPlayer?.id || match.opponent_id === currentPlayer?.id;
          const canAccept = match.status === "proposed" && match.opponent_id === currentPlayer?.id;
          const canReportScore = match.status === "accepted" && isUserInvolved;
          
          return (
            <Card key={match.id} className={isUserInvolved ? "border-emerald-200 bg-emerald-50/30" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="font-semibold">{challenger?.display_name}</span>
                      <span className="text-gray-500"> vs </span>
                      <span className="font-semibold">{opponent?.display_name}</span>
                    </div>
                    <Badge className={getStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(match.proposed_date), "MMM d, h:mm a")}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {tournament?.tournament_type === 'positional' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Trophy className="w-4 h-4" />
                      <span>Position #{match.challenger_position_before} challenging #{match.opponent_position_before}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(match.proposed_date), "EEEE, MMMM d 'at' h:mm a")}</span>
                  </div>
                  
                  {match.court_id && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>Court selected</span>
                    </div>
                  )}
                </div>

                {match.status === "completed" && match.winner_id && (
                  <div className="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <Trophy className="w-4 h-4" />
                      <span className="font-semibold">
                        Winner: {players[match.winner_id]?.display_name}
                      </span>
                    </div>
                    {match.score && (
                      <div className="font-mono text-sm text-green-700 mt-1">
                        Score: {match.score}
                      </div>
                    )}
                  </div>
                )}

                {canAccept && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptMatch(match)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept Challenge
                    </Button>
                    <Button
                      onClick={() => handleRejectMatch(match)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}

                {canReportScore && (
                  <Button
                    onClick={() => handleReportScore(match)}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Trophy className="w-4 h-4 mr-1" />
                    Report Score
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Score Report Modal */}
      {showScoreReport && selectedMatch && (
        <ScoreReport
          match={selectedMatch}
          players={players}
          onSubmit={handleScoreSubmit}
          onCancel={() => {
            setShowScoreReport(false);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
}