import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TeamMember, Player } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function InviteMemberDialog({ team }) {
  const [open, setOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [playersData, teamMembersData] = await Promise.all([
          Player.list(),
          TeamMember.filter({ team_id: team.id })
      ]);
      const memberPlayerIds = new Set(teamMembersData.map(m => m.player_id));
      const availablePlayers = playersData.filter(p => !memberPlayerIds.has(p.id));
      setAllPlayers(availablePlayers);
      setFilteredPlayers(availablePlayers);
    } catch (error) {
      console.error("Failed to fetch players:", error);
      toast({ title: "Error", description: "Could not load players list.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [team.id, toast]);

  useEffect(() => {
    if (open) {
      fetchPlayers();
    }
  }, [open, fetchPlayers]);

  useEffect(() => {
      if (!searchTerm) {
          setFilteredPlayers(allPlayers);
          return;
      }
      const lowercasedTerm = searchTerm.toLowerCase();
      setFilteredPlayers(
          allPlayers.filter(p => p.display_name.toLowerCase().includes(lowercasedTerm))
      );
  }, [searchTerm, allPlayers]);

  const handleInvite = async (player) => {
    try {
        await TeamMember.create({
            team_id: team.id,
            player_id: player.id,
            role: 'member',
            status: 'pending',
            type: 'invite'
        });
        toast({ title: "Invitation Sent", description: `${player.display_name} has been invited to join the team.` });
        fetchPlayers();
    } catch (error) {
        console.error("Failed to invite player:", error);
        toast({ title: "Error", description: "Failed to send invitation.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member to {team.name}</DialogTitle>
          <DialogDescription>Search for a player and send them an invitation to join your team.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by player name..." 
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
                ) : filteredPlayers.length > 0 ? (
                    filteredPlayers.map(player => (
                        <div key={player.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                            <span className="font-medium">{player.display_name}</span>
                            <Button size="sm" variant="outline" onClick={() => handleInvite(player)}>
                                <UserPlus className="w-4 h-4 mr-2"/>
                                Invite
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-gray-500 py-8">No players found.</p>
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