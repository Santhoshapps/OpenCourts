
import React, { useState, useEffect } from "react";
import { LadderParticipant, LadderMatch, Player } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Calendar, Crown, Swords, XCircle, RefreshCw, UserPlus, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LadderStandings from "./LadderStandings";
import MatchProposal from "./MatchProposal";
import MatchHistory from "./MatchHistory";
import ScoreReport from "./ScoreReport";
import InviteFriends from "../invitations/InviteFriends";

export default function TournamentDetails({ tournament, currentPlayer, onBack, onRefresh, onDeleteTournament, isAdmin }) {
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState({});
  const [showMatchProposal, setShowMatchProposal] = useState(false);
  const [showScoreReport, setShowScoreReport] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const userParticipation = participants.find(p => p.player_id === currentPlayer?.id);

  useEffect(() => {
    if (tournament?.id) {
      loadTournamentData();
    }
  }, [tournament?.id]);

  const loadTournamentData = async () => {
    if (!tournament?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [participantsData, matchesData] = await Promise.all([
        LadderParticipant.filter({ tournament_id: tournament.id }),
        LadderMatch.filter({ tournament_id: tournament.id }, "-created_date")
      ]);

      const playerIds = [
        ...new Set([
          ...participantsData.map(p => p.player_id),
          ...matchesData.map(m => m.challenger_id),
          ...matchesData.map(m => m.opponent_id),
        ]),
      ].filter(Boolean);

      let playersData = [];
      if (playerIds.length > 0) {
        playersData = await Player.filter({ id: { "$in": playerIds } });
      }
      
      const playersMap = playersData.reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {});

      setParticipants(participantsData.sort((a, b) => (a.current_position || Infinity) - (b.current_position || Infinity)));
      setMatches(matchesData);
      setPlayers(playersMap);
    } catch (err) {
      console.error("Error loading tournament details:", err);
      
      // Improved error handling for different types of errors
      if (err.message.includes('500') || err.response?.status === 500) {
        setError("The server is experiencing issues. Please try again in a few moments.");
      } else if (err.message.includes('ServerSelectionTimeoutError') || err.message.includes('No replica set members')) {
        setError("Database connection temporarily unavailable. The system is working to restore connectivity. Please try again shortly.");
      } else if (err.message.includes('timeout') || err.message.includes('Timeout')) {
        setError("Request timed out. The server may be busy. Please wait a moment and try again.");
      } else if (err.message.includes('Network Error') || err.code === 'NETWORK_ERROR') {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setError("Failed to load tournament data. Please refresh the page or try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposeMatch = async (matchData) => {
    if (!tournament?.id || !currentPlayer?.id) {
      setError("Missing tournament or player data. Please refresh the page.");
      return;
    }

    setError(null);
    try {
      const challengerParticipant = participants.find(p => p.player_id === currentPlayer.id);
      const opponentParticipant = participants.find(p => p.player_id === matchData.opponent_id);

      if (!challengerParticipant || !opponentParticipant) {
          setError("Could not find participant details. Please refresh.");
          return;
      }

      await LadderMatch.create({
        tournament_id: tournament.id,
        challenger_id: currentPlayer.id,
        opponent_id: matchData.opponent_id,
        proposed_date: matchData.proposed_date,
        proposed_court_ids: matchData.proposed_court_ids,
        challenger_position_before: challengerParticipant.current_position,
        opponent_position_before: opponentParticipant.current_position,
      });

      await loadTournamentData();
      setShowMatchProposal(false);
    } catch (error) {
      console.error("Error proposing match:", error);
      
      // Improved error handling for match proposal
      if (error.message.includes('500') || error.response?.status === 500) {
        setError("Server error while proposing match. Please try again in a few moments.");
      } else if (error.message.includes('ServerSelectionTimeoutError') || error.message.includes('No replica set members')) {
        setError("Database temporarily unavailable. Your match proposal couldn't be saved. Please try again shortly.");
      } else {
        setError("Failed to propose match. Please try again.");
      }
    }
  };
  
  const handleReportScore = async (match, score, winnerId) => {
    if (!tournament?.tournament_type) {
      setError("Tournament data is incomplete. Please refresh the page.");
      return;
    }

    setError(null);
    try {
        await LadderMatch.update(match.id, {
            score,
            winner_id: winnerId,
            status: "completed",
        });

        const winnerParticipant = participants.find(p => p.player_id === winnerId);
        const loserId = match.challenger_id === winnerId ? match.opponent_id : match.challenger_id;
        const loserParticipant = participants.find(p => p.player_id === loserId);

        if (tournament.tournament_type === 'positional' && winnerId === match.challenger_id && winnerParticipant.current_position > loserParticipant.current_position) {
            // Challenger wins and is lower on the ladder, they swap positions
            await Promise.all([
                LadderParticipant.update(winnerParticipant.id, { current_position: loserParticipant.current_position }),
                LadderParticipant.update(loserParticipant.id, { current_position: winnerParticipant.current_position })
            ]);
        } else if (tournament.tournament_type === 'points_robin') {
            // Winner gets points
            await LadderParticipant.update(winnerParticipant.id, { points: (winnerParticipant.points || 0) + 10 });
        }
        
        setShowScoreReport(false);
        setSelectedMatch(null);
        await loadTournamentData();
        if(onRefresh) onRefresh();

    } catch (error) {
        console.error("Error reporting score:", error);
        
        // Improved error handling for score reporting
        if (error.message.includes('500') || error.response?.status === 500) {
          setError("Server error while saving score. Please try again in a few moments.");
        } else if (error.message.includes('ServerSelectionTimeoutError') || error.message.includes('No replica set members')) {
          setError("Database temporarily unavailable. Your score couldn't be saved. Please try again shortly.");
        } else {
          setError("Failed to report score. Please try again.");
        }
    }
  };

  const handleStatusChange = async (match, newStatus) => {
    setError(null);
    try {
        await LadderMatch.update(match.id, { status: newStatus });
        await loadTournamentData();
    } catch (error) {
        console.error("Error updating match status:", error);
        
        // Improved error handling for status changes
        if (error.message.includes('500') || error.response?.status === 500) {
          setError("Server error while updating match status. Please try again in a few moments.");
        } else if (error.message.includes('ServerSelectionTimeoutError') || error.message.includes('No replica set members')) {
          setError("Database temporarily unavailable. Status couldn't be updated. Please try again shortly.");
        } else {
          setError("Failed to update match status. Please try again.");
        }
    }
  };

  const canProposeMatch = () => {
    return userParticipation && tournament?.status && (tournament.status === "active" || tournament.status === "open");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  // Show loading if tournament data is not available
  if (!tournament || isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tournaments
        </Button>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournaments
          </Button>
          <div className="flex items-start gap-4">
            <Trophy className="w-10 h-10 text-yellow-500 shrink-0" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{tournament.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {tournament.city}, {tournament.state}</div>
                <Badge variant="outline">{tournament.ntrp_level} NTRP</Badge>
                <Badge className={getStatusColor(tournament.status)}>{tournament.status}</Badge>
                <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {participants.length} participants</div>
                {tournament?.tournament_type === 'positional' && <div className="flex items-center gap-1"><Crown className="w-4 h-4" /> Positional Ladder</div>}
                {tournament?.tournament_type === 'points_robin' && <div className="flex items-center gap-1"><Crown className="w-4 h-4" /> Round Robin</div>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-start lg:justify-end gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadTournamentData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowInviteFriends(true)}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite to Tournament
          </Button>
          {canProposeMatch() && (
            <Button onClick={() => setShowMatchProposal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Swords className="w-4 h-4 mr-2" />
              Propose Match
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Unable to Load Tournament Data</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadTournamentData}
                className="mr-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
              >
                Back to Tournaments
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <MatchHistory
            matches={matches}
            players={players}
            currentPlayerId={currentPlayer?.id}
            onStatusChange={handleStatusChange}
            onReportScore={(match) => { setSelectedMatch(match); setShowScoreReport(true); }}
            isAdmin={isAdmin}
          />
        </div>
        <div className="space-y-6">
          <LadderStandings
            participants={participants}
            players={players}
            tournamentType={tournament?.tournament_type}
          />
        </div>
      </div>

      {showInviteFriends && (
        <InviteFriends
          currentPlayer={currentPlayer}
          tournaments={[tournament]}
          onClose={() => setShowInviteFriends(false)}
        />
      )}

      {showMatchProposal && (
        <MatchProposal
          tournament={tournament}
          participants={participants}
          players={players}
          currentPlayer={currentPlayer}
          onSubmit={handleProposeMatch}
          onCancel={() => setShowMatchProposal(false)}
        />
      )}

      {showScoreReport && selectedMatch && (
        <ScoreReport
          match={selectedMatch}
          players={players}
          onSubmit={handleReportScore}
          onCancel={() => { setShowScoreReport(false); setSelectedMatch(null); }}
        />
      )}
    </div>
  );
}
