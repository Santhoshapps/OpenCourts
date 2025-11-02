
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, UserPlus, LogOut, Navigation, Heart, HeartOff, EyeOff, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CourtSession, FavoriteCourt, HiddenCourt } from "@/api/entities";
import { format } from "date-fns";
import HideCourtModal from "../dashboard/HideCourtModal";

export default function PickleballCourtList({
  courts,
  waitingSessions,
  courtBlocks, // Added courtBlocks prop
  getPlayersOnCourt,
  getPlayersWaiting,
  getEstimatedWaitTime,
  isLoading,
  onRefresh,
  currentPlayer
}) {
  const [isJoining, setIsJoining] = useState(null);
  const [favoriteCourts, setFavoriteCourts] = useState([]);
  const [hiddenCourts, setHiddenCourts] = useState([]);
  const [showHideModal, setShowHideModal] = useState(false);
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
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to get current time in court's timezone
  const getCurrentTimeInCourtTimezone = (court) => {
    const now = new Date();
    if (court.timezone) {
      return new Date(now.toLocaleString("en-US", { timeZone: court.timezone }));
    }
    return now;
  };

  // Helper function to check if a block is currently active
  const isBlockCurrentlyActive = (block, court) => {
    const now = getCurrentTimeInCourtTimezone(court);
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    return now >= blockStart && now <= blockEnd;
  };

  // Helper function to get currently active blocks for a court
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

  // Helper function to get upcoming blocks for a court (within next 24 hours)
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

  // Helper function to check if there's an upcoming block within 2 hours
  const hasUpcomingBlock = (courtId) => {
    if (!courtBlocks || courtBlocks.length === 0) {
      return false;
    }
    const court = courts.find(c => c.id === courtId);
    if (!court) return false;
    const now = getCurrentTimeInCourtTimezone(court);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return courtBlocks.some(block => {
      const blockStart = new Date(block.start_time);
      return block.court_id === courtId &&
             blockStart > now &&
             blockStart <= twoHoursFromNow;
    });
  };

  // Helper function to check if court is currently blocked
  const isCourtCurrentlyBlocked = (courtId) => {
    const activeBlocks = getCurrentlyActiveBlocks(courtId);
    const court = courts.find(c => c.id === courtId);
    if (!court) return false;
    const blockedNumbers = [...new Set(activeBlocks.map(b => b.court_number))];
    return blockedNumbers.length >= court.total_courts;
  };

  // Helper function to handle the actual pickleball join process
  const proceedWithPickleballJoin = async (court) => {
    try {
      const playersOnCourt = getPlayersOnCourt(court);
      const blockedNumbers = getCurrentlyActiveBlocks(court.id).map(b => b.court_number);
      const availableCourtCount = Math.max(0, court.total_courts - new Set(blockedNumbers).size);
      const maxPlayersWithoutWait = availableCourtCount * 4;

      let sessionStatus = "active";
      let courtNumber = null;

      if (playersOnCourt < maxPlayersWithoutWait) {
        // This logic needs to be more sophisticated to assign to an unblocked court_number
        // For now, it assigns based on total players, assuming an available court will be found.
        // A future enhancement could iterate through available court numbers.
        const usedCourtNumbers = waitingSessions
          .filter(s => s.court_id === court.id && s.status === 'active')
          .map(s => s.court_number)
          .filter(num => num !== null);
        
        const allCourtNumbers = Array.from({length: court.total_courts}, (_, i) => i + 1);
        const unblockedCourtNumbers = allCourtNumbers.filter(num => !blockedNumbers.includes(num));
        
        // Find the lowest available unblocked court number
        for (let i = 1; i <= unblockedCourtNumbers.length; i++) {
          const currentCourtNum = unblockedCourtNumbers[i-1];
          const playersOnThisCourt = waitingSessions.filter(s => s.court_id === court.id && s.status === 'active' && s.court_number === currentCourtNum).length;
          if (playersOnThisCourt < 4) {
            courtNumber = currentCourtNum;
            break;
          }
        }
        
        // If we still didn't find an exact court (e.g., all unblocked courts have 4 players)
        // or if courtNumber is null, it means we'll likely be on waitlist.
        if (courtNumber === null && availableCourtCount > 0) {
            // Fallback: If logic above didn't assign, try assigning to the next logical court if total players allow
            // This might still need refinement for exact court assignment
            const nextLogicalCourt = Math.floor(playersOnCourt / 4) + 1;
            if (nextLogicalCourt <= court.total_courts && !blockedNumbers.includes(nextLogicalCourt)) {
                courtNumber = nextLogicalCourt;
            } else {
                sessionStatus = "waiting"; // Fallback to waiting if no clear active court found
            }
        } else if (courtNumber === null && availableCourtCount === 0) {
            sessionStatus = "waiting"; // Should be covered by handlePlayPickleball, but for safety
        }
        
        sessionStatus = courtNumber !== null ? "active" : "waiting";

      } else {
        sessionStatus = "waiting";
      }

      const startTime = new Date().toISOString();
      const estimatedEndTime = new Date(Date.now() + 20 * 60 * 1000).toISOString();

      await CourtSession.create({
        court_id: court.id,
        player_id: currentPlayer.id,
        player_name: currentPlayer.display_name,
        start_time: startTime,
        estimated_end_time: estimatedEndTime,
        court_number: courtNumber,
        status: sessionStatus,
        sport: "pickleball"
      });

      if (sessionStatus === "active") {
        alert(`You're now playing pickleball at ${court.name} (Court ${courtNumber ? courtNumber : 'assigned shortly'})! Have fun!`);
      } else {
        alert(`You've joined the waitlist at ${court.name}. You'll be notified when it's your turn!`);
      }
      
      onRefresh();
    } catch (error) {
      console.error("Error during pickleball join:", error);
      alert("Failed to join pickleball. Please try again.");
    } finally {
      setIsJoining(null);
    }
  };

  const handlePlayPickleball = async (court) => {
    if (!currentPlayer) {
      alert("Could not identify player. Please refresh and try again.");
      return;
    }

    setIsJoining(court.id);

    try {
      // Check if player is already active or waiting and automatically check them out
      const activeSessions = await CourtSession.filter({ player_id: currentPlayer.id, status: "active" });
      const waitingSessionsFromDB = await CourtSession.filter({ player_id: currentPlayer.id, status: "waiting" });
      const existingSessions = [...activeSessions, ...waitingSessionsFromDB];

      if (existingSessions.length > 0) {
        const endSessionPromises = existingSessions.map(session =>
          CourtSession.update(session.id, {
            status: "completed",
            actual_end_time: new Date().toISOString()
          })
        );
        await Promise.all(endSessionPromises);
        // Optionally, inform the user about the automatic checkout
        // alert("You were automatically checked out of your previous session(s).");
      }

      // Check if court is currently completely blocked
      const currentlyActiveBlocks = getCurrentlyActiveBlocks(court.id);
      const blockedCourtNumbers = [...new Set(currentlyActiveBlocks.map(b => b.court_number))];
      const isCompletelyBlocked = blockedCourtNumbers.length >= court.total_courts;

      if (isCompletelyBlocked) {
        alert(`All courts at this location are currently reserved for an event.`);
        setIsJoining(null);
        return;
      }

      // Check for upcoming court blocks within 2 hours
      const now = getCurrentTimeInCourtTimezone(court);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const upcomingBlock = courtBlocks?.find(block => {
        const blockStart = new Date(block.start_time);
        return block.court_id === court.id &&
               blockStart > now &&
               blockStart <= twoHoursFromNow;
      });

      if (upcomingBlock) {
        const blockStartTime = format(new Date(upcomingBlock.start_time), 'h:mm a');
        const timeUntilBlock = Math.ceil((new Date(upcomingBlock.start_time).getTime() - now.getTime()) / (1000 * 60)); // minutes
        
        if (timeUntilBlock <= 30) {
          // Don't allow check-in if event starts within 30 minutes
          alert(`This court is reserved for "${upcomingBlock.title}" starting at ${blockStartTime} (in ${timeUntilBlock} minutes). Check-in is not allowed within 30 minutes of scheduled events.`);
          setIsJoining(null);
          return;
        } else {
          // Show warning but allow check-in
          const confirmCheckIn = confirm(`Warning: This court is reserved for "${upcomingBlock.title}" in ${timeUntilBlock} minutes. Officials may ask you to leave early. Consider checking availability at other courts in this park. Do you still want to check in?`);
          if (!confirmCheckIn) {
            setIsJoining(null);
            return;
          }
        }
      }

      // ENHANCED LOCATION CHECK - strict 0.25 miles for everyone
      const distanceCheckMiles = 0.25; // Same strict distance requirement for all users

      if (!navigator.geolocation) {
        alert("Geolocation is required for check-in. Please enable location services and try again.");
        setIsJoining(null);
        return;
      }

      const locationOptions = {
        enableHighAccuracy: true, // Always use high accuracy for check-in validation
        timeout: 20000, // Longer timeout for accurate location
        maximumAge: 0 // Always force fresh location for check-in
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const distance = calculateDistance(
              position.coords.latitude,
              position.coords.longitude,
              court.latitude,
              court.longitude
            );

            console.log(`Pickleball check-in distance validation: ${distance.toFixed(3)} miles from court (limit: ${distanceCheckMiles} miles)`);

            if (distance > distanceCheckMiles) {
              const accuracyText = position.coords.accuracy ? ` (GPS accuracy: ${Math.round(position.coords.accuracy)} meters)` : '';
              alert(
                `You must be within ${distanceCheckMiles} miles of the court to check in. ` +
                `You are currently ${distance.toFixed(2)} miles away${accuracyText}. ` +
                `Please go to the court location and try again.`
              );
              setIsJoining(null);
              return;
            }

            // Additional accuracy check for all users when GPS accuracy is poor
            if (position.coords.accuracy && position.coords.accuracy > 100) {
              const proceedWithPoorAccuracy = confirm(
                `Your GPS accuracy is ${Math.round(position.coords.accuracy)} meters, which may not be precise enough for check-in validation. ` +
                `For the best experience, try moving to an area with better GPS signal. Do you want to proceed anyway?`
              );
              if (!proceedWithPoorAccuracy) {
                setIsJoining(null);
                return;
              }
            }

            await proceedWithPickleballJoin(court);
          } catch (error) {
            console.error("Error during location-based check-in:", error);
            alert("Error during check-in process. Please try again.");
            setIsJoining(null);
          }
        },
        async (error) => {
          console.error("Error getting location for pickleball check-in:", error);
          
          let errorMessage = "Unable to get your precise location for check-in. ";
          let suggestions = "";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location access was denied.";
              suggestions = " Please enable location services and refresh the page.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location service is unavailable.";
              suggestions = " Try moving outdoors, away from tall buildings, for better GPS reception.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out after 20 seconds.";
              suggestions = " This often happens indoors or in areas with poor GPS signal. Try moving to an open area and try again.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
              suggestions = " Please check that location services are enabled and try again.";
              break;
          }
          
          alert(errorMessage + suggestions);
          setIsJoining(null);
        },
        locationOptions
      );
    } catch (error) {
      console.error("Error joining pickleball:", error);
      alert("Failed to join. Please try again.");
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

  // Filter out hidden courts and sort courts to show favorites first
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
      {/* Header with favorites indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Available Pickleball Courts</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Favorites first</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Limited</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Full</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCourts.map((court) => {
          const playersOnCourt = getPlayersOnCourt(court);
          const playersWaiting = getPlayersWaiting(court);
          const waitTime = getEstimatedWaitTime(court);
          const favorite = !isGuest && isFavorite(court.id);
          
          // Court blocking logic
          const currentlyActiveBlocks = getCurrentlyActiveBlocks(court.id);
          const blockedCourtNumbers = [...new Set(currentlyActiveBlocks.map(b => b.court_number))];
          const isCompletelyBlocked = blockedCourtNumbers.length >= court.total_courts;
          const hasPartialBlock = !isCompletelyBlocked && blockedCourtNumbers.length > 0;
          
          const availableCourtsForPlay = court.total_courts - blockedCourtNumbers.length;
          const maxPlayersForAvailableCourts = availableCourtsForPlay * 4;

          const upcomingBlocks = getUpcomingBlocks(court.id);
          const hasBlockSoon = hasUpcomingBlock(court.id); // This is still used for the warning, not for disabling the button if not completely blocked.
          const allRelevantBlocks = [...currentlyActiveBlocks, ...upcomingBlocks].sort((a, b) => {
            const aStart = new Date(a.start_time).getTime();
            const bStart = new Date(b.start_time).getTime();
            const aIsActive = isBlockCurrentlyActive(a, court);
            const bIsActive = isBlockCurrentlyActive(b, court);

            if (aIsActive && !bIsActive) return -1; // Active blocks first
            if (!aIsActive && bIsActive) return 1;
            return aStart - bStart; // Then by start time
          });
          
          // Check if current player is already playing or waiting at this court
          const playerActiveSession = waitingSessions.find(s => 
            s.player_id === currentPlayer?.id && 
            s.court_id === court.id && 
            (s.status === 'active' || s.status === 'waiting')
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
                            {hasPartialBlock && (
                               <Badge className="bg-yellow-100 text-yellow-800">
                                Partial Event
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
                  {/* Display active and upcoming events */}
                  {allRelevantBlocks && allRelevantBlocks.length > 0 && (
                    <div className={`border rounded-lg p-3 ${isCompletelyBlocked ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className={`w-4 h-4 ${isCompletelyBlocked ? 'text-orange-600' : 'text-blue-600'}`} />
                        <span className={`text-sm font-medium ${isCompletelyBlocked ? 'text-orange-900' : 'text-blue-900'}`}>
                          {isCompletelyBlocked ? 'Event In Progress' : 'Scheduled Events'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {allRelevantBlocks.slice(0, 2).map(block => {
                          const isActive = isBlockCurrentlyActive(block, court);
                          return (
                            <div key={block.id} className="text-sm">
                              <div className={`font-medium ${isActive ? 'text-orange-800' : 'text-blue-800'}`}>
                                {block.title} {isActive && '(Active Now)'}
                              </div>
                              <div className={isActive ? 'text-orange-600' : 'text-blue-600'}>
                                {format(new Date(block.start_time), 'MMM d, h:mm a')} - {format(new Date(block.end_time), 'h:mm a')}
                              </div>
                              <Badge variant="outline" className="text-xs capitalize bg-white">
                                {block.reason}
                              </Badge>
                            </div>
                          );
                        })}
                        {allRelevantBlocks.length > 2 && (
                          <p className={`text-xs ${isCompletelyBlocked ? 'text-orange-600' : 'text-blue-600'}`}>
                            +{allRelevantBlocks.length - 2} more scheduled events
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                          <p className="text-2xl font-bold text-emerald-600">{playersOnCourt}</p>
                          <p className="text-sm text-gray-600">Playing Now</p>
                      </div>
                      <div>
                          <p className="text-2xl font-bold text-amber-600">{playersWaiting}</p>
                          <p className="text-sm text-gray-600">Waiting</p>
                      </div>
                  </div>

                  {court.operating_hours?.info && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 
                        <span>{court.operating_hours.info}</span>
                    </p>
                  )}

                  {/* Court Utilization Indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Court Usage</span>
                      <span>{Math.min(100, Math.round((playersOnCourt / (court.total_courts * 4)) * 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          playersOnCourt >= maxPlayersForAvailableCourts 
                            ? 'bg-red-500' 
                            : playersOnCourt >= maxPlayersForAvailableCourts * 0.7 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (playersOnCourt / (court.total_courts * 4)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {waitTime > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      <Clock className="w-4 h-4" />
                      <span>Est. wait time: ~{waitTime} min</span>
                    </div>
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
                              variant={playerActiveSession.status === 'active' ? 'destructive' : 'outline'}
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
                                  {playerActiveSession.status === 'active' ? 'Stop Playing' : 'Leave Waitlist'}
                                </>
                              )}
                          </Button>
                      ) : (
                          <Button 
                              variant="default" 
                              className={`flex-1 bg-teal-600 hover:bg-teal-700 ${isCompletelyBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => isCompletelyBlocked ? null : handlePlayPickleball(court)}
                              disabled={isJoining === court.id || isCompletelyBlocked || (playerActiveSession && !isGuest)}
                          >
                             {isJoining === court.id ? (
                               <>
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                 Joining...
                               </>
                             ) : (
                               <>
                                 <UserPlus className="w-4 h-4 mr-2" />
                                 {isCompletelyBlocked ? 'All Courts Reserved' :
                                  (playerActiveSession && !isGuest) ? 'Playing Elsewhere' :
                                  playersOnCourt >= maxPlayersForAvailableCourts ? 'Join Waitlist' : 'Play Now'}
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

      {/* Hide Court Modal */}
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
    </div>
  );
}
