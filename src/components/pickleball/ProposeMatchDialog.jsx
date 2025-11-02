import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PickleballTeam, TeamMatch } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Swords } from 'lucide-react';

export default function ProposeMatchDialog({ proposingTeam, onMatchProposed }) {
  const [open, setOpen] = useState(false);
  const [opponentTeamId, setOpponentTeamId] = useState('');
  const [matchFormat, setMatchFormat] = useState('best_of_3');
  const [proposedTime, setProposedTime] = useState('');
  const [message, setMessage] = useState('');
  const [availableTeams, setAvailableTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchOpponentTeams = useCallback(async () => {
    try {
      const allTeams = await PickleballTeam.list();
      setAvailableTeams(allTeams.filter(team => team.id !== proposingTeam.id));
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast({ title: "Error", description: "Could not load opponent teams.", variant: "destructive" });
    }
  }, [proposingTeam.id, toast]);

  useEffect(() => {
    if (open) {
      fetchOpponentTeams();
      setOpponentTeamId('');
      setMatchFormat('best_of_3');
      setProposedTime('');
      setMessage('');
    }
  }, [open, fetchOpponentTeams]);

  const handleSubmit = async () => {
    if (!opponentTeamId || !proposedTime) {
      toast({ title: "Missing Information", description: "Please select an opponent and a proposed time.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await TeamMatch.create({
        proposing_team_id: proposingTeam.id,
        opponent_team_id: opponentTeamId,
        match_format: matchFormat,
        proposed_time: new Date(proposedTime).toISOString(),
        status: 'proposed',
        message: message,
      });

      toast({ title: "Proposal Sent!", description: "Your match proposal has been sent to the opponent." });
      setOpen(false);
      
      if (onMatchProposed) {
        onMatchProposed();
      }
    } catch (error) {
      console.error("Failed to propose match:", error);
      toast({ title: "Error", description: "Failed to send match proposal.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Swords className="mr-2 h-4 w-4" />
          Propose Match
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose a Team Match</DialogTitle>
          <DialogDescription>Challenge another team to a competitive match.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="opponent">Opponent Team</Label>
            <Select value={opponentTeamId} onValueChange={setOpponentTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team to challenge..." />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name} ({team.city}, {team.state})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Match Format</Label>
            <Select value={matchFormat} onValueChange={setMatchFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best_of_3">Best of 3</SelectItem>
                <SelectItem value="best_of_5">Best of 5</SelectItem>
                <SelectItem value="best_of_7">Best of 7</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Proposed Time</Label>
            <Input
              id="time"
              type="datetime-local"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="e.g., 'Let's play this Saturday at our home courts!'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Swords className="w-4 h-4 mr-2" />}
            Send Challenge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}