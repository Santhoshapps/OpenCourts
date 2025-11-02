import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import PlayerCard from '../players/PlayerCard'; // Re-using the player card for consistency

export default function PlayerProfileDialog({ player, onClose }) {
    if (!player) return null;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Player Profile</DialogTitle>
                    <DialogDescription>
                        Review this player's details before making a decision.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                   <PlayerCard 
                       player={player} 
                       onMatchRequest={() => {}} // No match request from here
                       onGetTacticalAdvice={() => {}} // No tactical advice from here
                       isAnalyzing={false}
                       isDialogView={true} // Add a prop to slightly change card behavior if needed
                   />
                </div>
                <div className="flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}