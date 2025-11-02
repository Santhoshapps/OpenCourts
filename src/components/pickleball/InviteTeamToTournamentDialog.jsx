import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PickleballTeam, PickleballParticipant } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function InviteTeamToTournamentDialog({ tournament, existingParticipantTeamIds, onInviteSent }) {
  const [open, setOpen] = useState(false);
  const [allTeams, setAllTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const teamsData = await PickleballTeam.list();
      const availableTeams = teamsData.filter(team => !existingParticipantTeamIds.includes(team.id));
      setAllTeams(availableTeams);
      setFilteredTeams(availableTeams);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast({ title: "Error", description: "Could not load teams list.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [existingParticipantTeamIds, toast]);

  useEffect(() => {
    if (open) {
      fetchTeams();
    }
  }, [open, fetchTeams]);

  useEffect(() => {
      if (!searchTerm) {
          setFilteredTeams(allTeams);
          return;
      }
      const lowercasedTerm = searchTerm.toLowerCase();
      setFilteredTeams(
          allTeams.filter(t => t.name.toLowerCase().includes(lowercasedTerm))
      );
  }, [searchTerm, allTeams]);

  const handleInvite = async (team) => {
    try {
        await PickleballParticipant.create({
            tournament_id: tournament.id,
            team_id: team.id,
            status: 'pending_invite',
        });
        toast({ title: "Invitation Sent", description: `${team.name} has been invited to the tournament.` });
        if(onInviteSent) onInviteSent();
        // Refetch teams to remove the invited one from the list
        fetchTeams(); 
    } catch (error) {
        console.error("Failed to invite team:", error);
        toast({ title: "Error", description: "Failed to send invitation.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team to {tournament.name}</DialogTitle>
          <DialogDescription>Search for a team to invite.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by team name..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ScrollArea className="h-72">
                <div className="space-y-2 pr-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin"/>
                    </div>
                ) : filteredTeams.length > 0 ? (
                    filteredTeams.map(team => (
                        <div key={team.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                            <span className="font-medium">{team.name}</span>
                            <Button size="sm" variant="outline" onClick={() => handleInvite(team)}>
                                <UserPlus className="w-4 h-4 mr-2"/>
                                Invite
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-gray-500 py-8">No available teams found.</p>
                )}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}