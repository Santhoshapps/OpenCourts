
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Navigation, Play, Heart, HeartOff, Flag, LogOut, EyeOff, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteCourt, Player, CourtReport, CourtSession, HiddenCourt } from "@/api/entities";
import { User } from "@/api/entities";
import { format } from "date-fns";

import CourtReportModal from "./CourtReportModal";
import HideCourtModal from "./HideCourtModal";
import CourtAvailability from "./CourtAvailability";
import CheckInModal from "./CheckInModal";

export default function CourtList({
  courts,
  activeSessions,
  courtBlocks,
  getAvailableCourts,
  getEstimatedWaitTime,
  isLoading,
  onRefresh,
  currentPlayer
}) {
  const [favoriteCourts, setFavoriteCourts] = useState([]);
  const [hiddenCourts, setHiddenCourts] = useState([]);
  // currentPlayer is now received as a prop, so no need to load it here
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(null);
  const [expandedCourts, setExpandedCourts] = useState(new Set());
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCourtForCheckIn, setSelectedCourtForCheckIn] = useState(null);

  const isGuest = currentPlayer?.is_guest || false;

  // loadCurrentPlayer is removed as currentPlayer is now passed as a prop

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
    if (currentPlayer) {
      loadFavoriteCourts();
      loadHiddenCourts();
    }
  }, [currentPlayer, isGuest, loadFavoriteCourts, loadHiddenCourts]);

  const toggleFavorite = async (court) => {
    if (!currentPlayer || isGuest) {
      alert("Please sign up or log in to manage favorite courts.");
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
    if (isGuest) {
      alert("Please sign up to hide courts.");
      return;
    }
    setSelectedCourt(court);
    setShowHideModal(true);
  };

  const handleHideSubmit = async (hideData) => {
    try {
      await HiddenCourt.create({
        player_id: currentPlayer.id,
        court_id: selectedCourt.id,
        ...hideData
      });
      setHiddenCourts(prev => [...prev, { court_id: selectedCourt.id, ...hideData }]);
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

  const handleCheckOut = async (session) => {
    if (!session) return;
    setIsCheckingOut(session.id);
    try {
      await CourtSession.update(session.id, {
        status: "completed",
        actual_end_time: new Date().toISOString()
      });
      alert("Successfully checked out!");
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Failed to check out. Please try again.");
    } finally {
      setIsCheckingOut(null);
    }
  };

  const handleReportCourt = (court) => {
    if (isGuest) {
      alert("Please sign up to report courts.");
      return;
    }
    setSelectedCourt(court);
    setShowReportModal(true);
  };

  const handleReportSubmit = async (reportData) => {
    try {
      await CourtReport.create({
        court_id: selectedCourt.id,
        reporter_id: currentPlayer.id,
        ...reportData
      });
      setShowReportModal(false);
      setSelectedCourt(null);
      alert("Thank you for your report. We'll review it shortly.");
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    }
  };

  const getCourtStatusColor = (availableCourts, totalCourts) => {
    const percentage = availableCourts / totalCourts;
    if (percentage > 0.5) return "bg-green-100 text-green-800";
    if (percentage > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getSurfaceColor = (surface) => {
    switch (surface) {
      case "hard":
        return "bg-blue-100 text-blue-800";
      case "clay":
        return "bg-orange-100 text-orange-800";
      case "grass":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleCourtExpansion = (courtId) => {
    const newExpanded = new Set(expandedCourts);
    if (newExpanded.has(courtId)) {
      newExpanded.delete(courtId);
    } else {
      newExpanded.add(courtId);
    }
    setExpandedCourts(newExpanded);
  };

  const getExistingGroups = (court) => {
    const courtSessions = activeSessions.filter(session =>
      session.court_id === court.id && session.status === 'active'
    );

    const groups = {};
    courtSessions.forEach(session => {
      const key = session.group_id || `court_${session.court_number}`;
      if (!groups[key]) {
        groups[key] = {
          court_number: session.court_number,
          play_type: session.play_type,
          sessions: [],
          elapsed_minutes: Math.floor((new Date() - new Date(session.start_time)) / (1000 * 60))
        };
      }
      groups[key].sessions.push({
        ...session,
        player_name: session.player_name || 'Guest Player'
      });
    });

    return Object.values(groups);
  };

  const handleCheckInClick = (court) => {
    setSelectedCourtForCheckIn(court);
    setShowCheckInModal(true);
  };

  const proceedWithCheckIn = async (checkInData) => {
    try {
      let courtNumber;
      let groupId = null;
      let isOrganizer = false;

      // Get currently blocked court numbers for final validation
      const blockedNums = getBlockedCourtNumbers(selectedCourtForCheckIn.id);

      if (checkInData.isJoiningGroup && checkInData.groupId) {
        const parsedCourtNumber = parseInt(checkInData.groupId, 10);
        if (isNaN(parsedCourtNumber)) {
          alert("Invalid group selected. Please try again.");
          return;
        }
        // Ensure user is not joining a blocked court
        if (blockedNums.includes(parsedCourtNumber)) {
          alert(`Court ${parsedCourtNumber} is currently reserved. Please select an unreserved court or start a new group.`);
          return;
        }

        courtNumber = parsedCourtNumber;
        const targetGroup = getExistingGroups(selectedCourtForCheckIn).find(g => g.court_number === courtNumber);
        if (targetGroup && targetGroup.sessions.length > 0) {
          groupId = targetGroup.sessions[0].group_id || `group_${selectedCourtForCheckIn.id}_${courtNumber}`;
        } else {
          alert("Could not find group to join. Please try starting a new group.");
          return;
        }
      } else {
        // STARTING A NEW GROUP
        if (!checkInData.selectedCourtNumber) {
            alert("An available court number was not selected. Please try again.");
            return;
        }

        const currentCourtSessions = activeSessions.filter(session =>
          session.court_id === selectedCourtForCheckIn.id && session.status === 'active'
        );
        const occupiedCourtNumbers = new Set(currentCourtSessions.map(session => session.court_number));

        // Final server-side style check
        if (occupiedCourtNumbers.has(checkInData.selectedCourtNumber) || blockedNums.includes(checkInData.selectedCourtNumber)) {
            alert(`Court ${checkInData.selectedCourtNumber} is no longer available. Please select another court.`);
            setShowCheckInModal(false); // Close the modal to force re-opening with fresh data
            return;
        }
        
        courtNumber = checkInData.selectedCourtNumber;
        groupId = `group_${selectedCourtForCheckIn.id}_${Date.now()}_${courtNumber}`;
        isOrganizer = true;
      }

      const startTime = new Date().toISOString();
      const estimatedEndTime = new Date(Date.now() + 90 * 60 * 1000).toISOString();

      await CourtSession.create({
        court_id: selectedCourtForCheckIn.id,
        player_id: currentPlayer.id,
        player_name: currentPlayer.display_name,
        start_time: startTime,
        estimated_end_time: estimatedEndTime,
        court_number: courtNumber,
        status: "active",
        sport: "tennis",
        play_type: checkInData.playType || "singles",
        group_id: groupId,
        is_organizer: isOrganizer
      });

      const groupText = checkInData.isJoiningGroup ? "joined the group" : "started a new group";
      alert(`Successfully checked in to ${selectedCourtForCheckIn.name} (Court ${courtNumber}) and ${groupText} for ${checkInData.playType || 'singles'}!`);

      setShowCheckInModal(false);
      setSelectedCourtForCheckIn(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error during check-in creation:", error);
      alert("Failed to complete check-in. Please try again.");
      throw error;
    }
  };

  // Helper function to get current time in court's timezone
  const getCurrentTimeInCourtTimezone = (court) => {
    const now = new Date();
    if (court && court.timezone) {
      // Convert current time to court's timezone
      return new Date(now.toLocaleString("en-US", { timeZone: court.timezone }));
    }
    return now;
  };

  // Helper function to check if a block is currently active
  const isBlockCurrentlyActive = (block, court) => {
    const now = getCurrentTimeInCourtTimezone(court);
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);

    // Check if current time is between start and end of the block
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

  const getBlockedCourtNumbers = (courtId) => {
    if (!courtBlocks || courtBlocks.length === 0) return [];

    const court = courts.find(c => c.id === courtId);
    if (!court) return [];

    return courtBlocks
        .filter(block =>
            block.court_id === courtId && isBlockCurrentlyActive(block, court)
        )
        .map(block => block.court_number);
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


  const handleCheckInSubmit = async (checkInData) => {
    if (!selectedCourtForCheckIn || !currentPlayer) {
      alert("Could not identify player. Please refresh and try again.");
      return;
    }

    setIsCheckingIn(selectedCourtForCheckIn.id);

    try {
      // Check if player is already active elsewhere and automatically check them out
      const existingSessions = await CourtSession.filter({
        player_id: currentPlayer.id,
        status: "active"
      });

      if (existingSessions.length > 0) {
        console.log(`Automatically checking out player from ${existingSessions.length} active session(s).`);
        const checkoutPromises = existingSessions.map(session =>
            CourtSession.update(session.id, {
                status: "completed",
                actual_end_time: new Date().toISOString()
            })
        );
        await Promise.all(checkoutPromises);
      }

      // Check if ALL courts at this location are currently blocked
      const blockedNums = getBlockedCourtNumbers(selectedCourtForCheckIn.id);
      const isCompletelyBlockedNow = blockedNums.length === selectedCourtForCheckIn.total_courts;

      if (isCompletelyBlockedNow) {
        const activeBlock = getCurrentlyActiveBlocks(selectedCourtForCheckIn.id)[0];
        const blockEndTime = format(new Date(activeBlock.end_time), 'h:mm a');
        alert(`All courts at this location are currently reserved for "${activeBlock.title}" until ${blockEndTime}. You cannot check in during scheduled events.`);
        setShowCheckInModal(false);
        setSelectedCourtForCheckIn(null);
        setIsCheckingIn(null);
        return;
      }

      // Check for upcoming court blocks within 2 hours (warning for the whole facility)
      const now = getCurrentTimeInCourtTimezone(selectedCourtForCheckIn);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const upcomingBlock = courtBlocks.find(block => {
        const blockStart = new Date(block.start_time);
        return block.court_id === selectedCourtForCheckIn.id &&
               blockStart > now &&
               blockStart <= twoHoursFromNow;
      });

      if (upcomingBlock) {
        const blockStartTime = format(new Date(upcomingBlock.start_time), 'h:mm a');
        const timeUntilBlock = Math.ceil((new Date(upcomingBlock.start_time).getTime() - now.getTime()) / (1000 * 60)); // minutes

        if (timeUntilBlock <= 30) {
          // Don't allow check-in if event starts within 30 minutes, even if a court is technically open.
          alert(`This court facility is reserved for "${upcomingBlock.title}" starting at ${blockStartTime} (in ${timeUntilBlock} minutes). Check-in is not allowed within 30 minutes of scheduled events that affect the entire facility.`);
          setShowCheckInModal(false);
          setSelectedCourtForCheckIn(null);
          setIsCheckingIn(null);
          return;
        } else {
          // Show warning but allow check-in
          const confirmCheckIn = confirm(`Warning: This court facility is reserved for "${upcomingBlock.title}" in ${timeUntilBlock} minutes. Officials may ask you to leave early. Consider checking availability at other courts in this park. Do you still want to check in?`);
          if (!confirmCheckIn) {
            setShowCheckInModal(false);
            setSelectedCourtForCheckIn(null);
            setIsCheckingIn(null);
            return;
          }
        }
      }

      // ENHANCED LOCATION CHECK - strict 0.25 miles for everyone
      const distanceCheckMiles = 0.25; // Same strict distance requirement for all users

      if (!navigator.geolocation) {
        alert("Geolocation is required for check-in. Please enable location services and try again.");
        setIsCheckingIn(null);
        return;
      }

      const locationOptions = {
        enableHighAccuracy: true, // Always use high accuracy for check-in validation
        timeout: 20000, // Longer timeout for accurate location
        maximumAge: 0 // Always force fresh location for check-in
      };

      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const distance = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                selectedCourtForCheckIn.latitude,
                selectedCourtForCheckIn.longitude
              );

              console.log(`Check-in distance validation: ${distance.toFixed(3)} miles from court (limit: ${distanceCheckMiles} miles)`);

              if (distance > distanceCheckMiles) {
                const accuracyText = position.coords.accuracy ? ` (GPS accuracy: ${Math.round(position.coords.accuracy)} meters)` : '';
                alert(
                  `You must be within ${distanceCheckMiles} miles of the court to check in. ` +
                  `You are currently ${distance.toFixed(2)} miles away${accuracyText}. ` +
                  `Please go to the court location and try again.`
                );
                setIsCheckingIn(null);
                resolve();
                return;
              }

              // Additional accuracy check for all users when GPS accuracy is poor
              if (position.coords.accuracy && position.coords.accuracy > 100) {
                const proceedWithPoorAccuracy = confirm(
                  `Your GPS accuracy is ${Math.round(position.coords.accuracy)} meters, which may not be precise enough for check-in validation. ` +
                  `For the best experience, try moving to an area with better GPS signal. Do you want to proceed anyway?`
                );
                if (!proceedWithPoorAccuracy) {
                  setIsCheckingIn(null);
                  resolve();
                  return;
                }
              }

              await proceedWithCheckIn(checkInData);
              resolve();
            } catch (error) {
              console.error("Error during location-based check-in:", error);
              alert("Error during check-in process. Please try again.");
              setIsCheckingIn(null);
              resolve();
            }
          },
          async (error) => {
            console.error("Error getting location for check-in:", error);

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
            setIsCheckingIn(null);
            resolve();
          },
          locationOptions
        );
      });
    } catch (error) {
      console.error("Error during check-in process:", error);
      alert("Failed to check in. Please try again.");
    } finally {
      setIsCheckingIn(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
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
    const aIsFavorite = isFavorite(a.id);
    const bIsFavorite = isFavorite(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  const playerActiveSession = activeSessions.find(
    session => session.player_id === currentPlayer?.id && session.status === 'active'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Available Courts</h2>
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

      <div className="grid grid-cols-1 gap-6">
        {sortedCourts.map((court) => {
          const availableCourts = getAvailableCourts(court);
          const waitTime = getEstimatedWaitTime(court);
          const favorite = !isGuest && isFavorite(court.id);
          const checkingIn = isCheckingIn === court.id;
          const isCheckedInHere = playerActiveSession && playerActiveSession.court_id === court.id;
          const checkingOut = isCheckingOut === playerActiveSession?.id;
          const isExpanded = expandedCourts.has(court.id);

          const blockedCourtNumbers = getBlockedCourtNumbers(court.id);
          const activeSessionCourtNumbers = new Set(activeSessions.filter(s => s.court_id === court.id).map(s => s.court_number));
          const availablePhysicalCourts = court.total_courts - blockedCourtNumbers.length;
          const isCompletelyBlocked = blockedCourtNumbers.length === court.total_courts;
          const isEffectivelyFull = availablePhysicalCourts <= activeSessionCourtNumbers.size;

          // Updated logic for blocks
          const upcomingBlocks = getUpcomingBlocks(court.id);
          const currentlyActiveBlocks = getCurrentlyActiveBlocks(court.id);
          const hasBlockSoon = hasUpcomingBlock(court.id);
          const allRelevantBlocks = [...currentlyActiveBlocks, ...upcomingBlocks].sort((a,b) => {
            const aStart = new Date(a.start_time).getTime();
            const bStart = new Date(b.start_time).getTime();
            const aIsActive = isBlockCurrentlyActive(a, court);
            const bIsActive = isBlockCurrentlyActive(b, court);

            if (aIsActive && !bIsActive) return -1; // Active blocks first
            if (!aIsActive && bIsActive) return 1;
            return aStart - bStart; // Then by start time
          });

          return (
            <div key={court.id}>
              <Card className={`hover:shadow-lg transition-shadow duration-200 ${favorite ? 'ring-2 ring-red-200' : ''} ${blockedCourtNumbers.length > 0 ? 'ring-2 ring-orange-300' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {court.name}
                        </CardTitle>
                        {favorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                        {blockedCourtNumbers.length > 0 && (
                          <Badge className="bg-orange-100 text-orange-800">
                            {isCompletelyBlocked ? 'Event In Progress' : 'Partial Event'}
                          </Badge>
                        )}
                        {court.total_courts > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCourtExpansion(court.id)}
                            className="h-6 px-2"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{court.distance?.toFixed(1)} miles away</span>
                          {court.drive_time && (
                            <span className="text-gray-400">• ~{Math.round(court.drive_time)} min drive</span>
                          )}
                          {!court.drive_time && court.distance && court.distance <= 1.5 && (
                            <span className="text-gray-400">• ~{Math.round(court.distance * 3)} min drive</span>
                          )}
                        </div>
                        {court.address && (
                          <p className="text-xs text-gray-500 line-clamp-2">{court.address}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={getCourtStatusColor(availableCourts, court.total_courts)}
                    >
                      {isCompletelyBlocked ? 'Reserved' : `${availableCourts}/${court.total_courts} open`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge
                      variant="outline"
                      className={getSurfaceColor(court.court_type)}
                    >
                      {court.court_type}
                    </Badge>
                    {court.is_public && (
                      <Badge variant="outline">Public</Badge>
                    )}
                    {court.amenities?.includes("parking") && (
                      <Badge variant="outline">Parking</Badge>
                    )}
                  </div>

                  {/* Display active and upcoming events */}
                  {allRelevantBlocks && allRelevantBlocks.length > 0 && (
                    <div className={`border rounded-lg p-3 ${blockedCourtNumbers.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className={`w-4 h-4 ${blockedCourtNumbers.length > 0 ? 'text-orange-600' : 'text-blue-600'}`} />
                        <span className={`text-sm font-medium ${blockedCourtNumbers.length > 0 ? 'text-orange-900' : 'text-blue-900'}`}>
                          {blockedCourtNumbers.length > 0 ? 'Event In Progress' : 'Scheduled Events'}
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
                          <p className={`text-xs ${blockedCourtNumbers.length > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                            +{allRelevantBlocks.length - 2} more scheduled events
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {court.operating_hours?.info && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{court.operating_hours.info}</span>
                    </p>
                  )}

                  {waitTime > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <Clock className="w-4 h-4" />
                      <span>~{waitTime} min wait</span>
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

                    {isCheckedInHere ? (
                      <Button
                        variant="destructive"
                        className="flex-1 flex items-center gap-2"
                        onClick={() => handleCheckOut(playerActiveSession)}
                        disabled={checkingOut}
                      >
                        {checkingOut ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Checking Out...
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4" />
                            Check Out
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1 flex items-center gap-2"
                        onClick={() => handleCheckInClick(court)}
                        disabled={checkingIn || (playerActiveSession && !isGuest) || isEffectivelyFull}
                      >
                        {checkingIn ? (
                          <>
                            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            Checking In...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            {(playerActiveSession && !isGuest) ? 'Checked in elsewhere' :
                             isEffectivelyFull ? 'All Courts Full/Reserved' : 'Check In'}
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
                      onClick={() => handleReportCourt(court)}
                      className="text-orange-600 hover:bg-orange-50"
                    >
                      <Flag className="w-4 h-4" />
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

              {isExpanded && court.total_courts > 1 && (
                <div className="mt-4">
                  <CourtAvailability 
                    court={court} 
                    activeSessions={activeSessions}
                    blockedCourtNumbers={blockedCourtNumbers}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showReportModal && selectedCourt && (
        <CourtReportModal
          court={selectedCourt}
          onSubmit={handleReportSubmit}
          onCancel={() => {
            setShowReportModal(false);
            setSelectedCourt(null);
          }}
        />
      )}

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

      {showCheckInModal && selectedCourtForCheckIn && (
        <CheckInModal
          court={selectedCourtForCheckIn}
          existingGroups={getExistingGroups(selectedCourtForCheckIn)}
          onCheckIn={handleCheckInSubmit}
          onCancel={() => {
            setShowCheckInModal(false);
            setSelectedCourtForCheckIn(null);
          }}
          isLoading={isCheckingIn === selectedCourtForCheckIn.id}
          blockedCourtNumbers={getBlockedCourtNumbers(selectedCourtForCheckIn.id)}
        />
      )}
    </div>
  );
}
