
import React, { useState, useEffect } from "react";
import { LadderTournament, LadderParticipant, LadderMatch, Player } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, Plus, Crown, TrendingUp, TrendingDown, X, MapPin } from "lucide-react"; // Added MapPin
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

import TournamentList from "../components/tournaments/TournamentList";
import CreateTournament from "../components/tournaments/CreateTournament";
import TournamentDetails from "../components/tournaments/TournamentDetails";

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [user, setUser] = useState(null); // New state for current user
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserAndPlayer();
  }, []);

  useEffect(() => {
    if (currentPlayer) {
      loadTournaments();
    }
  }, [currentPlayer]); // Reload tournaments when currentPlayer is set

  const loadUserAndPlayer = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await User.me();
      setUser(currentUser); // Set user state

      const players = await Player.filter({ user_id: currentUser.id });
      if (players.length > 0) {
        setCurrentPlayer(players[0]);
      } else {
        setCurrentPlayer(null); // No player associated with this user
      }
    } catch (error) {
      console.error("Error loading user or player:", error);
      setUser(null);
      setCurrentPlayer(null);
      if (error.message.includes("Network")) {
          setError("A network error occurred. Please check your internet connection and try again.");
      } else {
          setError("Failed to load user data. Please try refreshing the page.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadTournaments = async () => {
    setIsLoading(true); // Set loading true at the start of fetch
    setError(null);
    try {
      const [tournamentsData, participantsData] = await Promise.all([
        LadderTournament.list("-created_date"),
        LadderParticipant.list()
      ]);

      // Filter tournaments within 30 miles of current player's location
      let filteredTournaments = tournamentsData;
      
      if (currentPlayer) {
        // Determine search location (current location or home location)
        let searchLat, searchLng;
        if (currentPlayer.use_home_location && currentPlayer.home_latitude && currentPlayer.home_longitude) {
          searchLat = currentPlayer.home_latitude;
          searchLng = currentPlayer.home_longitude;
        } else if (currentPlayer.current_latitude && currentPlayer.current_longitude) {
          searchLat = currentPlayer.current_latitude;
          searchLng = currentPlayer.current_longitude;
        }

        if (searchLat && searchLng) {
          filteredTournaments = tournamentsData.filter(tournament => {
            // For now, we'll assume tournaments are location-agnostic unless we have organizer location
            // In a full implementation, you might want to add location fields to tournaments
            return true; // Show all tournaments for now - can be enhanced with organizer location
          });
        }

        const myParticipations = participantsData.filter(p => p.player_id === currentPlayer.id);
        const myTournamentIds = myParticipations.map(p => p.tournament_id);
        const myTournamentsList = filteredTournaments.filter(t => myTournamentIds.includes(t.id));
        setMyTournaments(myTournamentsList);
      } else {
        setMyTournaments([]); // Clear myTournaments if no current player
      }

      setTournaments(filteredTournaments);
    } catch (error) {
      console.error("Error loading tournaments:", error);
      
      // Improved error handling for tournament loading
      if (error.message.includes('500') || error.response?.status === 500) {
        setError("Server is experiencing issues. Please try again in a few moments.");
      } else if (error.message.includes('ServerSelectionTimeoutError') || error.message.includes('No replica set members')) {
        setError("Database connection temporarily unavailable. Please wait a moment and try again.");
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        setError("Request timed out. Please try again in a few moments.");
      } else if (error.message.includes("Network")) {
        setError("A network error occurred. Please check your internet connection and try again.");
      } else {
        setError("Could not load tournament data. The server may be temporarily unavailable.");
      }
    }
    setIsLoading(false); // Set loading false at the end of fetch
  };

  const handleCreateTournament = async (tournamentData) => {
    setError(null);
    try {
      // Check for duplicate tournaments by name/level/location (simple check)
      const existingTournaments = await LadderTournament.filter({
        name: tournamentData.name,
        ntrp_level: tournamentData.ntrp_level,
        city: tournamentData.city,
        state: tournamentData.state
      });

      if (existingTournaments.length > 0) {
        setError("A tournament with this name, NTRP level, and location already exists. Please choose a different name.");
        return;
      }

      // Advanced check: No more than 3 active tournaments for same level/location/timeframe
      const { city, state, ntrp_level, start_date, end_date } = tournamentData;
      const allTournamentsInLocation = await LadderTournament.filter({
        city: city,
        state: state,
        ntrp_level: ntrp_level,
        status: { "$in": ["open", "active"] }
      });
      
      const newStart = new Date(start_date);
      const newEnd = new Date(end_date);

      const overlappingTournaments = allTournamentsInLocation.filter(t => {
          const oldStart = new Date(t.start_date);
          const oldEnd = new Date(t.end_date);
          // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
          return newStart <= oldEnd && newEnd >= oldStart;
      });
      
      if (overlappingTournaments.length >= 3) {
        setError("No more than 3 tournaments of the same NTRP level can be active in this location at the same time. Please select a different level or date range.");
        return;
      }

      const newTournament = await LadderTournament.create({
        ...tournamentData,
        organizer_id: currentPlayer.id
      });
      
      await loadTournaments();
      setShowCreateForm(false);
      setSelectedTournament(newTournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      setError("Failed to create tournament. Please check your data and try again.");
    }
  };

  const handleDeleteTournament = async (tournament) => {
    if (!user || user.role !== 'admin') {
      setError("Only administrators can delete tournaments.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the tournament "${tournament.name}"? This action cannot be undone and will remove all participants and matches.`
    );

    if (!confirmDelete) return;

    setError(null);
    try {
      // Get all participants and matches for this tournament
      const [participants, matches] = await Promise.all([
        LadderParticipant.filter({ tournament_id: tournament.id }),
        LadderMatch.filter({ tournament_id: tournament.id })
      ]);

      // Delete all matches first
      for (const match of matches) {
        await LadderMatch.delete(match.id);
      }

      // Delete all participants
      for (const participant of participants) {
        await LadderParticipant.delete(participant.id);
      }

      // Finally delete the tournament
      await LadderTournament.delete(tournament.id);

      await loadTournaments();
      
      // If we were viewing this tournament, go back to list
      if (selectedTournament?.id === tournament.id) {
        setSelectedTournament(null);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      setError("Failed to delete tournament. Please try again.");
    }
  };

  const handleJoinTournament = async (tournament) => {
    if (!currentPlayer) {
      setError("Please log in to join a tournament.");
      return;
    }

    setError(null);
    try {
      const participants = await LadderParticipant.filter({ tournament_id: tournament.id });
      
      // Check if player is already in this tournament
      const alreadyJoined = participants.some(p => p.player_id === currentPlayer.id);
      if (alreadyJoined) {
        setError("You're already participating in this tournament!");
        return;
      }

      // Check if tournament is full (only for positional tournaments)
      if (tournament.tournament_type === 'positional' && tournament.max_participants && participants.length >= tournament.max_participants) {
        setError("This tournament is full. Please try joining another tournament.");
        return;
      }

      let participantData;
      
      if (tournament.tournament_type === 'points_robin') {
        // Round robin tournaments - no position limits, start with 0 points
        participantData = {
          tournament_id: tournament.id,
          player_id: currentPlayer.id,
          current_position: participants.length + 1, // Just for ordering, position is not critical in points_robin
          initial_position: participants.length + 1,
          points: 0
        };
      } else {
        // Positional tournaments - assign next available position
        const nextPosition = participants.length + 1;
        participantData = {
          tournament_id: tournament.id,
          player_id: currentPlayer.id,
          current_position: nextPosition,
          initial_position: nextPosition,
          points: 0 // Initialize points for all types
        };
      }

      await LadderParticipant.create(participantData);
      await loadTournaments();
      
      if (tournament.tournament_type === 'points_robin') {
        alert("Successfully joined the round robin tournament! You can now play matches with any other participant.");
      } else {
        alert("Successfully joined the positional ladder tournament!");
      }
    } catch (error) {
      console.error("Error joining tournament:", error);
      setError("Failed to join tournament. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (selectedTournament) {
    return (
      <TournamentDetails
        tournament={selectedTournament}
        currentPlayer={currentPlayer}
        onBack={() => setSelectedTournament(null)}
        onRefresh={loadTournaments}
        onDeleteTournament={handleDeleteTournament} // Pass delete function to details if needed
        isAdmin={user?.role === 'admin'} // Pass isAdmin status
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>An Error Occurred</AlertTitle>
              <AlertDescription>
                {error} <Button variant="link" className="p-0 h-auto" onClick={loadTournaments}>Try again</Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ladder Tournaments</h1>
                <p className="text-gray-600">
                  Compete in skill-based ladder tournaments and climb the rankings
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Tournament
              </Button>
            </div>
          </div>

          {/* My Tournaments */}
          {myTournaments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Tournaments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTournaments.map((tournament) => (
                  <Card 
                    key={tournament.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedTournament(tournament)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tournament.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(tournament.status)}>
                            {tournament.status}
                          </Badge>
                          {user?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card onClick from firing
                                handleDeleteTournament(tournament);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{tournament.city}, {tournament.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Trophy className="w-4 h-4" />
                        <span>NTRP {tournament.ntrp_level}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{tournament.tournament_type === 'points_robin' ? 'Round Robin' : 'Ladder'} Tournament</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Available Tournaments */}
          <TournamentList
            tournaments={tournaments}
            currentPlayer={currentPlayer}
            onSelectTournament={setSelectedTournament}
            onJoinTournament={handleJoinTournament}
            onDeleteTournament={handleDeleteTournament} // Pass the delete handler
            isLoading={isLoading}
            isAdmin={user?.role === 'admin'} // Pass isAdmin status
          />

          {/* Create Tournament Modal */}
          {showCreateForm && (
            <CreateTournament
              onSubmit={handleCreateTournament}
              onCancel={() => setShowCreateForm(false)}
              currentPlayer={currentPlayer}
            />
          )}
        </div>
      </div>
    </div>
  );
}
