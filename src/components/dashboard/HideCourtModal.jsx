import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, EyeOff } from "lucide-react";

export default function HideCourtModal({ court, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    reason: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason) {
      alert("Please select a reason for hiding this court.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gray-600" />
              Hide Court from Dashboard
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            <strong>{court.name}</strong> will be hidden from your dashboard. You can always find it again through the Court Discovery map.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Why are you hiding this court?</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({...formData, reason: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_interested">Not interested in this location</SelectItem>
                  <SelectItem value="too_far">Too far from my area</SelectItem>
                  <SelectItem value="poor_condition">Poor court condition</SelectItem>
                  <SelectItem value="wrong_info">Incorrect information</SelectItem>
                  <SelectItem value="other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional details..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gray-600 hover:bg-gray-700">
                Hide Court
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}