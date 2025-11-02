import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send, Calendar, Users, Clock, MapPin } from "lucide-react";

export default function MatchRequest({ player, onSend, onCancel }) {
  const [matchData, setMatchData] = useState({
    matchType: "singles",
    scheduledTime: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend({
      ...matchData,
      scheduledTime: new Date(matchData.scheduledTime).toISOString()
    });
  };

  const getSkillLevel = () => {
    if (player.ntrp_rating) {
      return `NTRP ${player.ntrp_rating}`;
    }
    if (player.utr_rating) {
      return `UTR ${player.utr_rating}`;
    }
    return "Not rated";
  };

  // Get minimum date/time (1 hour from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Match Request
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Player Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {player.display_name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{player.display_name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getSkillLevel()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {player.preferred_play_style}
                </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Match Type */}
            <div>
              <Label htmlFor="matchType">Match Type</Label>
              <Select
                value={matchData.matchType}
                onValueChange={(value) => setMatchData({...matchData, matchType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Singles</SelectItem>
                  <SelectItem value="doubles_seeking_pair">Doubles (need 2 more)</SelectItem>
                  <SelectItem value="doubles_complete">Doubles (have partners)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled Time */}
            <div>
              <Label htmlFor="scheduledTime">Preferred Date & Time</Label>
              <div className="space-y-2">
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={matchData.scheduledTime}
                  onChange={(e) => setMatchData({...matchData, scheduledTime: e.target.value})}
                  min={getMinDateTime()}
                  max={getMaxDate()}
                  required
                />
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Must be at least 1 hour from now</span>
                </div>
              </div>
            </div>

            {/* AI Court Suggestion Notice */}
            {matchData.scheduledTime && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800 text-sm">AI Court Assistant</span>
                </div>
                <p className="text-xs text-blue-700">
                  Our AI will suggest available courts 30 minutes before your match time and help you book one automatically.
                </p>
              </div>
            )}

            {/* Message */}
            <div>
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Hi! Would you like to play tennis together?"
                value={matchData.message}
                onChange={(e) => setMatchData({...matchData, message: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}