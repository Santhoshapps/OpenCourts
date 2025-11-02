
import React, { useState, useEffect } from "react";
import { PickleballTeam, TeamMember, Player } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Plus, Trash2, Filter, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateTeamForm from "../components/pickleball/CreateTeamForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOURNAMENT_FORMATS } from "@/components/pickleball/constants";

export default function TeamsPage() {
  const [allTeams, setAllTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [captains, setCaptains] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [filters, setFilters] = useState({ city: "", state: "", format: "all" });
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let teamsToFilter = [...allTeams];
    if (filters.city) {
      teamsToFilter = teamsToFilter.filter(team => team.city?.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.state) {
      teamsToFilter = teamsToFilter.filter(team => team.state?.toLowerCase().includes(filters.state.toLowerCase()));
    }
    if (filters.format && filters.format !== 'all') {
        teamsToFilter = teamsToFilter.filter(team => 
            team.preferred_formats?.includes(filters.format)
        );
    }
    setFilteredTeams(teamsToFilter);
  }, [filters, allTeams]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teamsData, teamMembersData, playersData, userData] = await Promise.all([
        PickleballTeam.list("-created_date"),
        TeamMember.list(),
        Player.list(),
        User.me().catch(() => null) // Prevent crash if not logged in
      ]);

      setCurrentUser(userData);
      setIsAdmin(userData?.role === 'admin');
      setAllTeams(teamsData);
      setFilteredTeams(teamsData);

      const membersByTeam = teamMembersData.reduce((acc, member) => {
        if (!acc[member.team_id]) {
          acc[member.team_id] = [];
        }
        acc[member.team_id].push(member);
        return acc;
      }, {});
      setTeamMembers(membersByTeam);

      const playersMap = playersData.reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {});
      
      const captainDetails = {};
      teamsData.forEach(team => {
        if (team.captain_id && playersMap[team.captain_id]) { // Ensure captain_id exists and player is mapped
            captainDetails[team.id] = playersMap[team.captain_id];
        }
      });
      setCaptains(captainDetails);

    } catch (error) {
      console.error("Error loading teams data:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      const membersToDelete = await TeamMember.filter({ team_id: teamId });
      for (const member of membersToDelete) {
        await TeamMember.delete(member.id);
      }
      
      await PickleballTeam.delete(teamId);
      await loadData();
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Failed to delete team. Please try again.");
    }
  };
  
  const getSkillLevelColor = (level) => {
    switch (level) {
      case "recreational": return "bg-blue-100 text-blue-800";
      case "intermediate": return "bg-green-100 text-green-800";
      case "advanced": return "bg-yellow-100 text-yellow-800";
      case "competitive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleTeamCreated = (newTeam) => {
    setShowCreateTeamDialog(false);
    navigate(createPageUrl(`TeamDetails?id=${newTeam.id}`));
  };

  const handleMakeSelfCaptain = async (team) => {
    if (!isAdmin || !currentUser) return;
    
    try {
      let playerProfiles = await Player.filter({ user_id: currentUser.id });
      let currentPlayer;
      
      if (playerProfiles.length === 0) {
        currentPlayer = await Player.create({
          user_id: currentUser.id,
          display_name: currentUser.full_name || 'Admin'
        });
      } else {
        currentPlayer = playerProfiles[0];
      }

      await PickleballTeam.update(team.id, {
        captain_id: currentPlayer.id
      });

      const existingMembership = await TeamMember.filter({
        team_id: team.id,
        player_id: currentPlayer.id
      });

      if (existingMembership.length === 0) {
        await TeamMember.create({
          team_id: team.id,
          player_id: currentPlayer.id,
          role: "founder",
          status: "member"
        });
      } else {
        await TeamMember.update(existingMembership[0].id, {
          role: "founder"
        });
      }

      await loadData();
      alert(`You are now the captain of ${team.name}!`);
    } catch (error) {
      console.error("Error making self captain:", error);
      alert("Failed to make yourself captain. Please try again.");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pickleball Teams</h1>
              <p className="text-gray-600">
                Browse teams or create your own to start competing.
              </p>
            </div>
            <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Pickleball Team</DialogTitle>
                  <DialogDescription>
                    Fill out the details below to get your team started.
                  </DialogDescription>
                </DialogHeader>
                <CreateTeamForm onSuccess={handleTeamCreated} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filter Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Filter by City..."
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                />
                <Input
                  placeholder="Filter by State..."
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                />
                <Select value={filters.format} onValueChange={(value) => setFilters({ ...filters, format: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    {Object.entries(TOURNAMENT_FORMATS).map(([key, format]) => (
                      <SelectItem key={key} value={key}>
                        {format.icon} {format.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader><div className="h-6 bg-gray-200 rounded w-3/4"></div></CardHeader>
                  <CardContent><div className="h-4 bg-gray-200 rounded w-full mb-2"></div><div className="h-4 bg-gray-200 rounded w-1/2"></div></CardContent>
                </Card>
              ))
            ) : filteredTeams.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teams Found</h3>
                <p className="text-gray-600">Try adjusting your filters or be the first to create a team!</p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <Card key={team.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <div>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                             <CardTitle className="text-xl font-bold truncate">{team.name}</CardTitle>
                             <p className="text-sm text-gray-500 truncate">Captain: {captains[team.id]?.display_name || 'N/A'}</p>
                          </div>
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Shield className="w-6 h-6 text-gray-500" />
                          </div>
                      </div>
                       <p className="text-sm text-gray-500 pt-2">{team.city}, {team.state}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 h-10 line-clamp-2">{team.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSkillLevelColor(team.skill_level)}>
                          {team.skill_level}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {teamMembers[team.id]?.length || 0} Members
                        </Badge>
                         <Badge variant="secondary" className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {team.wins || 0}W - {team.losses || 0}L
                        </Badge>
                      </div>
                      {team.preferred_formats && team.preferred_formats.length > 0 && (
                          <div>
                              <h4 className="text-xs font-semibold text-gray-500 mb-2">Plays:</h4>
                              <div className="flex flex-wrap gap-1">
                                  {team.preferred_formats.map(formatKey => (
                                      <Badge key={formatKey} variant="outline" className="text-xs">
                                          {TOURNAMENT_FORMATS[formatKey]?.icon} {TOURNAMENT_FORMATS[formatKey]?.name}
                                      </Badge>
                                  ))}
                              </div>
                          </div>
                      )}
                    </CardContent>
                  </div>
                  <CardFooter className="border-t pt-4 mt-auto">
                    <div className="w-full flex justify-between items-center gap-2">
                      <Link to={createPageUrl(`TeamDetails?id=${team.id}`)}>
                        <Button variant="outline" size="sm">View Team</Button>
                      </Link>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {isAdmin && !captains[team.id] && ( // Only show "Become Captain" if no captain is assigned
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleMakeSelfCaptain(team)}
                          >
                            Become Captain
                          </Button>
                        )}
                        {isAdmin && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the team "{team.name}" and all related data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>
                                  Yes, delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
