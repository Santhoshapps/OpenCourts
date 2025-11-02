import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Trophy } from "lucide-react";

export default function ScoreReport({ match, players, onSubmit, onCancel }) {
  const [scoreData, setScoreData] = useState({
    winner_id: "",
    score: ""
  });

  const challenger = players[match.challenger_id];
  const opponent = players[match.opponent_id];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!scoreData.winner_id || !scoreData.score) {
      alert("Please select a winner and enter the score.");
      return;
    }
    onSubmit(scoreData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" />
              Report Match Score
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Match Details</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{challenger?.display_name}</span>
              {" vs "}
              <span className="font-medium">{opponent?.display_name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(match.proposed_date).toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="winner">Match Winner</Label>
              <Select
                value={scoreData.winner_id}
                onValueChange={(value) => setScoreData({...scoreData, winner_id: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select the winner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match.challenger_id}>
                    {challenger?.display_name} (Challenger)
                  </SelectItem>
                  <SelectItem value={match.opponent_id}>
                    {opponent?.display_name} (Opponent)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Final Score</Label>
              <Input
                id="score"
                value={scoreData.score}
                onChange={(e) => setScoreData({...scoreData, score: e.target.value})}
                placeholder="e.g., 6-4, 6-2 or 6-3, 4-6, 6-1"
                required
              />
              <p className="text-xs text-gray-500">
                Enter the complete match score (e.g., "6-4, 6-2" for straight sets or "6-3, 4-6, 6-1" for three sets)
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Scoring Impact</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Points Tournament:</strong> Winner gets +20 points, Loser gets +10 points</p>
                <p>• <strong>Positional Tournament:</strong> Winner moves up in ranking, positions may swap</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Submit Score
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}