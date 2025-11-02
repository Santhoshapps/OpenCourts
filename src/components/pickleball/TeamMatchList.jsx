
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Swords, Calendar, Trophy, MessageSquare, Pencil } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamMatchList({
  title,
  matches,
  teams,
  currentTeamId,
  canManage,
  onAccept,
  onDecline,
  onManageMatch,
  onConfirmScore,
  onRejectScore
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'proposed': return 'bg-yellow-100 text-yellow-800';
      case 'pending_confirmation': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatText = (format) => {
    return format.replace('_', ' ').replace('best of', 'Best of');
  }

  if (matches.length === 0) {
    return null; // Don't render the card if there are no matches of this type
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => {
            const isProposer = match.proposing_team_id === currentTeamId;
            const otherTeamId = isProposer ? match.opponent_team_id : match.proposing_team_id;
            const otherTeam = teams[otherTeamId];

            return (
              <div key={match.id} className="p-3 bg-gray-50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">vs {otherTeam?.name || 'Unknown Team'}</p>
                    <Badge variant="outline">{getFormatText(match.match_format)}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(match.proposed_time), 'MMM d, yyyy @ h:mm a')}</span>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                     <Badge className={getStatusBadge(match.status)}>{match.status}</Badge>
                   </div>
                   {match.message && (
                    <div className="flex items-start gap-2 text-sm text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="italic">"{match.message}"</p>
                    </div>
                   )}
                   {match.status === 'completed' && (
                     <div className="flex items-center gap-2 text-sm font-semibold mt-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>Winner: {teams[match.winner_team_id]?.name || 'N/A'}</span>
                        <span>({match.score})</span>
                     </div>
                   )}
                   {match.status === 'pending_confirmation' && (
                       <div className="flex items-center gap-2 text-sm font-semibold mt-1">
                        <Trophy className="w-4 h-4 text-orange-500" />
                        <span>Proposed Winner: {teams[match.winner_team_id]?.name || 'N/A'}</span>
                        <span>({match.score})</span>
                        <Badge variant="outline" className="text-orange-700 border-orange-300">Awaiting Confirmation</Badge>
                     </div>
                   )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Actions for incoming proposals */}
                  {match.status === 'proposed' && !isProposer && canManage && (
                    <>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => onAccept(match)}>
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDecline(match)}>
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </>
                  )}
                  {/* Actions for scores pending confirmation */}
                  {match.status === 'pending_confirmation' && match.score_submitted_by_team_id !== currentTeamId && canManage && (
                    <>
                       <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => onConfirmScore(match)}>
                        <Check className="w-4 h-4 mr-1" /> Confirm Score
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onRejectScore(match)}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {/* Action for accepted or completed matches */}
                  {(match.status === 'accepted' || match.status === 'completed') && canManage && onManageMatch && (
                     <Button size="sm" variant="outline" onClick={() => onManageMatch(match)}>
                        {match.status === 'accepted' ? 
                            <Trophy className="w-4 h-4 mr-1" /> : 
                            <Pencil className="w-4 h-4 mr-1" />
                        }
                        {match.status === 'accepted' ? 'Manage Match' : 'Edit Result'}
                      </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
