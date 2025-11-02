
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Player, PlayerMatch, FavoriteCourt } from "@/api/entities"; // Added FavoriteCourt import
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Star, MessageSquare, Filter, Search, BrainCircuit } from "lucide-react";

import PlayerCard from "../components/players/PlayerCard";
import MatchRequest from "../components/players/MatchRequest";
import TacticalAdviceModal from "../components/players/TacticalAdviceModal";

// Helper function moved outside the component to ensure stability
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Players() {
  const [allPlayers, setAllPlayers] = useState([]); // Renamed 'players' to 'allPlayers' for clarity
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null); // This will hold the Player entity for the current user
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showMatchRequest, setShowMatchRequest] = useState(false);
  const [filters, setFilters] = useState({
    skillLevel: "all",
    playStyle: "all",
    distance: "all",
    search: "",
    behavioralSearch: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showTacticalAdvice, setShowTacticalAdvice] = useState(false);
  const [tacticalAdvice, setTacticalAdvice] = useState(null);
  const [analyzingPlayer, setAnalyzingPlayer] = useState(null);
  const [favoriteCourts, setFavoriteCourts] = useState([]); // New state for favorite courts
  const [error, setError] = useState(null); // New state for error messages
  const [networkRetryCount, setNetworkRetryCount] = useState(0);

  const mountedRef = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Network retry helper memoized for stability
  const retryNetworkRequest = useCallback(async (requestFn, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.log(`Network request failed (attempt ${attempt}):`, error);

        const isNetworkError = error.message?.includes('Network Error') ||
          error.message?.includes('ERR_NETWORK') ||
          error.code === 'NETWORK_ERROR' ||
          (error.message && error.message.toLowerCase().includes('failed to fetch')) ||
          !navigator.onLine;

        if (attempt === maxRetries) {
          if (isNetworkError) {
            throw new Error('NETWORK_ERROR');
          }
          throw error;
        }

        if (isNetworkError) {
          // Exponential back-off
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        // If it's not a network error, rethrow immediately
        throw error;
      }
    }
  }, []); // Dependencies: setError and setNetworkRetryCount are stable setters, navigator.onLine is global

  // Memoize loadPlayers to avoid dependency issues
  const loadPlayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await retryNetworkRequest(async () => {
        const user = await User.me();

        // Load current player's Player entity, crucial for sending requests or getting advice
        const currentPlayerData = await Player.filter({ user_id: user.id });
        if (currentPlayerData.length > 0) {
          setCurrentPlayer(currentPlayerData[0]);
        } else {
          // If the current user doesn't have a Player profile, display an error
          setError("Your player profile could not be loaded. Please ensure it's set up in your profile settings.");
          setIsLoading(false);
          return;
        }

        const [allPlayersRawData, favoriteCourtsData] = await Promise.all([
          Player.list(),
          FavoriteCourt.filter({ player_id: user.id }) // Fetch favorite courts for the current user
        ]);

        // Filter out the current user's player profile from the list of all players
        const otherPlayers = allPlayersRawData.filter(player => player.user_id !== user.id);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!mountedRef.current) return; // Prevent state update on unmounted component
              const playersWithDistance = otherPlayers
                .map(player => ({
                  ...player,
                  distance: player.current_latitude && player.current_longitude
                    ? calculateDistance(
                      position.coords.latitude,
                      position.coords.longitude,
                      player.current_latitude,
                      player.current_longitude
                    )
                    : null
                }))
                .filter(player => player.distance === null || player.distance <= 25); // Only show players within 25 miles
              setAllPlayers(playersWithDistance); // Set the main list of players (excluding self, with distance)
              setFilteredPlayers(playersWithDistance); // Initialize filtered players
            },
            () => {
              if (!mountedRef.current) return; // Prevent state update on unmounted component
              // If geolocation fails or is denied, show all players without distance info
              setAllPlayers(otherPlayers);
              setFilteredPlayers(otherPlayers);
              console.warn("Geolocation permission denied or failed. Players shown without distance information.");
            }
          );
        } else {
          // If geolocation is not supported by the browser
          setAllPlayers(otherPlayers);
          setFilteredPlayers(otherPlayers);
          console.warn("Geolocation not supported by this browser. Players shown without distance information.");
        }
        setFavoriteCourts(favoriteCourtsData); // Set favorite courts data
      });
    } catch (err) {
      console.error("Error loading players:", err);

      if (err.message === 'NETWORK_ERROR' || !navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection and try again.");
        setNetworkRetryCount(prev => prev + 1);
      } else if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
      } else if (err.response?.status >= 500) {
        setError("Server is experiencing issues. Please try again in a few moments.");
      } else {
        setError(`Failed to load players. Please try again later. ${err.message || ""}`);
      }
    } finally {
      setIsLoading(false); // Ensure loading state is reset regardless of success or failure
    }
  }, [retryNetworkRequest, networkRetryCount, setError, setIsLoading, setCurrentPlayer, setAllPlayers, setFilteredPlayers, setFavoriteCourts]);

  // Memoize filterPlayers to avoid dependency issues
  const filterPlayers = useCallback(() => {
    let filtered = [...allPlayers];

    // Behavioral search
    if (filters.behavioralSearch) {
      const query = filters.behavioralSearch.toLowerCase();
      filtered = filtered.filter(player =>
        player.llm_summary?.toLowerCase().includes(query) ||
        player.llm_playing_style?.toLowerCase().includes(query) ||
        player.llm_strengths?.some(s => s.toLowerCase().includes(query)) ||
        player.llm_weaknesses?.some(w => w.toLowerCase().includes(query))
      );
    }

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(player =>
        player.display_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        player.bio?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Skill level filter
    if (filters.skillLevel !== "all") {
      const [min, max] = filters.skillLevel.split("-").map(Number);
      filtered = filtered.filter(player => {
        const rating = player.ntrp_rating || player.utr_rating || 0;
        return rating >= min && rating <= max;
      });
    }

    // Play style filter
    if (filters.playStyle !== "all") {
      filtered = filtered.filter(player =>
        player.preferred_play_style === filters.playStyle ||
        player.preferred_play_style === "both"
      );
    }

    // Distance filter
    if (filters.distance !== "all") {
      const maxDistance = parseInt(filters.distance);
      filtered = filtered.filter(player =>
        player.distance === null || player.distance <= maxDistance
      );
    }

    // Sort by distance, then by skill compatibility
    filtered.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    setFilteredPlayers(filtered);
  }, [allPlayers, filters, setFilteredPlayers]);


  useEffect(() => {
    loadPlayers(); // Now only one comprehensive load function
  }, [loadPlayers]); // Dependency changed to memoized loadPlayers

  useEffect(() => {
    filterPlayers();
  }, [filterPlayers]); // Dependency changed to memoized filterPlayers


  const handleSendMatchRequest = async (matchData) => {
    if (!currentPlayer) {
      alert("Your profile is not loaded. Cannot send match request. Please try refreshing the page.");
      return;
    }
    try {
      const newMatch = await PlayerMatch.create({
        player1_id: currentPlayer.id,
        player2_id: selectedPlayer.id,
        match_type: matchData.matchType,
        scheduled_time: matchData.scheduledTime,
        skill_compatibility: calculateSkillCompatibility(currentPlayer, selectedPlayer),
        message: matchData.message || null
      });

      // Schedule AI court suggestion 30 minutes before match time
      await scheduleCourtSuggestion(newMatch);

      alert("Match request sent successfully! You'll receive court suggestions 30 minutes before your match.");
      setShowMatchRequest(false);
      setSelectedPlayer(null);
    } catch (error) {
      console.error("Error sending match request:", error);
      alert("Failed to send match request. Please try again.");
    }
  };

  const scheduleCourtSuggestion = async (match) => {
    try {
      // This would typically be handled by a background service
      // For now, we'll store the scheduling request in a simple way
      const scheduledTime = new Date(match.scheduled_time);
      const suggestionTime = new Date(scheduledTime.getTime() - 30 * 60 * 1000); // 30 minutes before

      // In a real implementation, this would schedule a background job
      // For demonstration, we'll use setTimeout for immediate testing (not recommended for production)
      const timeUntilSuggestion = suggestionTime.getTime() - new Date().getTime();

      if (timeUntilSuggestion > 0) {
        console.log(`Court suggestions will be sent ${timeUntilSuggestion / 1000 / 60} minutes from now`);
        // In production, this would be handled by a proper job queue/cron job
      }
    } catch (error) {
      console.error("Error scheduling court suggestion:", error);
    }
  };

  const calculateSkillCompatibility = (player1, player2) => {
    const p1Rating = player1.ntrp_rating || player1.utr_rating || 3;
    const p2Rating = player2.ntrp_rating || player2.utr_rating || 3;
    const diff = Math.abs(p1Rating - p2Rating);
    return Math.max(1, 10 - diff * 2);
  };

  const getTacticalAdvice = async (opponent) => {
    if (!currentPlayer) {
      alert("Could not load your profile to generate advice. Please try refreshing the page.");
      return;
    }

    setAnalyzingPlayer(opponent.id);
    setTacticalAdvice(null); // Clear previous advice

    try {
      await retryNetworkRequest(async () => {
        const prompt = `
        Generate tactical advice for a tennis match.

        MY PROFILE:
        - Skill Rating (NTRP): ${currentPlayer.ntrp_rating || 'Not set'}
        - Playing Style: ${currentPlayer.llm_playing_style || currentPlayer.preferred_play_style}
        - My Strengths: ${currentPlayer.llm_strengths?.join(', ') || 'Not analyzed'}
        - My Weaknesses: ${currentPlayer.llm_weaknesses?.join(', ') || 'Not analyzed'}

        OPPONENT'S PROFILE:
        - Name: ${opponent.display_name}
        - Skill Rating (NTRP): ${opponent.ntrp_rating || 'Not set'}
        - Playing Style: ${opponent.llm_playing_style || opponent.preferred_play_style}
        - Their Strengths: ${opponent.llm_strengths?.join(', ') || 'Not analyzed'}
        - Their Weaknesses: ${opponent.llm_weaknesses?.join(', ') || 'Not analyzed'}

        Based on this comparison, provide a concise, actionable game plan for me to play against my opponent. Focus on how I can use my strengths to exploit their weaknesses, and how to defend against their strengths.
        `;

        const adviceSchema = {
          type: "object",
          properties: {
            key_matchup: { type: "string", description: "A one-sentence summary of the core dynamic of this matchup." },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "A short title for the tactical point (e.g., 'Attack the Backhand')." },
                  details: { type: "string", description: "A detailed explanation of the tactic." }
                }
              }
            }
          },
          required: ["key_matchup", "recommendations"]
        };

        const result = await InvokeLLM({
          prompt: prompt,
          response_json_schema: adviceSchema
        });

        if (result) {
          setTacticalAdvice(result);
          setShowTacticalAdvice(true);
        }
      });

    } catch (error) {
      console.error("Error getting tactical advice:", error);

      if (error.message === 'NETWORK_ERROR' || !navigator.onLine) {
        alert("Network connection issue. Please check your internet connection and try again.");
      } else if (error.response?.status === 429) {
        alert("Too many requests. Please wait a moment and try again.");
      } else if (error.response?.status >= 500) {
        alert("Server error while generating tactical advice. Please try again in a few moments.");
      } else {
        alert("Could not generate tactical advice at this time. Please try again later.");
      }
    } finally {
      setAnalyzingPlayer(null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Players</h1>
            <p className="text-gray-600">
              Connect with tennis players near you and arrange matches
            </p>
          </div>

          {/* Enhanced Error Display with network status */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error}</span>
              {error.includes("offline") && (
                <div className="mt-2 text-sm">
                  <p>Network Status: {navigator.onLine ? "Connected" : "⚠️ Offline"}</p>
                  {networkRetryCount > 0 && <p>Retry attempts: {networkRetryCount}</p>}
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <BrainCircuit className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Behavioral Search (e.g., 'aggressive baseliner with strong forehand')"
                    value={filters.behavioralSearch}
                    onChange={(e) => setFilters({ ...filters, behavioralSearch: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={filters.skillLevel}
                    onValueChange={(value) => setFilters({ ...filters, skillLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Skill Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="1-2">Beginner (1-2)</SelectItem>
                      <SelectItem value="2-3">Intermediate (2-3)</SelectItem>
                      <SelectItem value="3-4">Advanced (3-4)</SelectItem>
                      <SelectItem value="4-5">Expert (4-5)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.playStyle}
                    onValueChange={(value) => setFilters({ ...filters, playStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Play Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Styles</SelectItem>
                      <SelectItem value="singles">Singles</SelectItem>
                      <SelectItem value="doubles">Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.distance}
                    onValueChange={(value) => setFilters({ ...filters, distance: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Distance</SelectItem>
                      <SelectItem value="5">Within 5 miles</SelectItem>
                      <SelectItem value="10">Within 10 miles</SelectItem>
                      <SelectItem value="15">Within 15 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card>
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : filteredPlayers.length === 0 && !error ? ( // Only show "No players found" if no error
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-600">Try adjusting your filters to find more players</p>
              </div>
            ) : (
              filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onMatchRequest={() => {
                    setSelectedPlayer(player);
                    setShowMatchRequest(true);
                  }}
                  onGetTacticalAdvice={getTacticalAdvice}
                  isAnalyzing={analyzingPlayer === player.id}
                />
              ))
            )}
          </div>

          {/* Match Request Modal */}
          {showMatchRequest && selectedPlayer && (
            <MatchRequest
              player={selectedPlayer}
              onSend={handleSendMatchRequest}
              onCancel={() => {
                setShowMatchRequest(false);
                setSelectedPlayer(null);
              }}
            />
          )}

          {/* Tactical Advice Modal */}
          {showTacticalAdvice && tacticalAdvice && (
            <TacticalAdviceModal
              advice={tacticalAdvice}
              onClose={() => setShowTacticalAdvice(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
