
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Edit, Save, X, BrainCircuit, RefreshCw, ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";

export default function PersonalInfo({
  player,
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  isSaving,
  handleSave,
  handleCancel,
  reanalyzeProfile,
  isAnalyzing,
  setShowDeleteModal,
}) {

  const getAvailabilityColor = (status) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "playing": return "bg-yellow-100 text-yellow-800";
      case "offline": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Personal Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>Update your public profile and playing preferences.</CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="icon" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              {isEditing ? (
                <Input id="display_name" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} />
              ) : (
                <p className="text-gray-900">{player?.display_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              {isEditing ? (
                 <Select value={formData.availability_status} onValueChange={(value) => setFormData({ ...formData, availability_status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="playing">Currently Playing</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
              ) : (
                <Badge className={getAvailabilityColor(player?.availability_status)}>{player?.availability_status || "offline"}</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Preferred Sport</Label>
              {isEditing ? (
                 <Select value={formData.sport_preference} onValueChange={(value) => setFormData({ ...formData, sport_preference: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="pickleball">Pickleball</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
              ) : (
                <p className="text-gray-900 capitalize">{player?.sport_preference || "both"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preferred Style</Label>
              {isEditing ? (
                 <Select value={formData.preferred_play_style} onValueChange={(value) => setFormData({ ...formData, preferred_play_style: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">Singles</SelectItem>
                      <SelectItem value="doubles">Doubles</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
              ) : (
                <p className="text-gray-900 capitalize">{player?.preferred_play_style || "both"}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ntrp_rating">Tennis Skill (NTRP)</Label>
              {isEditing ? (
                <Input id="ntrp_rating" type="number" step="0.5" min="1" max="7" value={formData.ntrp_rating} onChange={(e) => setFormData({ ...formData, ntrp_rating: e.target.value })} />
              ) : (
                <p className="text-gray-900">{player?.ntrp_rating || "Not set"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="utr_rating">Pickleball Skill (UTR)</Label>
               {isEditing ? (
                <Input id="utr_rating" type="number" step="0.1" min="1" max="5" value={formData.utr_rating} onChange={(e) => setFormData({ ...formData, utr_rating: e.target.value })} />
              ) : (
                <p className="text-gray-900">{player?.utr_rating || "Not set"}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
             {isEditing ? (
              <Textarea id="bio" placeholder="Tell other players about your style, what you're looking for, etc." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
            ) : (
              <p className="text-gray-600 whitespace-pre-line">{player?.bio || "No bio provided."}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><BrainCircuit className="w-5 h-5 text-emerald-600"/> AI Profile Analysis</CardTitle>
              <CardDescription>Synthesized from feedback provided by other players.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={reanalyzeProfile} disabled={isAnalyzing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analyze
            </Button>
        </CardHeader>
        <CardContent>
            {player?.llm_summary ? (
                <div className="space-y-4">
                    <p className="italic text-gray-700">"{player.llm_summary}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600"/> Strengths</h4>
                            <div className="flex flex-wrap gap-2">
                                {player.llm_strengths?.map(s => <Badge key={s} variant="outline" className="text-green-800 bg-green-50 border-green-200">{s}</Badge>)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-600"/> Weaknesses</h4>
                            <div className="flex flex-wrap gap-2">
                                {player.llm_weaknesses?.map(w => <Badge key={w} variant="outline" className="text-yellow-800 bg-yellow-50 border-yellow-200">{w}</Badge>)}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500">No feedback analysis available yet. Play matches to get feedback!</p>
            )}
        </CardContent>
      </Card>
      
      {/* Account Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldX className="w-5 h-5 text-red-600"/> Account Actions</CardTitle>
          <CardDescription>Manage your account settings and data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            Delete My Account
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            This action is permanent and cannot be undone. All your data, including matches and feedback, will be erased.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
