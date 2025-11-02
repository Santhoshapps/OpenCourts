import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PickleballMatch } from "@/api/entities";
import { Trophy, Plus, Minus } from "lucide-react";

export default function PickleballScoreReport({ match, tournament, players, onClose, onScoreSubmitted }) {
  const [gameScores, setGameScores] = useState(
    match.game_scores?.length > 0 
      ? match.game_scores 
      : Array(tournament.games_per_match || 2).fill().map((_, i) => ({
          game_number: i + 1,
          team1_score: 0,
          team2_score: 0
        }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const updateGameScore = (gameIndex, team, score) => {
    const newGameScores = [...gameScores];
    newGameScores[gameIndex][`team${team}_score`] = Math.max(0, score);
    setGameScores(newGameScores);
  };

  const addGame = () => {
    setGameScores([...gameScores, {
      game_number: gameScores.length + 1,
      team1_score: 0,
      team2_score: 0
    }]);
  };

  const removeGame = (gameIndex) => {
    if (gameScores.length > 1) {
      const newGameScores = gameScores.filter((_, index) => index !== gameIndex);
      // Renumber games
      newGameScores.forEach((game, index) => {
        game.game_number = index + 1;
      });
      setGameScores(newGameScores);
    }
  };

  const calculateMatchResult = () => {
    let team1Wins = 0;
    let team2Wins = 0;
    let team1TotalPoints = 0;
    let team2TotalPoints = 0;

    gameScores.forEach(game => {
      team1TotalPoints += game.team1_score;
      team2TotalPoints += game.team2_score;
      
      if (game.team1_score > game.team2_score) {
        team1Wins++;
      } else if (game.team2_score > game.team1_score) {
        team2Wins++;
      }
    });

    const winnerTeam = team1Wins > team2Wins ? 1 : (team2Wins > team1Wins ? 2 : null);

    return {
      team1Wins,
      team2Wins,
      team1TotalPoints,
      team2TotalPoints,
      winnerTeam
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = calculateMatchResult();
      
      // Validate that at least one game has a score
      const hasValidScores = gameScores.some(game => 
        game.team1_score > 0 || game.team2_score > 0
      );

      if (!hasValidScores) {
        alert("Please enter scores for at least one game.");
        setIsSubmitting(false);
        return;
      }

      await PickleballMatch.update(match.id, {
        team1_score: result.team1Wins,
        team2_score: result.team2Wins,
        game_scores: gameScores,
        status: 'completed',
        winner_team: result.winnerTeam,
        confirmed: false // Will need confirmation from other players
      });

      alert("Score reported successfully! Other players will be notified to confirm.");
      onScoreSubmitted();
      onClose();
    } catch (error) {
      console.error("Error reporting score:", error);
      alert("Failed to report score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const result = calculateMatchResult();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Report Match Score
        </CardTitle>
        <div className="text-center py-2">
          <div className="font-medium">
            <span className="text-teal-700">
              {getTeamDisplay(match.team1_player1_id, match.team1_player2_id)}
            </span>
            <span className="mx-3 text-gray-400">vs</span>
            <span className="text-blue-700">
              {getTeamDisplay(match.team2_player1_id, match.team2_player2_id)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Scores */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Game Scores</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGame}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Game
              </Button>
            </div>

            {gameScores.map((game, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Game {game.game_number}</Label>
                  {gameScores.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGame(index)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Label className="text-xs text-teal-700 mb-2 block">
                      {getTeamDisplay(match.team1_player1_id, match.team1_player2_id)}
                    </Label>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateGameScore(index, 1, game.team1_score - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={game.team1_score}
                        onChange={(e) => updateGameScore(index, 1, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateGameScore(index, 1, game.team1_score + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <Label className="text-xs text-blue-700 mb-2 block">
                      {getTeamDisplay(match.team2_player1_id, match.team2_player2_id)}
                    </Label>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateGameScore(index, 2, game.team2_score - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={game.team2_score}
                        onChange={(e) => updateGameScore(index, 2, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateGameScore(index, 2, game.team2_score + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Match Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Match Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-teal-700">{result.team1Wins}</div>
                <div className="text-xs text-gray-600">Games Won</div>
                <div className="text-sm text-gray-600 mt-1">
                  {result.team1TotalPoints} total points
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">{result.team2Wins}</div>
                <div className="text-xs text-gray-600">Games Won</div>
                <div className="text-sm text-gray-600 mt-1">
                  {result.team2TotalPoints} total points
                </div>
              </div>
            </div>
            
            {result.winnerTeam && (
              <div className="mt-3 text-center">
                <div className="text-sm text-green-700 font-medium">
                  Winner: {result.winnerTeam === 1 
                    ? getTeamDisplay(match.team1_player1_id, match.team1_player2_id)
                    : getTeamDisplay(match.team2_player1_id, match.team2_player2_id)
                  }
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Reporting Score...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Report Score
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}