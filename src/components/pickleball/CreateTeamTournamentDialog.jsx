
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PickleballTournament, PickleballParticipant } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trophy } from 'lucide-react';
import { TOURNAMENT_FORMATS } from '@/components/pickleball/constants'; // Updated import path

export default function CreateTeamTournamentDialog({ team, onTournamentCreated }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
      name: '',
      format: '',
      skill_level: team.skill_level || 'recreational',
      start_date: '',
      end_date: '',
      city: team.city || '',
      state: team.state || '',
      description: '',
  });

  const teamFormats = Object.entries(TOURNAMENT_FORMATS).filter(([key]) => key.includes('team') || key.includes('partner'));

  const handleSubmit = async () => {
    if (!formData.name || !formData.format || !formData.start_date || !formData.end_date) {
      toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const newTournament = await PickleballTournament.create({
        ...formData,
        organizer_team_id: team.id,
        participant_type: 'team',
      });

      // Automatically add the organizing team as a participant
      await PickleballParticipant.create({
          tournament_id: newTournament.id,
          team_id: team.id,
          status: 'active'
      });

      toast({ title: "Tournament Created!", description: "Your tournament has been successfully created." });
      setOpen(false);
      
      if (onTournamentCreated) {
        onTournamentCreated(newTournament);
      }
    } catch (error) {
      console.error("Failed to create tournament:", error);
      toast({ title: "Error", description: "Failed to create the tournament.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Trophy className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create a New Team Tournament</DialogTitle>
          <DialogDescription>Set up a tournament and invite other teams to compete.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Tournament Format</Label>
            <Select value={formData.format} onValueChange={value => setFormData({...formData, format: value})}>
              <SelectTrigger><SelectValue placeholder="Select a format..." /></SelectTrigger>
              <SelectContent>
                {teamFormats.map(([key, format]) => (
                  <SelectItem key={key} value={key}>{format.icon} {format.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="skill_level">Skill Level</Label>
            <Select value={formData.skill_level} onValueChange={value => setFormData({...formData, skill_level: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recreational">Recreational</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="competitive">Competitive</SelectItem>
                <SelectItem value="open">Open</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
            Create Tournament
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
