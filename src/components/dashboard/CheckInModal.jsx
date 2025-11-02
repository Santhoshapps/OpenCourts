import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function CheckInModal({ court, existingGroups, onCheckIn, onCancel, isLoading, blockedCourtNumbers = [] }) {
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [playType, setPlayType] = useState('singles');
  const [selectedCourtNumber, setSelectedCourtNumber] = useState(null);

  useEffect(() => {
    if (existingGroups.length > 0) {
      setIsJoiningGroup(true);
      setSelectedGroupId(existingGroups[0]?.sessions[0]?.court_number?.toString());
    } else {
      setIsJoiningGroup(false);
    }
  }, [existingGroups]);

  const occupiedCourtNumbers = new Set(existingGroups.flatMap(g => g.sessions.map(s => s.court_number)));
  const allCourtNumbers = Array.from({ length: court.total_courts }, (_, i) => i + 1);

  const availableCourtNumbers = allCourtNumbers.filter(num => 
    !occupiedCourtNumbers.has(num) && !blockedCourtNumbers.includes(num)
  );

  const handleSubmit = () => {
    if (isJoiningGroup && !selectedGroupId) {
      alert("Please select a group to join.");
      return;
    }
    if (!isJoiningGroup && !selectedCourtNumber) {
        alert("Please select an available court number.");
        return;
    }
    onCheckIn({
      isJoiningGroup,
      groupId: selectedGroupId,
      playType,
      selectedCourtNumber: isJoiningGroup ? null : selectedCourtNumber
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check In at {court.name}</DialogTitle>
          <DialogDescription>
            Join an existing group or start a new one on an open court.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {existingGroups.length > 0 && (
            <RadioGroup defaultValue="join" onValueChange={val => setIsJoiningGroup(val === 'join')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="join" id="join" />
                <Label htmlFor="join">Join an Existing Group</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">Start a New Group</Label>
              </div>
            </RadioGroup>
          )}

          {isJoiningGroup ? (
            <div className="space-y-2">
              <Label htmlFor="group-select">Select Group</Label>
              <Select onValueChange={setSelectedGroupId} defaultValue={selectedGroupId}>
                <SelectTrigger id="group-select">
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                  {existingGroups.map(group => (
                    <SelectItem key={group.court_number} value={group.court_number.toString()}>
                      Court {group.court_number}: {group.play_type} ({group.sessions.length}/
                      {group.play_type === 'singles' ? 2 : 4})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Play Type</Label>
                     <Select value={playType} onValueChange={setPlayType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="singles">Singles</SelectItem>
                            <SelectItem value="doubles">Doubles</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {availableCourtNumbers.length > 0 ? (
                    <div className="space-y-2">
                        <Label>Select an Available Court</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableCourtNumbers.map(num => (
                                <Button
                                    key={num}
                                    variant={selectedCourtNumber === num ? 'default' : 'outline'}
                                    onClick={() => setSelectedCourtNumber(num)}
                                    className="h-12 text-sm"
                                >
                                    Court {num}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                     <div className="text-center p-4 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-700">No courts are available to start a new session right now.</p>
                     </div>
                )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || (!isJoiningGroup && availableCourtNumbers.length === 0)}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Check-In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}