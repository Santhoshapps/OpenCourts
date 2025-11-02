
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerInvitation } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { UserPlus, Share2, Copy, Check, X, Mail, Trophy } from "lucide-react";

export default function InviteFriends({ currentPlayer, tournaments, onClose }) {
  const [inviteType, setInviteType] = useState("app_referral");
  const [formData, setFormData] = useState({
    invitee_email: "",
    invitee_name: "",
    tournament_id: "",
    personal_message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const generateInvitationCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateReferralLink = (code) => {
    let host = window.location.host;

    // If in a preview environment, construct a production-like URL
    if (host.startsWith('preview--')) {
        host = host
            .replace(/^preview--/, '')
            .replace(/-[a-f0-9]+/, ''); // Removes the unique hash
    }

    // Always ensure the production-friendly domain is used by removing the platform's domain part
    host = host.replace('.base44', '');

    const cleanOrigin = `${window.location.protocol}//${host}`;
    
    // Create a clean referral URL structure
    return `${cleanOrigin}/join/${code}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const invitationCode = generateInvitationCode();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      // Create invitation record
      await PlayerInvitation.create({
        inviter_id: currentPlayer.id,
        invitee_email: formData.invitee_email,
        invitee_name: formData.invitee_name || null,
        invitation_type: inviteType,
        tournament_id: inviteType === 'tournament_invite' ? formData.tournament_id : null,
        personal_message: formData.personal_message || null,
        invitation_code: invitationCode,
        expires_at: expiresAt
      });

      // Generate email content based on invitation type
      const referralLink = generateReferralLink(invitationCode);
      let subject, body;

      if (inviteType === 'app_referral') {
        subject = `${currentPlayer.display_name} invited you to join OpenCourts!`;
        body = `Hi${formData.invitee_name ? ` ${formData.invitee_name}` : ''}!

${currentPlayer.display_name} has invited you to join OpenCourts - the best app for finding tennis courts and connecting with players.

${formData.personal_message ? `Personal message: "${formData.personal_message}"` : ''}

Join OpenCourts to:
• Find nearby tennis courts with real-time availability
• Connect with players at your skill level
• Join ladder tournaments and track your progress
• Never play alone again!

Click here to get started: ${referralLink}

This invitation expires in 30 days.

See you on the courts!
The OpenCourts Team`;
      } else if (inviteType === 'tournament_invite') {
        const tournament = tournaments.find(t => t.id === formData.tournament_id);
        subject = `${currentPlayer.display_name} invited you to join a tennis tournament!`;
        body = `Hi${formData.invitee_name ? ` ${formData.invitee_name}` : ''}!

${currentPlayer.display_name} has invited you to join the "${tournament?.name}" tournament on OpenCourts.

Tournament Details:
• Name: ${tournament?.name}
• NTRP Level: ${tournament?.ntrp_level}
• Type: ${tournament?.tournament_type === 'points_robin' ? 'Round Robin' : 'Positional Ladder'}
• Start Date: ${tournament ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}

${formData.personal_message ? `Personal message: "${formData.personal_message}"` : ''}

Join OpenCourts and this tournament: ${referralLink}

This invitation expires in 30 days.

Game, set, match!
The OpenCourts Team`;
      }

      // Send invitation email
      await SendEmail({
        to: formData.invitee_email,
        subject: subject,
        body: body
      });

      alert("Invitation sent successfully!");
      
      // Reset form
      setFormData({
        invitee_email: "",
        invitee_name: "",
        tournament_id: "",
        personal_message: ""
      });

    } catch (error) {
      console.error("Error sending invitation:", error);
      alert("Failed to send invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const myReferralCode = `${currentPlayer.id}_${Date.now().toString(36)}`;
  const myReferralLink = generateReferralLink(myReferralCode);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Invite Friends
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Share Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Quick Share
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="text-sm text-gray-600">Share your personal referral link:</p>
              <div className="flex items-center gap-2">
                <Input 
                  value={myReferralLink} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(myReferralLink, 'link')}
                >
                  {copiedCode === 'link' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Personalized Invitation Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Send Personalized Invitation
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Invitation Type</Label>
                <Select value={inviteType} onValueChange={setInviteType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app_referral">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Join OpenCourts
                      </div>
                    </SelectItem>
                    <SelectItem value="tournament_invite">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Join Tournament
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Friend's Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    value={formData.invitee_email}
                    onChange={(e) => setFormData({...formData, invitee_email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Friend's Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.invitee_name}
                    onChange={(e) => setFormData({...formData, invitee_name: e.target.value})}
                  />
                </div>
              </div>

              {inviteType === 'tournament_invite' && (
                <div className="space-y-2">
                  <Label>Select Tournament</Label>
                  <Select
                    value={formData.tournament_id}
                    onValueChange={(value) => setFormData({...formData, tournament_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.filter(t => t.status === 'open').map(tournament => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name} (NTRP {tournament.ntrp_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Hey! I found this great tennis app and thought you'd love it..."
                  rows={3}
                  value={formData.personal_message}
                  onChange={(e) => setFormData({...formData, personal_message: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
