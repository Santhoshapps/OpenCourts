
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, UserPlus, LogOut, Navigation, Heart, HeartOff, EyeOff, Calendar, Target, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CourtSession, FavoriteCourt, HiddenCourt } from "@/api/entities";
import { format } from "date-fns";
import HideCourtModal from "../dashboard/HideCourtModal";
import BasketballCheckInModal from "./BasketballCheckInModal";

const formatPlayType = (playType) => {
    if (!playType) return "Unknown";
    return playType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function BasketballCourtList({
  courts,
  activeSessions,
  courtBlocks,
  isLoading,
  onRefresh,
  currentPlayer
}) {
  const [isJoining, setIsJoining] = useState(null);
  const [favoriteCourts, setFavoriteCourts] = useState([]);
  const [hiddenCourts, setHiddenCourts] = useState([]);
  const [showHideModal, setShowHideModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  const isGuest = currentPlayer?.is_guest || false;

  const loadFavoriteCourts = useCallback(async () => {
    if (!currentPlayer || isGuest) return;
    try {
      const favorites = await FavoriteCourt.filter({ player_id: currentPlayer.id });
      setFavoriteCourts(favorites);
    } catch (error) {
      console.error("Error loading favorite courts:", error);
    }
  }, [currentPlayer, isGuest]);

  const loadHiddenCourts = useCallback(async () => {
    if (!currentPlayer || isGuest) return;
    try {
      const hidden = await HiddenCourt.filter({ player_id: currentPlayer.id });
      setHiddenCourts(hidden);
    } catch (error) {
      console.error("Error loading hidden courts:", error);
    }
  }, [currentPlayer, isGuest]);

  useEffect(() => {
    if (currentPlayer && !isGuest) {
      loadFavoriteCourts();
      loadHiddenCourts();
    } else {
      setFavoriteCourts([]);
      setHiddenCourts([]);
    }
  }, [currentPlayer, isGuest, loadFavoriteCourts, loadHiddenCourts]);

  const toggleFavorite = async (court) => {
    if (!currentPlayer || isGuest) {
      alert("Please sign up or log in to save favorite courts.");
      return;
    }

    try {
      const existingFavorite = favoriteCourts.find(fav => fav.court_id === court.id);
      
      if (existingFavorite) {
        await FavoriteCourt.delete(existingFavorite.id);
        setFavoriteCourts(prev => prev.filter(fav => fav.id !== existingFavorite.id));
      } else {
        const newFavorite = await FavoriteCourt.create({
          player_id: currentPlayer.id,
          court_id: court.id
        });
        setFavoriteCourts(prev => [...prev, newFavorite]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const isFavorite = (courtId) => {
    return favoriteCourts.some(fav => fav.court_id === courtId);
  };

  const isHidden = (courtId) => {
    return hiddenCourts.some(hidden => hidden.court_id === courtId);
  };

  const handleHideCourt = (court) => {
    if (!currentPlayer || isGuest) {
      alert("Please sign up or log in to hide courts.");
      return;
    }
    setSelectedCourt(court);
    setShowHideModal(true);
  };

  const handleHideSubmit = async (hideData) => {
    try {
      if (!currentPlayer || !selectedCourt) {
        throw new Error("Current player or selected court is missing.");
      }
      const newHiddenCourt = await HiddenCourt.create({
        player_id: currentPlayer.id,
        court_id: selectedCourt.id,
        reason: hideData.reason,
        duration_days: hideData.duration_days,
        notes: hideData.notes
      });
      setHiddenCourts(prev => [...prev, newHiddenCourt]);
      setShowHideModal(false);
      setSelectedCourt(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error hiding court:", error);
      alert("Failed to hide court. Please try again.");
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCurrentTimeInCourtTimezone = (court) => {
    const now = new Date();
    if (court.timezone) {
      return new Date(now.toLocaleString("en-US", { timeZone: court.timezone }));
    }
    return now;
  };

  const isBlockCurrentlyActive = (block, court) => {
    const now = getCurrentTimeInCourtTimezone(court);
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    return now >= blockStart && now <= blockEnd;
  };

  const getCurrentlyActiveBlocks = (courtId) => {
    if (!courtBlocks || courtBlocks.length === 0) {
      return [];
    }
    const court = courts.find(c => c.id === courtId);
    if (!court) return [];
    return courtBlocks.filter(block => 
      block.court_id === courtId && isBlockCurrentlyActive(block, court)
    );
  };

  const getUpcomingBlocks = (courtId) => {
    if (!courtBlocks || courtBlocks.length === 0) {
      return [];
    }
    const court = courts.find(c => c.id === courtId);
    if (!court) return [];
    const now = getCurrentTimeInCourtTimezone(court);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return courtBlocks
      .filter(block => {
        const blockStart = new Date(block.start_time);
        return block.court_id === courtId && 
               blockStart > now &&
               blockStart <= tomorrow;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const getPlayersOnCourt = (court) => {
    return activeSessions.filter(session => 
      session.court_id === court.id && session.sport === 'basketball' && session.status === 'active'
    ).length;
  };

  const handleCheckInClick = (court) => {
    setSelectedCourt(court);
    setShowCheckInModal(true);
  };

  const handleCheckInSubmit = async (checkInData) => {
    if (!selectedCourt || !currentPlayer) {
      alert("Could not identify player. Please refresh and try again.");
      return;
    }

    setIsJoining(selectedCourt.id);

    try {
      // Check if player is already active elsewhere and automatically check them out
      const existingSessions = await CourtSession.filter({
        player_id: currentPlayer.id,
        status: "active"
      });

      if (existingSessions.length > 0) {
        const checkoutPromises = existingSessions.map(session =>
          CourtSession.update(session.id, {
            status: "completed",
            actual_end_time: new Date().toISOString()
          })
        );
        await Promise.all(checkoutPromises);
      }

      // Location validation
      const distanceCheckMiles = 0.25;

      if (!navigator.geolocation) {
        alert("Geolocation is required for check-in. Please enable location services and try again.");
        setIsJoining(null);
        return;
      }

      const locationOptions = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      };

      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const distance = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                selectedCourt.latitude,
                selectedCourt.longitude
              );

              if (distance > distanceCheckMiles) {
                const accuracyText = position.coords.accuracy ? ` (GPS accuracy: ${Math.round(position.coords.accuracy)} meters)` : '';
                alert(
                  `You must be within ${distanceCheckMiles} miles of the court to check in. ` +
                  `You are currently ${distance.toFixed(2)} miles away${accuracyText}. ` +
                  `Please go to the court location and try again.`
                );
                setIsJoining(null);
                resolve();
                return;
              }

              const startTime = new Date().toISOString();
              const estimatedEndTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour for basketball

              await CourtSession.create({
                court_id: selectedCourt.id,
                player_id: currentPlayer.id,
                player_name: currentPlayer.display_name,
                start_time: startTime,
                estimated_end_time: estimatedEndTime,
                court_number: checkInData.courtNumber || 1,
                status: "active",
                sport: "basketball",
                play_type: checkInData.playType,
                open_to: checkInData.open_to,
                court_area: 'half' // Defaulting to half for now, can be expanded
              });

              alert(`Successfully checked in for ${formatPlayType(checkInData.playType)} at ${selectedCourt.name}!`);
              
              setShowCheckInModal(false);
              setSelectedCourt(null);
              if (onRefresh) {
                onRefresh();
              }
              resolve();
            } catch (error) {
              console.error("Error during location-based check-in:", error);
              alert("Error during check-in process. Please try again.");
              setIsJoining(null);
              resolve();
            }
          },
          (error) => {
            console.error("Error getting location for check-in:", error);
            alert("Unable to get your precise location for check-in. Please enable location services and try again.");
            setIsJoining(null);
            resolve();
          },
          locationOptions
        );
      });
    } catch (error) {
      console.error("Error during check-in process:", error);
      alert("Failed to check in. Please try again.");
    } finally {
      setIsJoining(null);
    }
  };

  const handleLeaveSession = async (sessionId) => {
    setIsJoining(sessionId);
    try {
      await CourtSession.update(sessionId, {
        status: "completed",
        actual_end_time: new Date().toISOString()
      });
      onRefresh();
    } catch(error) {
      console.error("Error leaving session:", error);
    } finally {
      setIsJoining(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const visibleCourts = courts.filter(court => !isHidden(court.id));
  const sortedCourts = [...visibleCourts].sort((a, b) => {
    const aIsFavorite = !isGuest && isFavorite(a.id);
    const bIsFavorite = !isGuest && isFavorite(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Available Basketball Courts</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Favorites first</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCourts.map((court) => {
          const playersOnCourt = getPlayersOnCourt(court);
          const favorite = !isGuest && isFavorite(court.id);
          
          const currentlyActiveBlocks = getCurrentlyActiveBlocks(court.id);
          const blockedCourtNumbers = [...new Set(currentlyActiveBlocks.map(b => b.court_number))];
          const isCompletelyBlocked = blockedCourtNumbers.length >= court.total_courts;

          const upcomingBlocks = getUpcomingBlocks(court.id);
          const allRelevantBlocks = [...currentlyActiveBlocks, ...upcomingBlocks].sort((a, b) => {
            const aStart = new Date(a.start_time).getTime();
            const bStart = new Date(b.start_time).getTime();
            const aIsActive = isBlockCurrentlyActive(a, court);
            const bIsActive = isBlockCurrentlyActive(b, court);

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
            return aStart - bStart;
          });
          
          const playerActiveSession = activeSessions.find(s => 
            s.player_id === currentPlayer?.id && 
            s.court_id === court.id && 
            s.sport === 'basketball' &&
            s.status === 'active'
          );

          const courtActiveSessions = activeSessions.filter(s => 
            s.court_id === court.id && s.sport === 'basketball' && s.status === 'active'
          );
          
          return (
            <Card key={court.id} className={`hover:shadow-lg transition-shadow duration-200 ${favorite ? 'ring-2 ring-red-200' : ''} ${isCompletelyBlocked ? 'ring-2 ring-orange-300' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">{court.name}</CardTitle>
                      {favorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                      {isCompletelyBlocked && (
                        <Badge className="bg-orange-100 text-orange-800">
                          Event In Progress
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{court.distance?.toFixed(1)} miles away</span>
                      </div>
                      {court.address && (
                        <p className="text-xs text-gray-500 line-clamp-2">{court.address}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">{court.total_courts} Courts</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {allRelevantBlocks && allRelevantBlocks.length > 0 && (
                  <div className={`border rounded-lg p-3 ${isCompletelyBlocked ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-4 h-4 ${isCompletelyBlocked ? 'text-orange-600' : 'text-blue-600'}`} />
                      <span className={`text-sm font-medium ${isCompletelyBlocked ? 'text-orange-900' : 'text-blue-900'}`}>
                        {isCompletelyBlocked ? 'Event In Progress' : 'Scheduled Events'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{playersOnCourt}</p>
                    <p className="text-sm text-gray-600">Players Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{court.total_courts}</p>
                    <p className="text-sm text-gray-600">Total Courts</p>
                  </div>
                </div>

                {courtActiveSessions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        {courtActiveSessions.slice(0, 3).map(session => (
                            <div key={session.id} className="text-xs">
                                <div className="font-semibold text-gray-800">{session.player_name || 'Guest'} is <span className="text-orange-600">{formatPlayType(session.play_type)}</span></div>
                                {session.open_to && session.open_to.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-gray-600">Open to:</span>
                                        {session.open_to.map(format => (
                                            <Badge key={format} variant="secondary" className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700">{formatPlayType(format)}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {courtActiveSessions.length > 3 && (
                             <p className="text-xs text-gray-500 mt-1">...and {courtActiveSessions.length - 3} more players</p>
                        )}
                    </div>
                )}

                {court.operating_hours?.info && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    <span>{court.operating_hours.info}</span>
                  </p>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleFavorite(court)}
                    className={favorite ? "text-red-500 border-red-200 hover:bg-red-50" : ""}
                  >
                    {favorite ? <Heart className="w-4 h-4 fill-current" /> : <HeartOff className="w-4 h-4" />}
                  </Button>

                  {playerActiveSession ? (
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleLeaveSession(playerActiveSession.id)}
                      disabled={isJoining === playerActiveSession.id}
                    >
                      {isJoining === playerActiveSession.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Leaving...
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4 mr-2" />
                          Check Out
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      className={`flex-1 bg-orange-600 hover:bg-orange-700 ${isCompletelyBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => isCompletelyBlocked ? null : handleCheckInClick(court)}
                      disabled={isJoining === court.id || isCompletelyBlocked}
                    >
                     {isJoining === court.id ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                         Checking In...
                       </>
                     ) : (
                       <>
                         <Target className="w-4 h-4 mr-2" />
                         {isCompletelyBlocked ? 'All Courts Reserved' : 'Check In'}
                       </>
                     )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const url = `https://maps.google.com?q=${court.latitude},${court.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleHideCourt(court)}
                    className="text-gray-600 hover:bg-gray-50"
                    title="Hide this court"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showHideModal && selectedCourt && (
        <HideCourtModal
          court={selectedCourt}
          onSubmit={handleHideSubmit}
          onCancel={() => {
            setShowHideModal(false);
            setSelectedCourt(null);
          }}
        />
      )}

      {showCheckInModal && selectedCourt && (
        <BasketballCheckInModal
          court={selectedCourt}
          onCheckIn={handleCheckInSubmit}
          onCancel={() => {
            setShowCheckInModal(false);
            setSelectedCourt(null);
          }}
          isLoading={isJoining === selectedCourt?.id}
        />
      )}
    </div>
  );
}
