import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PickleballTeam, TeamMember, Player } from '@/api/entities';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Clock, LogIn } from 'lucide-react';

export default function JoinTeam() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Processing your invitation...');
  const [team, setTeam] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const processInvitation = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No invitation token provided. The link may be invalid.');
        return;
      }

      try {
        const user = await User.me();
        const teams = await PickleballTeam.filter({ invite_token: token });

        if (teams.length === 0) {
          setStatus('not_found');
          setMessage('This invitation is invalid or has expired.');
          return;
        }

        const targetTeam = teams[0];
        setTeam(targetTeam);

        const [playerData, existingMembership] = await Promise.all([
          Player.filter({ user_id: user.id }),
          TeamMember.filter({ team_id: targetTeam.id })
        ]);
        
        if (playerData.length === 0) {
          setStatus('error');
          setMessage('You need to create a player profile before you can join a team.');
          return;
        }
        
        const currentPlayer = playerData[0];
        const userMembership = existingMembership.find(m => m.player_id === currentPlayer.id);

        if (userMembership) {
          if (userMembership.status === 'member') {
            setStatus('already_member');
            setMessage(`You are already a member of ${targetTeam.name}.`);
          } else if (userMembership.status === 'pending') {
            setStatus('pending');
            setMessage(`You have already requested to join ${targetTeam.name}. Please wait for approval.`);
          }
          setTimeout(() => navigate(createPageUrl(`TeamDetails?id=${targetTeam.id}`)), 3000);
          return;
        }

        // Create a pending membership request
        await TeamMember.create({
          team_id: targetTeam.id,
          player_id: currentPlayer.id,
          role: 'member',
          status: 'pending', // All requests require approval
        });

        setStatus('request_sent');
        setMessage(`Your request to join ${targetTeam.name} has been sent for approval by the team leadership.`);
        setTimeout(() => navigate(createPageUrl(`TeamDetails?id=${targetTeam.id}`)), 3000);

      } catch (error) {
        if (error.message.toLowerCase().includes('unauthorized') || error.response?.status === 401) {
          setStatus('login_required');
          setMessage('You need to sign in or create an account to accept this invitation.');
        } else {
          console.error("Error processing invitation:", error);
          setStatus('error');
          setMessage('An unexpected error occurred. Please try again.');
        }
      }
    };

    processInvitation();
  }, [navigate]);

  const handleLogin = async () => {
    await User.loginWithRedirect(window.location.href);
  };
  
  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />;
      case 'request_sent':
        return <Clock className="w-12 h-12 text-blue-600" />;
      case 'already_member':
        return <Clock className="w-12 h-12 text-green-600" />;
      case 'pending':
        return <Clock className="w-12 h-12 text-orange-600" />;
      case 'login_required':
        return <LogIn className="w-12 h-12 text-blue-600" />;
      case 'error':
      case 'not_found':
      default:
        return <AlertTriangle className="w-12 h-12 text-red-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Invitation...';
      case 'request_sent':
        return 'Request Sent';
      case 'already_member':
        return 'Already a Member';
      case 'pending':
        return 'Request Pending';
      case 'login_required':
        return 'Sign In Required';
      default:
        return 'Team Invitation';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4">{renderStatus()}</div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'login_required' && (
            <Button onClick={handleLogin} className="w-full">Sign In to Continue</Button>
          )}
          {(status === 'error' || status === 'not_found') && (
            <Button onClick={() => navigate(createPageUrl('Teams'))} className="w-full">Back to Teams</Button>
          )}
          {(['request_sent', 'already_member', 'pending'].includes(status)) && (
            <p className="text-sm text-gray-500">Redirecting you to the team page...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}