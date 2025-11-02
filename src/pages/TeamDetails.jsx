import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PickleballTeam } from "@/api/entities";
import { TeamMember } from "@/api/entities";
import { TeamMatch } from "@/api/entities";
import { User } from "@/api/entities";
import { Player } from "@/api/entities";
import { Court } from "@/api/entities";
import { PickleballParticipant } from "@/api/entities";
import { PickleballTournament } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import {
  Users,
  Trophy,
  MapPin,
  Edit,
  Check,
  X,
  Crown,
  Swords
} from "lucide-react";
import ProposeMatchDialog from "../components/pickleball/ProposeMatchDialog";
import InviteMemberDialog from "../components/pickleball/InviteMemberDialog";
import MatchManagement from "../components/pickleball/MatchManagement";
import CreateTeamTournamentDialog from "../components/pickleball/CreateTeamTournamentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TOURNAMENT_FORMATS } from "@/components/pickleball/constants";
import { useToast } from "@/components/ui/use-toast";

export default function TeamDetails() {
  const [id, setId] = useState(null);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [captain, setCaptain] = useState(null);
  const [homeCourt, setHomeCourt] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditFormats, setShowEditFormats] = useState(false);
  const [preferredFormats, setPreferredFormats] = useState([]);
  
  const [pendingMatchProposals, setPendingMatchProposals] = useState([]);
  const [activeMatches, setActiveMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);

  const [allTeams, setAllTeams] = useState({});
  const [allPlayers, setAllPlayers] = useState({});
  const [tournamentInvites, setTournamentInvites] = useState([]);
  const [tournaments, setTournaments] = useState({});
  const { toast } = useToast();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const teamId = searchParams.get('id');
    if (teamId) {
      setId(teamId);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const loadTeamData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [teamData, membersData, userData, matchesData, teamsData, playersData, participantInvites, allTournaments] = await Promise.all([
        PickleballTeam.get(id),
        TeamMember.filter({ team_id: id }),
        User.me(),
        TeamMatch.filter({ $or: [{ proposing_team_id: id }, { opponent_team_id: id }] }),
        PickleballTeam.list(),
        Player.list(),
        PickleballParticipant.filter({ team_id: id, status: 'pending_invite' }),
        PickleballTournament.list()
      ]);

      setTeam(teamData);
      setCurrentUser(userData);
      setPreferredFormats(teamData.preferred_formats || []);
      
      const proposals = [];
      const active = [];
      const past = [];

      matchesData.forEach(match => {
        if (match.status === 'proposed' && match.opponent_team_id === id) {
          proposals.push(match);
        } else if (['accepted', 'pending_confirmation'].includes(match.status)) {
          active.push(match);
        } else { // 'completed', 'declined', 'cancelled'
          past.push(match);
        }
      });
      setPendingMatchProposals(proposals);
      setActiveMatches(active);
      setPastMatches(past);

      const teamsMap = {};
      teamsData.forEach(t => { teamsMap[t.id] = t; });
      setAllTeams(teamsMap);

      const tournamentsMap = allTournaments.reduce((acc, t) => {
        acc[t.id] = t;
        return acc;
      }, {});
      setTournaments(tournamentsMap);
      setTournamentInvites(participantInvites);

      const playersMap = {};
      playersData.forEach(p => { playersMap[p.id] = p; });
      setAllPlayers(playersMap);

      const playerIds = membersData.map(m => m.player_id);
      if (teamData.captain_id && !playerIds.includes(teamData.captain_id)) {
        playerIds.push(teamData.captain_id);
      }

      if (playerIds.length > 0) {
        const memberPlayers = playersData.filter(p => playerIds.includes(p.id));
        const membersPlayersMap = {};
        memberPlayers.forEach(p => { membersPlayersMap[p.id] = p; });

        const memberDetails = membersData.map(m => ({ ...m, player: membersPlayersMap[m.player_id] }));
        setMembers(memberDetails);

        const captainData = membersPlayersMap[teamData.captain_id];
        setCaptain(captainData);

        if (userData && captainData?.user_id === userData.id) {
          setIsCaptain(true);
        }
      }

      if (teamData.home_court_id) {
        const courtData = await Court.get(teamData.home_court_id);
        setHomeCourt(courtData);
      }

    } catch (error) {
      console.error("Error loading team data:", error);
      setTeam(null);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTeamData();
    }
  }, [id, loadTeamData]);

  const handleFormatChange = (formatKey) => {
      setPreferredFormats(prev =>
          prev.includes(formatKey)
              ? prev.filter(f => f !== formatKey)
              : [...prev, formatKey]
      );
  };

  const handleSaveChanges = async () => {
      if (!isCaptain) return;
      try {
          await PickleballTeam.update(team.id, { preferred_formats: preferredFormats });
          setShowEditFormats(false);
          await loadTeamData(); // reload to get fresh data
      } catch (error) {
          console.error("Failed to update preferred formats:", error);
          toast({ title: "Error saving changes", variant: "destructive" });
      }
  };

  const handleMatchProposed = () => {
    loadTeamData();
  };
  
  const handleTournamentCreated = (newTournament) => {
      loadTeamData();
      toast({ title: "Tournament Created!", description: `You can now invite teams to ${newTournament.name}.` });
  };

  const handleInviteResponse = async (invite, response) => {
    try {
      if (response === 'accept') {
        await PickleballParticipant.update(invite.id, { status: 'active' });
        toast({ title: "Tournament Joined!", description: "You are now participating in the tournament." });
      } else {
        await PickleballParticipant.delete(invite.id);
        toast({ title: "Invitation Declined" });
      }
      loadTeamData();
    } catch (error) {
      console.error("Error handling tournament invite:", error);
      toast({ title: "Error", description: "Failed to respond to invitation.", variant: "destructive" });
    }
  };

  const handleAcceptMatch = async (match) => {
    if (!isCaptain) return;
    try {
      await TeamMatch.update(match.id, { status: 'accepted' });
      toast({ title: "Match Accepted!", description: "The match is now active. You can start adding games and scores." });
      loadTeamData();
    } catch (error) {
      console.error("Error accepting match:", error);
      toast({ title: "Error", description: "Could not accept match.", variant: "destructive" });
    }
  };

  const handleDeclineMatch = async (match) => {
    if (!isCaptain) return;
    try {
      await TeamMatch.update(match.id, { status: 'declined' });
      toast({ title: "Match Declined" });
      loadTeamData();
    } catch (error) {
      console.error("Error declining match:", error);
      toast({ title: "Error", description: "Could not decline match.", variant: "destructive" });
    }
  };

  const handleFinalScoreSubmit = async (match, winnerId, finalScore) => {
    if (!isCaptain) return;
    try {
        await TeamMatch.update(match.id, {
            status: 'completed',
            winner_team_id: winnerId,
            score: finalScore,
            score_submitted_by_team_id: team.id
        });

        const winnerTeam = await PickleballTeam.get(winnerId);
        const loserId = winnerId === match.proposing_team_id ? match.opponent_team_id : match.proposing_team_id;
        const loserTeam = await PickleballTeam.get(loserId);

        await PickleballTeam.update(winnerId, { wins: (winnerTeam.wins || 0) + 1 });
        await PickleballTeam.update(loserId, { losses: (loserTeam.losses || 0) + 1 });
        
        toast({ title: "Match Completed!", description: "The final score has been recorded and team records updated." });
        loadTeamData();
    } catch (error) {
        console.error("Error submitting final score:", error);
        toast({ title: "Error", description: "Failed to submit final score.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading team details...</div>;
  }

  if (!team) {
    return <div className="text-center p-10">Team not found.</div>;
  }

  const getSkillLevelColor = (level) => {
    switch (level) {
      case "recreational": return "bg-blue-100 text-blue-800";
      case "intermediate": return "bg-green-100 text-green-800";
      case "advanced": return "bg-yellow-100 text-yellow-800";
      case "competitive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="w-24 h-24 border">
                {team.logo_url ? <AvatarImage src={team.logo_url} alt={team.name} /> : <AvatarFallback><Crown className="w-12 h-12 text-gray-400" /></AvatarFallback>}
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold">{team.name}</CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-1">
                  {team.city}, {team.state}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className={getSkillLevelColor(team.skill_level)}>
                    {team.skill_level}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {members.length} Members
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {team.wins || 0}W - {team.losses || 0}L
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                {isCaptain && <ProposeMatchDialog proposingTeam={team} onMatchProposed={handleMatchProposed} />}
                {isCaptain && <InviteMemberDialog team={team} onInviteSent={loadTeamData} />}
                {isCaptain && <CreateTeamTournamentDialog team={team} onTournamentCreated={handleTournamentCreated} />}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {isCaptain && pendingMatchProposals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Swords className="w-5 h-5 text-blue-600"/>New Match Challenges</CardTitle>
                  <CardDescription>You have been challenged to a match. Respond to get it on the schedule.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingMatchProposals.map(match => (
                    <div key={match.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="font-semibold">Challenge from: {allTeams[match.proposing_team_id]?.name}</p>
                        <p className="text-sm text-gray-500">Proposed for: {new Date(match.proposed_time).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <Button size="sm" onClick={() => handleAcceptMatch(match)}><Check className="w-4 h-4 mr-1"/>Accept</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeclineMatch(match)}><X className="w-4 h-4 mr-1"/>Decline</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {isCaptain && tournamentInvites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Invitations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tournamentInvites.map(invite => (
                    <div key={invite.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{tournaments[invite.tournament_id]?.name}</p>
                        <p className="text-sm text-gray-500">Format: {TOURNAMENT_FORMATS[tournaments[invite.tournament_id]?.format]?.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleInviteResponse(invite, 'accept')}>Accept</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleInviteResponse(invite, 'decline')}>Decline</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeMatches.length > 0 && (
                <div className="space-y-6">
                    {activeMatches.map(match => (
                        <MatchManagement
                            key={match.id}
                            match={match}
                            teams={allTeams}
                            players={allPlayers}
                            currentTeamId={id}
                            isCaptain={isCaptain}
                            onScoreSubmit={handleFinalScoreSubmit}
                        />
                    ))}
                </div>
            )}
            
            {activeMatches.length === 0 && pendingMatchProposals.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No active matches. Propose a match to get started!
                </CardContent>
              </Card>
            )}
            
            {pastMatches.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Past Matches</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {pastMatches.map(match => (
                            <div key={match.id} className="p-2 border-b">
                                <p>vs {match.proposing_team_id === id ? allTeams[match.opponent_team_id]?.name : allTeams[match.proposing_team_id]?.name}</p>
                                <p className="text-sm text-gray-600">Status: {match.status} {match.status === 'completed' && `- ${match.score}`}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">Captain</h4>
                  <p className="text-gray-600">{captain?.display_name || 'N/A'}</p>
                </div>
                {homeCourt && (
                  <div>
                    <h4 className="font-semibold text-sm">Home Court</h4>
                    <Link to={createPageUrl(`CourtDetails?id=${homeCourt.id}`)} className="text-blue-600 hover:underline flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {homeCourt.name}
                    </Link>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-sm">About Us</h4>
                  <p className="text-gray-600">{team.description || 'No description provided.'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Preferred Formats</CardTitle>
                {isCaptain && (
                  <Dialog open={showEditFormats} onOpenChange={setShowEditFormats}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Preferred Formats</DialogTitle>
                        <DialogDescription>
                          Select the tournament and league formats your team is interested in playing.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
                        {Object.entries(TOURNAMENT_FORMATS).map(([key, format]) => (
                            <div key={key} className="flex items-center space-x-2">
                                <Checkbox
                                    id={key}
                                    checked={preferredFormats.includes(key)}
                                    onCheckedChange={() => handleFormatChange(key)}
                                />
                                <Label htmlFor={key} className="flex-1 cursor-pointer">
                                  {format.icon} {format.name}
                                </Label>
                            </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowEditFormats(false)}>
                            <X className="w-4 h-4 mr-2"/> Cancel
                        </Button>
                        <Button onClick={handleSaveChanges}>
                            <Check className="w-4 h-4 mr-2"/> Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {team.preferred_formats && team.preferred_formats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {team.preferred_formats.map(formatKey => (
                            <Badge key={formatKey} variant="secondary">
                                {TOURNAMENT_FORMATS[formatKey]?.icon} {TOURNAMENT_FORMATS[formatKey]?.name}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No preferred formats selected.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Roster</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{member.player?.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.player?.display_name || 'Unnamed Player'}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{member.player?.ntrp_rating || 'N/A'} NTRP</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}