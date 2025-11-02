import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Target, Users, Play, Crown, Trophy, Globe, Swords, User, Star } from 'lucide-react';

const basketballFormats = [
  { value: 'shootaround', label: 'Shootaround', description: 'Individual or group practice, no structured game.', icon: Target },
  { value: '1v1', label: '1v1 / King of the Court', description: 'Winner stays on, rotation of challengers.', icon: Crown },
  { value: '2v2', label: '2v2 Half-Court', description: 'Quick games, often make-it-take-it.', icon: Swords },
  { value: '3v3', label: '3v3 Half-Court', description: 'The most common pick-up format.', icon: Users },
  { value: '5v5', label: '5v5 Full-Court', description: 'Classic pick-up game, usually winner stays.', icon: Users },
  { value: '21_cutthroat', label: '21 / Cutthroat', description: 'Every player for themselves, free-for-all.', icon: User },
  { value: 'knockout', label: 'Knockout / Lightning', description: 'Fast-paced shooting elimination game.', icon: Trophy },
  { value: 'horse', label: 'H.O.R.S.E.', description: 'Shot-mimicking elimination game.', icon: Star },
  { value: 'around_the_world', label: 'Around the World', description: 'Progressive shooting contest from set spots.', icon: Globe },
];

export default function BasketballCheckInModal({ court, onCheckIn, onCancel, isLoading }) {
  const [primaryActivity, setPrimaryActivity] = useState('shootaround');
  const [openTo, setOpenTo] = useState([]);
  const [courtArea, setCourtArea] = useState('half');
  const [courtNumber, setCourtNumber] = useState(1);

  const handleOpenToChange = (formatValue) => {
    setOpenTo(prev => 
      prev.includes(formatValue) 
        ? prev.filter(item => item !== formatValue) 
        : [...prev, formatValue]
    );
  };

  const handleSubmit = () => {
    onCheckIn({
      playType: primaryActivity,
      open_to: openTo,
      courtArea,
      courtNumber
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Check In at {court.name}</DialogTitle>
          <DialogDescription>
            Let others know what you're playing and what you're open to.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Primary Activity Column */}
          <div className="space-y-4">
            <Label className="text-base font-medium">What are you here for?</Label>
            <RadioGroup value={primaryActivity} onValueChange={setPrimaryActivity} className="space-y-2">
              {basketballFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <Label key={format.value} htmlFor={`primary-${format.value}`} className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${primaryActivity === format.value ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50'}`}>
                    <RadioGroupItem value={format.value} id={`primary-${format.value}`} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">{format.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Open To Column */}
          <div className="space-y-4">
            <Label className="text-base font-medium">What are you open to?</Label>
            <div className="space-y-2">
              {basketballFormats.map(format => {
                 const Icon = format.icon;
                 const isChecked = openTo.includes(format.value);
                 const isDisabled = primaryActivity === format.value;

                 return (
                    <div key={`open-${format.value}`} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${isDisabled ? 'bg-gray-100 opacity-60' : 'cursor-pointer hover:bg-gray-50'}`} onClick={() => !isDisabled && handleOpenToChange(format.value)}>
                        <Checkbox 
                            id={`open-${format.value}`}
                            checked={isChecked}
                            onCheckedChange={() => !isDisabled && handleOpenToChange(format.value)}
                            disabled={isDisabled}
                        />
                         <div className="flex-1">
                           <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <Label htmlFor={`open-${format.value}`} className={`font-medium ${isDisabled ? 'text-gray-500' : 'cursor-pointer'}`}>{format.label}</Label>
                           </div>
                        </div>
                    </div>
                 )
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Check-In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}