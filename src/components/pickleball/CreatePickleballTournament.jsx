import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { PickleballTournament, Court, Player } from "@/api/entities";
import { User } from "@/api/entities";
import { CalendarIcon, Trophy, Users, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function CreatePickleballTournament({ formats, onTournamentCreated, onCancel }) {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [nearbyCourts, setNearbyCourts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    format: "",
    skill_level: "3.5",
    max_participants: 16,
    start_date: null,
    end_date: null,
    city: "",
    state: "",
    entry_fee: 0,
    prize_structure: "",
    rules: "",
    court_preferences: [],
    sessions_per_week: 1,
    duration_weeks: 6,
    games_per_match: 2
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
      const pickleballCourts = courts.filter(court => 
        court.sport === 'pickleball' || 
        (court.amenities && court.amenities.includes('pickleball'))
      ).slice(0, 20);
      setNearbyCourts(pickleballCourts);
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

    if (!formData.format) {
      alert("Please select a tournament format.");
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
      const selectedFormat = formats[formData.format];
      
      // Generate default rules based on format
      let defaultRules = `${selectedFormat.name}\n\n${selectedFormat.description}\n\n`;
      
      defaultRules += "GENERAL RULES:\n";
      defaultRules += `• ${formData.games_per_match} games per match\n`;
      defaultRules += `• ${formData.sessions_per_week} session(s) per week\n`;
      defaultRules += `• Tournament duration: ${formData.duration_weeks} weeks\n`;
      defaultRules += "• All games played to 11 points, win by 2\n";
      defaultRules += "• Players must arrive 10 minutes before scheduled time\n";
      defaultRules += "• Report scores within 24 hours\n\n";

      // Add format-specific rules
      switch (formData.format) {
        case "rotating_partner_round_robin":
          defaultRules += "ROTATING PARTNER RULES:\n";
          defaultRules += "• Each player will partner with every other player exactly once\n";
          defaultRules += "• Pairings are predetermined for fairness\n";
          defaultRules += "• Individual standings tracked based on total wins\n";
          break;
        case "set_partner_round_robin":
          defaultRules += "SET PARTNER RULES:\n";
          defaultRules += "• Teams remain the same throughout tournament\n";
          defaultRules += "• Each team plays every other team once\n";
          defaultRules += "• Team standings based on match wins\n";
          break;
        case "ladder_league_set_partner":
          defaultRules += "LADDER LEAGUE RULES:\n";
          defaultRules += "• Teams can challenge teams up to 3 positions above\n";
          defaultRules += "• Winner takes higher position if challenging up\n";
          defaultRules += "• Must accept challenges from teams below\n";
          break;
        // Add more format-specific rules as needed
      }

      const tournamentData = {
        ...formData,
        organizer_id: currentPlayer.id,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        rules: formData.rules || defaultRules,
        max_participants: Math.min(formData.max_participants, selectedFormat.maxPlayers)
      };

      const newTournament = await PickleballTournament.create(tournamentData);
      
      alert(`Tournament "${formData.name}" created successfully!`);
      
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

  const selectedFormat = formData.format ? formats[formData.format] : null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Create Pickleball Tournament
        </CardTitle>
        <p className="text-gray-600">
          Choose from various tournament formats and create your community event
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Format Selection */}
          <div className="space-y-2">
            <Label>Tournament Format *</Label>
            <Select 
              value={formData.format} 
              onValueChange={(value) => setFormData({...formData, format: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a tournament format..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(formats).map(([key, format]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{format.icon}</span>
                      <span>{format.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFormat && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedFormat.name}:</strong> {selectedFormat.description}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Recommended: {selectedFormat.minPlayers}-{selectedFormat.maxPlayers} players
                </p>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Spring Pickleball Round Robin"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_level">Skill Level *</Label>
              <Select 
                value={formData.skill_level.toString()} 
                onValueChange={(value) => setFormData({...formData, skill_level: value})}
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
                  <SelectItem value="5.0">5.0 - Expert</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Players *</Label>
              <Input
                id="max_participants"
                type="number"
                min={selectedFormat?.minPlayers || 4}
                max={selectedFormat?.maxPlayers || 32}
                value={formData.max_participants}
                onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value) || 16})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions_per_week">Sessions/Week</Label>
              <Select 
                value={formData.sessions_per_week.toString()} 
                onValueChange={(value) => setFormData({...formData, sessions_per_week: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 session</SelectItem>
                  <SelectItem value="2">2 sessions</SelectItem>
                  <SelectItem value="3">3 sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_weeks">Duration (weeks)</Label>
              <Input
                id="duration_weeks"
                type="number"
                min="1"
                max="16"
                value={formData.duration_weeks}
                onChange={(e) => setFormData({...formData, duration_weeks: parseInt(e.target.value) || 6})}
              />
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
              placeholder="Describe your tournament, including any special requirements..."
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
              placeholder="e.g., 1st: $100, 2nd: $50, 3rd: $25"
              value={formData.prize_structure}
              onChange={(e) => setFormData({...formData, prize_structure: e.target.value})}
            />
          </div>

          {/* Preferred Courts */}
          <div className="space-y-2">
            <Label>Preferred Courts (Optional)</Label>
            <p className="text-sm text-gray-600 mb-3">
              Select courts where tournament sessions should be held
            </p>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
              {nearbyCourts.map(court => (
                <div key={court.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`court-${court.id}`}
                    checked={formData.court_preferences.includes(court.id)}
                    onCheckedChange={() => toggleCourtPreference(court.id)}
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
              {nearbyCourts.length === 0 && (
                <p className="text-gray-500 text-sm italic">No pickleball courts available</p>
              )}
            </div>
          </div>

          {/* Custom Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Custom Rules (Optional)</Label>
            <Textarea
              id="rules"
              placeholder="Leave blank to use default rules for the selected format..."
              value={formData.rules}
              onChange={(e) => setFormData({...formData, rules: e.target.value})}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Default rules will be generated based on your selected tournament format
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-teal-600 hover:bg-teal-700">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Tournament...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Create Tournament
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