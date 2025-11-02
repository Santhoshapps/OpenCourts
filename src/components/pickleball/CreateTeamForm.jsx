
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PickleballTeam, TeamMember, Player } from "@/api/entities";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Loader2, AlertCircle } from "lucide-react";

export default function CreateTeamForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    skill_level: "recreational",
    city: "",
    state: "",
  });
  const [isLoading, setIsLoading] = useState(true); // Changed initial state to true
  const [error, setError] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      setIsLoading(true); // Set loading true at the start of fetch
      try {
        const user = await User.me();
        if (user) {
            const playerData = await Player.filter({ user_id: user.id });
            if (playerData.length > 0) {
              setCurrentPlayer(playerData[0]);
            } else {
              setError("You must have a player profile to create a team.");
            }
        } else {
            setError("You must be logged in to create a team.");
        }
      } catch (e) {
        console.error("Error fetching player profile:", e);
        setError("Could not load your player profile. Please try again.");
      } finally {
        setIsLoading(false); // Set loading false after fetch
      }
    };
    fetchPlayer();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPlayer) {
      setError("Player profile not found. Cannot create team."); // This specific error is handled by the initial check, but good as a fallback
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const invite_token = Math.random().toString(36).substring(2, 15);
      const newTeam = await PickleballTeam.create({
        ...formData,
        captain_id: currentPlayer.id,
        invite_token: invite_token,
      });

      // Create the team founder (who is also the initial captain)
      await TeamMember.create({
        team_id: newTeam.id,
        player_id: currentPlayer.id,
        role: "founder", // Team creator gets founder role
        status: "member",
      });

      onSuccess(newTeam);
    } catch (err) {
      setError("Failed to create team. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading your profile...</span>
      </div>
    );
  }

  if (error && !currentPlayer) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
        <p className="font-semibold text-yellow-800">Player Profile Required</p>
        <p className="text-sm text-yellow-700 mt-1 mb-3">
          {error}
        </p>
        <Button asChild>
            <Link to={createPageUrl("Profile")}>Go to Profile</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Team Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="skill_level">Skill Level</Label>
        <Select
          value={formData.skill_level}
          onValueChange={(value) => setFormData({ ...formData, skill_level: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select skill level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recreational">Recreational</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="competitive">Competitive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* This error display handles submission errors, as the !currentPlayer error is handled by the early return block */}
      {error && <p className="text-sm text-red-600">{error}</p>} 
      <Button type="submit" disabled={isLoading || !currentPlayer} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Team
      </Button>
    </form>
  );
}
