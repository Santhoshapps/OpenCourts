
import React, { useState, useEffect } from "react";
import { Court, FavoriteCourt } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { X, Swords, Calendar, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function MatchProposal({ 
  tournament, 
  participants, 
  players, 
  currentPlayer, 
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    opponent_id: "",
    proposed_date: "",
    proposed_court_ids: [],
  });
  const [courts, setCourts] = useState([]);
  const [favoriteCourts, setFavoriteCourts] = useState([]);
  const [courtsLoading, setCourtsLoading] = useState(true);
  const [courtsError, setCourtsError] = useState(null);

  useEffect(() => {
    loadCourts();
    if (currentPlayer) {
      loadFavoriteCourts();
    }
  }, [currentPlayer]);

  const loadCourts = async () => {
    setCourtsLoading(true);
    setCourtsError(null);
    try {
      const courtsData = await Court.list();
      setCourts(courtsData);
    } catch (error) {
      console.error("Error loading courts:", error);
      setCourtsError("Unable to load courts. You can still propose a match without selecting a specific court.");
    } finally {
      setCourtsLoading(false);
    }
  };

  const loadFavoriteCourts = async () => {
    try {
      const favs = await FavoriteCourt.filter({ player_id: currentPlayer.id });
      setFavoriteCourts(favs);
    } catch (error) {
      console.error("Error loading favorite courts:", error);
      // Don't show error for favorites, it's not critical
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      proposed_date: new Date(formData.proposed_date).toISOString()
    });
  };

  const handleCourtSelection = (courtId) => {
    setFormData((prev) => {
      const newCourtIds = prev.proposed_court_ids.includes(courtId)
        ? prev.proposed_court_ids.filter((id) => id !== courtId)
        : [...prev.proposed_court_ids, courtId];
      return { ...prev, proposed_court_ids: newCourtIds };
    });
  };

  const getCourtName = (courtId) => {
    const court = courts.find(c => c.id === courtId);
    return court ? court.name : 'Unknown Court';
  };

  // Get challengeable opponents
  const currentUserParticipant = participants.find(p => p.player_id === currentPlayer.id);
  
  let challengeableOpponents = [];
  if (tournament?.tournament_type === 'points_robin') {
    // In round robin, you can challenge anyone else
    challengeableOpponents = participants.filter(p => p.player_id !== currentPlayer.id);
  } else {
    // In positional, you can challenge up to 3 positions above
    challengeableOpponents = participants.filter(p => {
      if (!currentUserParticipant || p.player_id === currentPlayer.id) return false;
      const positionDiff = currentUserParticipant.current_position - p.current_position;
      return positionDiff > 0 && positionDiff <= 3;
    });
  }

  // Get minimum date/time (1 hour from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const favoriteCourtIds = favoriteCourts.map(fav => fav.court_id);
  const favoriteCourtsList = courts.filter(court => favoriteCourtIds.includes(court.id));
  const otherCourtsList = courts.filter(court => !favoriteCourtIds.includes(court.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-emerald-600" />
              Propose Challenge
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="opponent">Challenge Opponent</Label>
              {/* Opponent Select */}
              <select
                id="opponent"
                className="w-full p-2 border rounded"
                value={formData.opponent_id}
                onChange={(e) => setFormData({...formData, opponent_id: e.target.value})}
                required
              >
                <option value="" disabled>Select opponent to challenge</option>
                {challengeableOpponents.map((participant) => {
                  const player = players[participant.player_id];
                  return (
                    <option key={participant.id} value={participant.player_id}>
                      {tournament?.tournament_type === 'points_robin'
                       ? `${player?.display_name || "Unknown"} (${participant.points || 0} pts)`
                       : `#${participant.current_position} - ${player?.display_name || "Unknown"}`}
                    </option>
                  );
                })}
              </select>
              {tournament?.tournament_type !== 'points_robin' && challengeableOpponents.length > 0 && (
                <p className="text-xs text-gray-500">
                  You can challenge players up to 3 positions above you
                </p>
              )}
              {challengeableOpponents.length === 0 && (
                <p className="text-xs text-yellow-600">
                  {tournament?.tournament_type === 'points_robin' 
                    ? "No other players available to challenge" 
                    : "No players within challengeable range (up to 3 positions above)"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposed_date">Proposed Date & Time</Label>
              <Input
                id="proposed_date"
                type="datetime-local"
                value={formData.proposed_date}
                onChange={(e) => setFormData({...formData, proposed_date: e.target.value})}
                min={getMinDateTime()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="court">Preferred Courts (Optional)</Label>
              {courtsError && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {courtsError}
                  </AlertDescription>
                </Alert>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {formData.proposed_court_ids.length > 0
                      ? `${formData.proposed_court_ids.length} court(s) selected`
                      : "Select preferred courts"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto">
                  <DropdownMenuLabel>Select Courts</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {courtsLoading ? (
                     <DropdownMenuLabel className="text-center">Loading...</DropdownMenuLabel>
                  ) : (
                    <>
                      {favoriteCourtsList.length > 0 && (
                        <>
                          <DropdownMenuLabel>Favorite Courts</DropdownMenuLabel>
                          {favoriteCourtsList.map(court => (
                            <DropdownMenuCheckboxItem
                              key={court.id}
                              checked={formData.proposed_court_ids.includes(court.id)}
                              onSelect={(e) => e.preventDefault()}
                              onClick={() => handleCourtSelection(court.id)}
                            >
                              {court.name}
                            </DropdownMenuCheckboxItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {otherCourtsList.length > 0 && (
                        <>
                          <DropdownMenuLabel>Other Courts</DropdownMenuLabel>
                          {otherCourtsList.map(court => (
                             <DropdownMenuCheckboxItem
                              key={court.id}
                              checked={formData.proposed_court_ids.includes(court.id)}
                              onSelect={(e) => e.preventDefault()}
                              onClick={() => handleCourtSelection(court.id)}
                            >
                              {court.name}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex flex-wrap gap-1 pt-2">
                {formData.proposed_court_ids.map(id => (
                  <Badge key={id} variant="secondary">
                    {getCourtName(id)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                disabled={challengeableOpponents.length === 0}
              >
                Propose Challenge
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
