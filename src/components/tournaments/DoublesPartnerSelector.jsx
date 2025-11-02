import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/api/entities";
import { User } from "@/api/entities";
import { Search, Users, UserCheck, Mail } from "lucide-react";

export default function DoublesPartnerSelector({ tournament, onPartnerSelected, onCancel }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const allPlayers = await Player.list();
      // Filter out current user and get players with similar skill level
      const eligiblePlayers = allPlayers.filter(player => 
        player.user_id !== user.id && 
        player.ntrp_rating && 
        Math.abs(player.ntrp_rating - tournament.ntrp_level) <= 0.5
      );
      setPlayers(eligiblePlayers);
    } catch (error) {
      console.error("Error loading players:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedPartner || !teamName.trim()) {
      alert("Please select a partner and enter a team name.");
      return;
    }

    onPartnerSelected({
      partner: selectedPartner,
      teamName: teamName.trim()
    });
  };

  const handleInviteByEmail = () => {
    if (!inviteEmail.trim() || !teamName.trim()) {
      alert("Please enter partner's email and team name.");
      return;
    }

    // For now, just proceed with email invitation
    // In a full implementation, you'd send an actual invitation
    onPartnerSelected({
      partnerEmail: inviteEmail.trim(),
      teamName: teamName.trim()
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          Select Doubles Partner
        </CardTitle>
        <p className="text-gray-600">
          Choose a partner for the {tournament.name} doubles tournament
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Name */}
        <div className="space-y-2">
          <Label htmlFor="teamName">Team Name *</Label>
          <Input
            id="teamName"
            placeholder="e.g., Dynamic Duo, Court Crushers"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
        </div>

        {/* Partner Selection Options */}
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Option 1: Select from Available Players</h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Player List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPartner?.id === player.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPartner(player)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.display_name}</span>
                          {player.ntrp_rating && (
                            <Badge variant="outline" className="text-xs">
                              {player.ntrp_rating} NTRP
                            </Badge>
                          )}
                        </div>
                        {player.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {player.bio}
                          </p>
                        )}
                      </div>
                      {selectedPartner?.id === player.id && (
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {searchTerm ? 'No players found matching your search.' : 'No eligible players found.'}
                </p>
              )}
            </div>
          </div>

          {/* Email Invitation Option */}
          <div>
            <h3 className="font-semibold mb-3">Option 2: Invite Partner by Email</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Partner's email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleInviteByEmail}
                disabled={!inviteEmail.trim() || !teamName.trim()}
              >
                <Mail className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              We'll send them an invitation to join your team for this tournament.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedPartner || !teamName.trim()}
            className="flex-1"
          >
            Join Tournament with Partner
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}