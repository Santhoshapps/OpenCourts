import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamMember, TeamMatchGame } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { Users, Trophy, Plus, Save, Target, AlertTriangle, Pencil, X, CheckCircle } from "lucide-react";

export default function MatchManagement({ match, teams, players, currentTeamId, isCaptain, onScoreSubmit }) {
    const [proposingTeamMembers, setProposingTeamMembers] = useState([]);
    const [opponentTeamMembers, setOpponentTeamMembers] = useState([]);
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingGameId, setEditingGameId] = useState(null);
    const [tempScores, setTempScores] = useState({ proposing: 0, opponent: 0 });
    const { toast } = useToast();

    const loadMatchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [proposingMembers, opponentMembers, existingGames] = await Promise.all([
                TeamMember.filter({ team_id: match.proposing_team_id, status: 'member' }),
                TeamMember.filter({ team_id: match.opponent_team_id, status: 'member' }),
                TeamMatchGame.filter({ team_match_id: match.id })
            ]);

            setProposingTeamMembers(proposingMembers);
            setOpponentTeamMembers(opponentMembers);
            setGames(existingGames.sort((a, b) => a.game_number - b.game_number));
        } catch (error) {
            console.error("Error loading match data:", error);
            toast({
                title: "Error",
                description: "Failed to load match data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [match.id, match.proposing_team_id, match.opponent_team_id, toast]);

    useEffect(() => {
        loadMatchData();
    }, [loadMatchData]);

    const getAssignedPlayers = (excludeGameId = null) => {
        const assignedPlayers = new Set();
        games.forEach(game => {
            if (excludeGameId && game.id === excludeGameId) return;
            if (game.proposing_team_player1_id) assignedPlayers.add(game.proposing_team_player1_id);
            if (game.proposing_team_player2_id) assignedPlayers.add(game.proposing_team_player2_id);
            if (game.opponent_team_player1_id) assignedPlayers.add(game.opponent_team_player1_id);
            if (game.opponent_team_player2_id) assignedPlayers.add(game.opponent_team_player2_id);
        });
        return assignedPlayers;
    };

    const isPlayerAvailable = (playerId, currentGameId, currentField = null) => {
        const assignedPlayers = getAssignedPlayers(currentGameId);
        if (assignedPlayers.has(playerId)) return false;
        
        const currentGame = games.find(g => g.id === currentGameId);
        if (currentGame) {
            const gameFields = ['proposing_team_player1_id', 'proposing_team_player2_id', 'opponent_team_player1_id', 'opponent_team_player2_id'];
            for (const field of gameFields) {
                if (field !== currentField && currentGame[field] === playerId) return false;
            }
        }
        return true;
    };

    const getAvailablePlayersForField = (gameId, field, teamMembers) => {
      const selectedPlayerId = games.find(g => g.id === gameId)?.[field];
      const teamPlayerIds = teamMembers.map(m => m.player_id);

      return teamMembers.filter(member => 
          member.player_id === selectedPlayerId || isPlayerAvailable(member.player_id, gameId, field)
      );
    };

    const getMatchFormat = () => {
        const formatMap = { 'best_of_3': 3, 'best_of_5': 5, 'best_of_7': 7 };
        return formatMap[match.match_format] || 3;
    };

    const createGame = async () => {
        const gameNumber = games.length + 1;
        const maxGames = getMatchFormat();
        
        if (gameNumber > maxGames) {
            toast({ title: "Maximum Games Reached", variant: "destructive" });
            return;
        }

        try {
            const newGame = await TeamMatchGame.create({ team_match_id: match.id, game_number: gameNumber, status: 'pending' });
            setGames(prev => [...prev, newGame].sort((a,b) => a.game_number - b.game_number));
            toast({ title: `Game ${gameNumber} Added` });
        } catch (error) {
            toast({ title: "Error creating game", variant: "destructive" });
        }
    };

    const updateGamePairing = async (gameId, field, value) => {
        const originalGames = games;
        const newGames = games.map(g => (g.id === gameId ? { ...g, [field]: value } : g));
        setGames(newGames);

        try {
            await TeamMatchGame.update(gameId, { [field]: value });
        } catch (error) {
            toast({ title: "Error updating pairing", variant: "destructive" });
            setGames(originalGames);
        }
    };

    const updateGameScore = async (gameId, proposingScore, opponentScore) => {
        let status = 'in_progress';
        let winnerId = null;

        if ((proposingScore >= 11 || opponentScore >= 11) && Math.abs(proposingScore - opponentScore) >= 2) {
            status = 'completed';
            winnerId = proposingScore > opponentScore ? match.proposing_team_id : match.opponent_team_id;
        }

        const updatedFields = { proposing_team_score: proposingScore, opponent_team_score: opponentScore, status, winner_team_id: winnerId };

        const originalGames = games;
        const newGames = games.map(g => (g.id === gameId ? { ...g, ...updatedFields } : g));
        setGames(newGames.sort((a,b) => a.game_number - b.game_number));

        try {
            await TeamMatchGame.update(gameId, updatedFields);
        } catch (error) {
            toast({ title: "Error updating score", variant: "destructive" });
            setGames(originalGames);
        }
    };

    const handleEditScores = (game) => {
        setEditingGameId(game.id);
        setTempScores({ proposing: game.proposing_team_score || 0, opponent: game.opponent_team_score || 0 });
    };

    const handleSaveScores = async (gameId) => {
        await updateGameScore(gameId, tempScores.proposing, tempScores.opponent);
        setEditingGameId(null);
        toast({ title: "Scores Saved" });
    };

    const handleCancelEdit = () => setEditingGameId(null);

    const handleSubmitFinalScore = () => {
        const completedGames = games.filter(g => g.status === 'completed');
        const maxGames = getMatchFormat();
        const winsNeeded = Math.ceil(maxGames / 2);

        const proposingWins = completedGames.filter(g => g.winner_team_id === match.proposing_team_id).length;
        const opponentWins = completedGames.filter(g => g.winner_team_id === match.opponent_team_id).length;

        if (proposingWins >= winsNeeded || opponentWins >= winsNeeded) {
            const overallWinner = proposingWins >= winsNeeded ? match.proposing_team_id : match.opponent_team_id;
            const finalScore = `${proposingWins}-${opponentWins}`;
            onScoreSubmit(match, overallWinner, finalScore);
        } else {
            toast({ title: "Match Not Complete", description: "Not enough games have been won to determine a match winner.", variant: "destructive" });
        }
    };

    const getPlayerName = (playerId) => players[playerId]?.display_name || 'Unknown';
    const getTeamName = (teamId) => teams[teamId]?.name || 'Unknown';

    const hasInvalidPairings = (game) => {
        const pids = [game.proposing_team_player1_id, game.proposing_team_player2_id, game.opponent_team_player1_id, game.opponent_team_player2_id].filter(Boolean);
        return pids.length !== new Set(pids).size;
    };
    
    const isMyTeam = (teamId) => teamId === currentTeamId;

    if (isLoading) return <div className="animate-pulse">Loading match details...</div>;

    const maxGames = getMatchFormat();
    const completedGames = games.filter(g => g.status === 'completed');
    const proposingWins = completedGames.filter(g => g.winner_team_id === match.proposing_team_id).length;
    const opponentWins = completedGames.filter(g => g.winner_team_id === match.opponent_team_id).length;
    const isMatchOver = proposingWins >= Math.ceil(maxGames / 2) || opponentWins >= Math.ceil(maxGames / 2);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Active Match: {getTeamName(match.proposing_team_id)} vs {getTeamName(match.opponent_team_id)}
                </CardTitle>
                <CardDescription>Format: {match.match_format.replace('_', ' ')}. Current Score: {proposingWins} - {opponentWins}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {games.map((game) => (
                    <Card key={game.id} className="bg-gray-50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Game {game.game_number}
                                {hasInvalidPairings(game) && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            </CardTitle>
                            {game.status === 'completed' && (
                                <Badge className="w-fit bg-green-100 text-green-800">
                                    Winner: {getTeamName(game.winner_team_id)} ({game.proposing_team_score}-{game.opponent_team_score})
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-base font-semibold">{getTeamName(match.proposing_team_id)}</Label>
                                    <div className="space-y-2 mt-2">
                                        <Select disabled={!isCaptain || !isMyTeam(match.proposing_team_id)} value={game.proposing_team_player1_id || ''} onValueChange={(v) => updateGamePairing(game.id, 'proposing_team_player1_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select Player 1" /></SelectTrigger>
                                            <SelectContent>{getAvailablePlayersForField(game.id, 'proposing_team_player1_id', proposingTeamMembers).map(m => <SelectItem key={m.player_id} value={m.player_id}>{getPlayerName(m.player_id)}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select disabled={!isCaptain || !isMyTeam(match.proposing_team_id)} value={game.proposing_team_player2_id || ''} onValueChange={(v) => updateGamePairing(game.id, 'proposing_team_player2_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select Player 2" /></SelectTrigger>
                                            <SelectContent>{getAvailablePlayersForField(game.id, 'proposing_team_player2_id', proposingTeamMembers).map(m => <SelectItem key={m.player_id} value={m.player_id}>{getPlayerName(m.player_id)}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-base font-semibold">{getTeamName(match.opponent_team_id)}</Label>
                                    <div className="space-y-2 mt-2">
                                        <Select disabled={!isCaptain || !isMyTeam(match.opponent_team_id)} value={game.opponent_team_player1_id || ''} onValueChange={(v) => updateGamePairing(game.id, 'opponent_team_player1_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select Player 1" /></SelectTrigger>
                                            <SelectContent>{getAvailablePlayersForField(game.id, 'opponent_team_player1_id', opponentTeamMembers).map(m => <SelectItem key={m.player_id} value={m.player_id}>{getPlayerName(m.player_id)}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select disabled={!isCaptain || !isMyTeam(match.opponent_team_id)} value={game.opponent_team_player2_id || ''} onValueChange={(v) => updateGamePairing(game.id, 'opponent_team_player2_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select Player 2" /></SelectTrigger>
                                            <SelectContent>{getAvailablePlayersForField(game.id, 'opponent_team_player2_id', opponentTeamMembers).map(m => <SelectItem key={m.player_id} value={m.player_id}>{getPlayerName(m.player_id)}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                {editingGameId === game.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>{getTeamName(match.proposing_team_id)} Score</Label>
                                                <Input type="number" min="0" value={tempScores.proposing} onChange={(e) => setTempScores(p => ({...p, proposing: parseInt(e.target.value) || 0}))} className="w-24 mt-1" />
                                            </div>
                                            <div>
                                                <Label>{getTeamName(match.opponent_team_id)} Score</Label>
                                                <Input type="number" min="0" value={tempScores.opponent} onChange={(e) => setTempScores(p => ({...p, opponent: parseInt(e.target.value) || 0}))} className="w-24 mt-1" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}><X className="w-4 h-4 mr-1"/>Cancel</Button>
                                            <Button size="sm" onClick={() => handleSaveScores(game.id)}><Save className="w-4 h-4 mr-1"/>Save</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <div className="text-center"><Label>{getTeamName(match.proposing_team_id)}</Label><p className="text-2xl font-bold">{game.proposing_team_score || 0}</p></div>
                                            <span className="text-gray-400">-</span>
                                            <div className="text-center"><Label>{getTeamName(match.opponent_team_id)}</Label><p className="text-2xl font-bold">{game.opponent_team_score || 0}</p></div>
                                        </div>
                                        {isCaptain && <Button size="sm" variant="outline" onClick={() => handleEditScores(game)}><Pencil className="w-4 h-4 mr-1"/>Edit Scores</Button>}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">First to 11 points, win by 2.</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                <div className="border-t pt-4 space-y-4">
                    {isCaptain && games.length < maxGames && !isMatchOver && (
                        <Button onClick={createGame} variant="secondary" className="w-full">
                            <Plus className="w-4 h-4 mr-2" /> Add Game {games.length + 1}
                        </Button>
                    )}
                    {isCaptain && isMatchOver && (
                        <Button onClick={handleSubmitFinalScore} className="w-full bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" /> Submit Final Score
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}