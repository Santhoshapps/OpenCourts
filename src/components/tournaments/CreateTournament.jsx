import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { LadderTournament, Court, Player } from "@/api/entities";
import { User } from "@/api/entities";
import { CalendarIcon, Trophy, Users, User as UserIcon, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function CreateTournament({ onTournamentCreated, onCancel }) {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [nearbyCourts, setNearbyCourts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport: "tennis",
    tournament_format: "singles",
    ntrp_level: 3.5,
    max_participants: 16,
    tournament_type: "positional",
    start_date: null,
    end_date: null,
    city: "",
    state: "",
    entry_fee: 0,
    prize_structure: "",
    rules: "",
    court_preferences: []
  });

  useEffect(() => {
    loadCurrentPlayer();
    loadNearbyCourts();
  }, []);

  const loadCurrentPlayer = async () => {
    try {
      const user = await User.me();
      const players = await Player.filter({ user_id: user.id });
      if (players.length > 0) {
        setCurrentPlayer(players[0]);
      }
    } catch (error) {
      console.error("Error loading player:", error);
    }
  };

  const loadNearbyCourts = async () => {
    try {
      const courts = await Court.list();
      // Filter for tennis courts only initially
      const tennisCourts = courts.filter(court => court.sport === 'tennis').slice(0, 20);
      setNearbyCourts(tennisCourts);
    } catch (error) {
      console.error("Error loading courts:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPlayer) {
      alert("Please make sure you're logged in.");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      alert("Please select start and end dates.");
      return;
    }

    if (formData.end_date <= formData.start_date) {
      alert("End date must be after start date.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate default rules based on format
      let defaultRules = `This is a ${formData.tournament_format} ladder tournament for ${formData.ntrp_level} NTRP level players.\n\n`;
      
      if (formData.tournament_format === "singles") {
        defaultRules += "SINGLES RULES:\n- Players can challenge opponents up to 3 positions above them\n- Matches are best of 3 sets\n- Players have 7 days to schedule and complete matches\n- If challenger wins, they take the opponent's position";
      } else {
        defaultRules += "DOUBLES RULES:\n- Teams can challenge opponents up to 3 positions above them\n- Matches are best of 3 sets\n- Both players must be present for the match\n- Teams have 7 days to schedule and complete matches\n- If challenger team wins, they take the opponent's position";
      }
      
      defaultRules += "\n\nMATCH SCHEDULING:\n- Use the app's chat feature to coordinate match times\n- Matches should be played at mutually agreed upon courts\n- Report scores within 24 hours of completion\n- Disputes will be reviewed by tournament organizer";

      const tournamentData = {
        ...formData,
        organizer_id: currentPlayer.id,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        rules: formData.rules || defaultRules
      };

      const newTournament = await LadderTournament.create(tournamentData);
      
      alert(`${formData.tournament_format === 'singles' ? 'Singles' : 'Doubles'} tournament "${formData.name}" created successfully!`);
      
      if (onTournamentCreated) {
        onTournamentCreated(newTournament);
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Failed to create tournament. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCourtPreference = (courtId) => {
    setFormData(prev => ({
      ...prev,
      court_preferences: prev.court_preferences.includes(courtId)
        ? prev.court_preferences.filter(id => id !== courtId)
        : [...prev.court_preferences, courtId]
    }));
  };

  // Update courts when sport changes
  useEffect(() => {
    const filteredCourts = nearbyCourts.filter(court => 
      court.sport === formData.sport || 
      (formData.sport === 'tennis' && !court.sport) // Include courts without sport specified for tennis
    );
    // Reset court preferences when sport changes
    if (formData.court_preferences.length > 0) {
      setFormData(prev => ({ ...prev, court_preferences: [] }));
    }
  }, [formData.sport]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Create {formData.tournament_format === 'singles' ? 'Singles' : 'Doubles'} Tournament
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Format Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Tournament Format *</Label>
              <Select 
                value={formData.tournament_format} 
                onValueChange={(value) => setFormData({...formData, tournament_format: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Singles Tournament</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="doubles">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Doubles Tournament</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.tournament_format === 'singles' ? 
                  'Individual players compete against each other' : 
                  'Teams of 2 players compete against other teams'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label>Sport *</Label>
              <Select 
                value={formData.sport} 
                onValueChange={(value) => setFormData({...formData, sport: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="pickleball">Pickleball</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                placeholder={`e.g., "Summer ${formData.tournament_format === 'singles' ? 'Singles' : 'Doubles'} Ladder"`}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ntrp_level">Skill Level (NTRP) *</Label>
              <Select 
                value={formData.ntrp_level.toString()} 
                onValueChange={(value) => setFormData({...formData, ntrp_level: parseFloat(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2.5">2.5 - Beginner</SelectItem>
                  <SelectItem value="3.0">3.0 - Beginner+</SelectItem>
                  <SelectItem value="3.5">3.5 - Intermediate</SelectItem>
                  <SelectItem value="4.0">4.0 - Intermediate+</SelectItem>
                  <SelectItem value="4.5">4.5 - Advanced</SelectItem>
                  <SelectItem value="5.0">5.0 - Advanced+</SelectItem>
                  <SelectItem value="5.5">5.5 - Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="e.g., Austin"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="e.g., TX"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Tournament Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_participants">
                Max {formData.tournament_format === 'singles' ? 'Players' : 'Teams'} *
              </Label>
              <Select 
                value={formData.max_participants.toString()} 
                onValueChange={(value) => setFormData({...formData, max_participants: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="32">32</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament_type">Tournament Type *</Label>
              <Select 
                value={formData.tournament_type} 
                onValueChange={(value) => setFormData({...formData, tournament_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positional">Positional Ladder</SelectItem>
                  <SelectItem value="points_robin">Points-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_fee">Entry Fee ($)</Label>
              <Input
                id="entry_fee"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.entry_fee}
                onChange={(e) => setFormData({...formData, entry_fee: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, 'PPP') : 'Select start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => setFormData({...formData, start_date: date})}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, 'PPP') : 'Select end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => setFormData({...formData, end_date: date})}
                    disabled={(date) => date < new Date() || (formData.start_date && date <= formData.start_date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={`Describe your ${formData.tournament_format} tournament, including any special rules or requirements...`}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {/* Prize Structure */}
          <div className="space-y-2">
            <Label htmlFor="prize_structure">Prize Structure</Label>
            <Input
              id="prize_structure"
              placeholder="e.g., 1st: Trophy, 2nd: Medal, 3rd: Certificate"
              value={formData.prize_structure}
              onChange={(e) => setFormData({...formData, prize_structure: e.target.value})}
            />
          </div>

          {/* Preferred Courts */}
          <div className="space-y-2">
            <Label>Preferred Courts (Optional)</Label>
            <p className="text-sm text-gray-600 mb-3">
              Select courts where tournament matches should preferably be played
            </p>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
              {nearbyCourts.filter(court => court.sport === formData.sport).slice(0, 10).map(court => (
                <div key={court.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`court-${court.id}`}
                    checked={formData.court_preferences.includes(court.id)}
                    onChange={() => toggleCourtPreference(court.id)}
                    className="rounded"
                  />
                  <Label htmlFor={`court-${court.id}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="font-medium">{court.name}</span>
                      {court.address && (
                        <span className="text-xs text-gray-500">• {court.address}</span>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
              {nearbyCourts.filter(court => court.sport === formData.sport).length === 0 && (
                <p className="text-gray-500 text-sm italic">No {formData.sport} courts available</p>
              )}
            </div>
            {formData.court_preferences.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.court_preferences.map(courtId => {
                  const court = nearbyCourts.find(c => c.id === courtId);
                  return court ? (
                    <Badge key={courtId} variant="secondary">
                      {court.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Custom Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Custom Rules (Optional)</Label>
            <Textarea
              id="rules"
              placeholder="Leave blank to use default rules, or add custom tournament rules here..."
              value={formData.rules}
              onChange={(e) => setFormData({...formData, rules: e.target.value})}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              If left blank, standard {formData.tournament_format} ladder rules will be applied
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Tournament...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Create {formData.tournament_format === 'singles' ? 'Singles' : 'Doubles'} Tournament
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}