
import React, { useState, useEffect, useCallback } from "react";
import { Player, User, TeamMember, PickleballTeam } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, LogOut, Check, X, Users } from "lucide-react";
import { User as UserEntity } from "@/api/entities";

import SkillAssessment from "../components/profile/SkillAssessment";
import PersonalInfo from "../components/profile/PersonalInfo";
import DeleteAccountModal from "../components/profile/DeleteAccountModal";
import CreateProfileForm from "../components/profile/CreateProfileForm";

export default function Profile() {
  const [player, setPlayer] = useState(null);
  const [user, setUser] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [teams, setTeams] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const loadPlayerProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await User.me();
      setUser(userData);
      const players = await Player.filter({ user_id: userData.id });

      if (players.length > 0) {
        const currentPlayer = players[0];
        setPlayer(currentPlayer);

        // Fetch team invitations
        const teamInvites = await TeamMember.filter({
          player_id: currentPlayer.id,
          status: 'pending',
          type: 'invite'
        });
        setInvitations(teamInvites);

        if (teamInvites.length > 0) {
            const teamIds = teamInvites.map(i => i.team_id);
            const uniqueTeamIds = [...new Set(teamIds)]; // Ensure unique IDs to avoid redundant fetches
            const teamsData = await PickleballTeam.filter({ id: { "$in": uniqueTeamIds } });
            const teamsMap = teamsData.reduce((acc, team) => {
                acc[team.id] = team;
                return acc;
            }, {});
            setTeams(teamsMap);
        }

      } else {
        // Player profile does not exist, so we will show the creation form.
        setPlayer(null);
      }
    } catch (err) {
      console.error("Error loading player profile:", err);
      setError("Failed to load your profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayerProfile();
  }, [loadPlayerProfile]);

  const handleProfileUpdate = (updatedData) => {
    setPlayer(prev => ({ ...prev, ...updatedData }));
  };

  const handleLogout = async () => {
    await UserEntity.logout();
    window.location.href = "/";
  };

  const handleInvitationAction = async (invitation, action) => {
      try {
          if (action === 'accept') {
              await TeamMember.update(invitation.id, { status: 'member' });
              toast({
                title: "Invitation Accepted",
                description: `You have joined ${teams[invitation.team_id]?.name || 'a team'}.`
              });
          } else { // action === 'decline'
              await TeamMember.delete(invitation.id);
              toast({
                title: "Invitation Declined",
                description: `Invitation to ${teams[invitation.team_id]?.name || 'a team'} has been declined.`
              });
          }
          loadPlayerProfile(); // Re-load to update the list of invitations and player's team status
      } catch (error) {
          console.error("Error handling invitation:", error);
          toast({
            title: "Error",
            description: "Failed to process invitation. Please try again.",
            variant: "destructive"
          });
      }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // If user is loaded but player profile is not, show the creation form.
  if (user && !player) {
    return <CreateProfileForm user={user} onProfileCreated={loadPlayerProfile} />;
  }
  
  // This should only be rendered if the player profile exists
  if (player) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your personal information, skill ratings, and account settings.
            </p>
          </div>

          <div className="space-y-8">
            {invitations.length > 0 && (
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5"/> Team Invitations
                      </CardTitle>
                      <CardDescription>You have been invited to join the following teams.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-3">
                          {invitations.map(invite => (
                              <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                                  <div>
                                      <p className="font-semibold">Join {teams[invite.team_id]?.name || 'a team'}</p>
                                      <p className="text-sm text-gray-600">You received an invitation to become a member.</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleInvitationAction(invite, 'accept')}>
                                          <Check className="w-4 h-4 mr-1"/> Accept
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleInvitationAction(invite, 'decline')}>
                                          <X className="w-4 h-4 mr-1"/> Decline
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
                </Card>
            )}

            <PersonalInfo player={player} onUpdate={handleProfileUpdate} />
            <SkillAssessment player={player} onUpdate={handleProfileUpdate} />

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="destructive" onClick={() => setIsDeleting(true)}>
                  Delete Account
                </Button>
                 <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                   <LogOut className="w-4 h-4" />
                   Log Out
                 </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {isDeleting && (
          <DeleteAccountModal
            player={player}
            onClose={() => setIsDeleting(false)}
          />
        )}
      </div>
    );
  }

  // Fallback return null if neither loading, error, nor player state is met.
  return null;
}
