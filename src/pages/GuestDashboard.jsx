
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Court, CourtSession, Player, CourtBlock } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Navigation, Play, RefreshCw, PlusCircle, Voicemail, UserPlus, LogIn, WifiOff, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import LocationPermission from "../components/dashboard/LocationPermission";
import CourtList from "../components/dashboard/CourtList";
import PickleballCourtList from "../components/pickleball/PickleballCourtList";
import QuickActions from "../components/dashboard/QuickActions";
import WeatherWidget from "../components/dashboard/WeatherWidget";

// --- Guest Player Management Logic ---
const GUEST_PLAYER_ID_KEY = 'opencourts-guestPlayerId';

const guestAdjectives = ["Agile", "Baseline", "Clever", "Daring", "Eager", "Fast", "Grand", "Happy", "Iron", "Jolly", "Keen", "Lucky", "Mighty", "Nimble", "Quick", "Rapid", "Strong", "Topspin", "Ultimate", "Volley", "Winged", "Zenith"];
const guestNouns = ["Ace", "Badger", "Cobra", "Dragon", "Eagle", "Falcon", "Gopher", "Hawk", "Iguana", "Jaguar", "King", "Lion", "Maverick", "Ninja", "Panther", "Quail", "Rocket", "Stinger", "Tiger", "Viper", "Winner", "Zephyr"];

const generateGuestName = () => {
    const adjective = guestAdjectives[Math.floor(Math.random() * guestAdjectives.length)];
    const noun = guestNouns[Math.floor(Math.random() * guestNouns.length)];
    return `${adjective} ${noun}`;
};

const getGuestPlayerId = () => {
    try {
        return localStorage.getItem(GUEST_PLAYER_ID_KEY);
    } catch (e) {
        console.error("Could not access localStorage:", e);
        return null;
    }
};

const setGuestPlayerId = (id) => {
    try {
        localStorage.setItem(GUEST_PLAYER_ID_KEY, id);
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }
};

const getOrCreateGuestPlayer = async () => {
    const existingGuestId = getGuestPlayerId();

    if (existingGuestId) {
        try {
            const guestPlayer = await Player.get(existingGuestId);
            if (guestPlayer && guestPlayer.is_guest) {
                console.log("Found existing guest player:", guestPlayer);
                return guestPlayer;
            }
        } catch (error) {
            console.warn("Could not retrieve existing guest player, creating a new one.", error);
            try {
                localStorage.removeItem(GUEST_PLAYER_ID_KEY);
            } catch (e) {
                console.error("Could not access localStorage:", e);
            }
        }
    }

    console.log("Creating a new guest player...");
    const newGuestPlayer = await Player.create({
        display_name: generateGuestName(),
        is_guest: true,
        availability_status: "available",
    });

    if (newGuestPlayer && newGuestPlayer.id) {
        setGuestPlayerId(newGuestPlayer.id);
        console.log("New guest player created:", newGuestPlayer);
        return newGuestPlayer;
    }

    throw new Error("Failed to create a guest player.");
};
// --- End Guest Player Management Logic ---

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export default function GuestDashboard() {
  const [courts, setCourts] = useState([]);
  const [pickleballCourts, setPickleballCourts] = useState([]);
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [courtBlocks, setCourtBlocks] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null); // Changed to null initial state
  const [isLoading, setIsLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [sportView, setSportView] = useState('tennis');
  const [error, setError] = useState(null); // General application errors
  const [lastDataLoad, setLastDataLoad] = useState(0);
  const [locationError, setLocationError] = useState(null); // Specific location errors
  const [locationSource, setLocationSource] = useState(null);

  // Refs to prevent duplicate API calls and handle component unmounting
  const loadingRef = useRef(false);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSignUp = async () => {
    try {
      await User.loginWithRedirect(window.location.origin + createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Sign up failed:", error);
    }
  };

  const retryNetworkRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.log(`Network request failed (attempt ${attempt}):`, error);
        
        const isNetworkError = 
          error.message?.includes('Network Error') || 
          error.message?.includes('timeout') ||
          error.message?.includes('ERR_NETWORK') ||
          error.name === 'AxiosError' || 
          error.code === 'ERR_NETWORK' || 
          error.code === 'NETWORK_ERROR' || 
          !navigator.onLine || 
          (error.response && error.response.status >= 500) ||
          (error.response && error.response.status === 0);

        if (attempt === maxRetries) {
          if (isNetworkError) {
            const networkError = new Error('NETWORK_ERROR');
            networkError.originalError = error;
            throw networkError;
          }
          throw error;
        }
        
        if (isNetworkError) {
          console.log(`Retrying network request in ${delay * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        
        throw error;
      }
    }
  };

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log(`Distance from (${lat1}, ${lon1}) to (${lat2}, ${lon2}): ${distance.toFixed(3)} miles`);
    
    return distance;
  }, []);

  const updatePlayerLocation = useCallback(async (lat, lng) => {
    if (!mountedRef.current || !playerProfile || playerProfile.is_guest) return;
    
    try {
      await retryNetworkRequest(async () => {
        if (!mountedRef.current) return;
        
        await Player.update(playerProfile.id, {
          current_latitude: lat,
          current_longitude: lng,
          last_location_update: new Date().toISOString(),
          availability_status: "available"
        });
      });
    } catch (error) {
      console.error("Error updating player location:", error);
    }
  }, [playerProfile]);

  const checkLocationPermission = useCallback(async () => {
    if (!mountedRef.current) return;
    
    if (!navigator.geolocation) {
      if (mountedRef.current) {
        setLocationPermission(false);
        setLocationError({ type: 'unsupported', message: "Your browser doesn't support location services. Please use a modern browser like Chrome, Firefox, or Safari." });
        setIsLoading(false);
      }
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("timeout"));
        }, 20000); // 20 second timeout

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(err);
          },
          { 
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
      
      if (!mountedRef.current) return;

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      if (mountedRef.current) {
        setCurrentLocation(newLocation);
        setLocationPermission(true);
        setLocationError(null); // Clear any previous location errors
        setLocationSource(position.coords.accuracy > 1000 ? 'cached' : 'gps');
      }
      
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error("Geolocation error:", error);

      if (error.code === error.PERMISSION_DENIED || error.message?.includes("denied")) {
        setLocationPermission(false);
        setLocationError({ type: 'denied', message: "Location access was denied. Please enable it in your browser settings to find nearby courts." });
      } else if (error.code === error.TIMEOUT || error.message?.includes("timeout")) {
        setLocationPermission(false);
        setLocationError({ type: 'timeout', message: "Could not get your location in time. Please try again, or move to an area with a better GPS signal (like outdoors)." });
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setLocationPermission(false);
        setLocationError({ type: 'unavailable', message: "Your location is currently unavailable. Please check your device's location settings." });
      } else {
        setLocationPermission(false);
        setLocationError({ type: 'unknown', message: "An unknown error occurred while trying to get your location." });
      }
    } finally {
        if(mountedRef.current) setIsLoading(false);
    }
  }, []);

  const loadGuestProfile = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      const guest = await getOrCreateGuestPlayer();
      if (mountedRef.current) {
        setPlayerProfile(guest);
        setError(null);
      }
    } catch (error) {
      console.error("Failed to load guest profile:", error);
      
      if (error.message?.includes('Network Error') || !navigator.onLine) {
        if (mountedRef.current) {
          setError("You appear to be offline. You can still browse courts but some features will be limited.");
          // Create an offline guest profile so the app can still work
          setPlayerProfile({
            id: 'offline-guest-' + Date.now(),
            display_name: 'Offline Guest',
            is_guest: true,
            availability_status: 'offline'
          });
        }
      } else {
        if (mountedRef.current) {
          setError("Having trouble connecting to our servers. You can still browse courts!");
          // Create a basic fallback profile
          setPlayerProfile({
            id: 'fallback-guest-' + Date.now(),
            display_name: 'Guest User',
            is_guest: true,
            availability_status: 'available'
          });
        }
      }
    }
  }, []);

  const loadNearbyTennisData = useCallback(async (forceLocation = null) => {
    if (loadingRef.current || !mountedRef.current) return;
    
    loadingRef.current = true;
    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      await retryNetworkRequest(async () => {
        if (!mountedRef.current) return;
        
        const [sessionsData, blocksData] = await Promise.all([
          CourtSession.list(),
          CourtBlock.list()
        ]);

        if (!mountedRef.current) return;

        const now = new Date();
        const trulyActiveSessions = sessionsData.filter(s => s.status === 'active' && new Date(s.estimated_end_time) > now);
        if (mountedRef.current) {
          setActiveSessions(trulyActiveSessions);
          setCourtBlocks(blocksData);
        }

        let effectiveSearchLocation = forceLocation || currentLocation;

        if (!effectiveSearchLocation) {
          console.log("No effective search location for tennis data");
          if (mountedRef.current) {
            setCourts([]);
            setNearbyPlayers([]);
          }
          return;
        }

        console.log("Loading tennis data for location:", effectiveSearchLocation);

        const cacheKey = `tennisStaticData_${effectiveSearchLocation.lat}_${effectiveSearchLocation.lng}`;
        let courtsData;
        let playersData;
        const cached = getCachedData(cacheKey);

        if (cached && !forceLocation) { 
          courtsData = cached.courts;
          playersData = cached.players;
          console.log("Using cached tennis data");
        } else {
          console.log("Fetching fresh tennis data from API");
          [courtsData, playersData] = await Promise.all([
            Court.filter({ sport: 'tennis' }),
            Player.list()
          ]);
          
          if (!mountedRef.current) return;
          
          console.log(`Fetched ${courtsData.length} tennis courts and ${playersData.length} players`);
        }

        const courtsWithDistance = courtsData.map(court => ({
          ...court,
          distance: calculateDistance(
            effectiveSearchLocation.lat,
            effectiveSearchLocation.lng,
            court.latitude,
            court.longitude
          )
        }));

        const nearbyCourts = courtsWithDistance
          .filter(court => court.distance <= 15)
          .sort((a, b) => a.distance - b.distance);

        console.log(`Found ${nearbyCourts.length} tennis courts within 15 miles`);
        
        if (mountedRef.current) {
          setCourts(nearbyCourts);
        }
        
        const actualCurrentLocation = forceLocation || currentLocation;
        const playersWithDistance = playersData
          .filter(player => 
            player.current_latitude && 
            player.current_longitude && 
            player.availability_status === "available" &&
            actualCurrentLocation
          )
          .map(player => ({
            ...player,
            distance: calculateDistance(
              actualCurrentLocation.lat,
              actualCurrentLocation.lng,
              player.current_latitude,
              player.current_longitude
            )
          }))
          .filter(player => player.distance <= 15)
          .sort((a, b) => a.distance - b.distance);

        if (mountedRef.current) {
          setNearbyPlayers(playersWithDistance);

          if (!forceLocation) {
            setCachedData(cacheKey, {
              courts: nearbyCourts,
              players: playersWithDistance
            });
          }
        }
      });
      
      if (mountedRef.current) {
        setLastDataLoad(Date.now());
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error("Error loading nearby tennis data:", error);
      if (error.message === 'NETWORK_ERROR' || !navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection.");
      } else if (error.response?.status === 429) {
        setError("Too many requests. Please wait before refreshing.");
      } else if (error.response?.status >= 500) {
        setError("Server issues detected. Please try again in a moment.");
      } else {
        setError("Couldn't load tennis data. Please try refreshing.");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [currentLocation, calculateDistance]);

  const loadNearbyPickleballData = useCallback(async (forceLocation = null) => {
    if (loadingRef.current || !mountedRef.current) return;
    
    loadingRef.current = true;
    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      await retryNetworkRequest(async () => {
        if (!mountedRef.current) return;
        
        const [sessionsData, blocksData] = await Promise.all([
          CourtSession.list(),
          CourtBlock.list()
        ]);
        
        if (!mountedRef.current) return;
        
        if (mountedRef.current) {
          setCourtBlocks(blocksData);
        }

        let effectiveSearchLocation = forceLocation || currentLocation;

        if (!effectiveSearchLocation) {
          console.log("No effective search location for pickleball data");
          if (mountedRef.current) {
            setPickleballCourts([]);
            setActiveSessions([]);
            setWaitingSessions([]);
          }
          return;
        }

        console.log("Loading pickleball data for location:", effectiveSearchLocation);

        const cacheKey = `pickleballStaticData_${effectiveSearchLocation.lat}_${effectiveSearchLocation.lng}`;
        const cached = getCachedData(cacheKey);
        let courtsData;

        if (cached && !forceLocation) { 
          courtsData = cached.courtsData;
          console.log("Using cached pickleball data");
        } else {
          console.log("Fetching fresh pickleball data from API");
          [courtsData] = await Promise.all([Court.filter({ sport: "pickleball" })]);
          
          if (!mountedRef.current) return;
          
          console.log(`Fetched ${courtsData.length} pickleball courts`);
        }
        
        const courtsWithDistance = courtsData.map(court => ({
          ...court, 
          distance: calculateDistance(effectiveSearchLocation.lat, effectiveSearchLocation.lng, court.latitude, court.longitude)
        }))
          .filter(court => court.distance <= 25)
          .sort((a, b) => a.distance - b.distance);
        
        console.log(`Found ${courtsWithDistance.length} pickleball courts within 25 miles`);
        
        if (mountedRef.current) {
          setPickleballCourts(courtsWithDistance);
        }

        const now = new Date();
        const pickleballSessions = sessionsData.filter(s => 
          courtsData.some(court => court.id === s.court_id && court.sport === 'pickleball') &&
          new Date(s.estimated_end_time) > now
        );
        
        const activeSess = pickleballSessions.filter(s => s.status === 'active');
        
        if (mountedRef.current) {
          setActiveSessions(activeSess);
          setWaitingSessions(pickleballSessions);

          if (!forceLocation) {
            setCachedData(cacheKey, { courtsData });
          }
        }
      });
      
      if (mountedRef.current) {
        setLastDataLoad(Date.now());
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error("Error loading pickleball data:", error);
      if (error.message === 'NETWORK_ERROR' || !navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection.");
      } else if (error.response?.status === 429) {
        setError("Too many requests. Please wait before refreshing.");
      } else if (error.response?.status >= 500) {
        setError("Server issues detected. Please try again in a moment.");
      } else {
        setError("Couldn't load pickleball data. Please try refreshing.");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [currentLocation, calculateDistance]);

  // Enhanced useEffect for initial guest setup
  useEffect(() => {
    if (initializingRef.current) return;
    
    const initializeGuestDashboard = async () => {
      if (!mountedRef.current) return;
      
      initializingRef.current = true;
      setIsLoading(true);
      setError(null); // Clear previous general errors
      setLocationError(null); // Clear previous location errors
      
      try {
        await loadGuestProfile();
        await checkLocationPermission();
      } catch (error) {
        if (!mountedRef.current) return;
        
        console.error("Guest dashboard initialization error:", error);
        setError("There was a problem initializing the guest experience. Please refresh and try again.");
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          initializingRef.current = false;
        }
      }
    };

    initializeGuestDashboard();
  }, [loadGuestProfile, checkLocationPermission]);

  useEffect(() => {
    if (!mountedRef.current || !playerProfile || locationPermission !== true) return; // Only load data if permission is explicitly true
    
    if (loadingRef.current || Date.now() - lastDataLoad < 30000) {
      return;
    }

    if (currentLocation) {
      const loadData = async () => {
        try {
          if (sportView === 'tennis') {
            await loadNearbyTennisData();
          } else {
            await loadNearbyPickleballData();
          }
        } catch (err) {
          console.error("Data loading failed in useEffect:", err);
        }
      };
      loadData();
    } else {
      // If locationPermission is true but currentLocation is null, it indicates a temporary state
      // or an issue where location was granted but coords are not yet available.
      // We don't clear courts here, but wait for currentLocation.
      console.log("Location permission granted, but currentLocation is null. Waiting for location data...");
    }
  }, [currentLocation, playerProfile, sportView, lastDataLoad, loadNearbyTennisData, loadNearbyPickleballData, locationPermission]); 

  const retryLocation = () => {
    setLocationError(null); // Clear previous location error
    setIsLoading(true); // Set loading to true
    checkLocationPermission(); // Retry
  };

  const getAvailableCourts = (court) => {
    const courtPlayerSessions = activeSessions.filter(session => session.court_id === court.id && session.sport === 'tennis');
    
    const activeCourtBlocks = courtBlocks.filter(block => {
      if (block.court_id !== court.id) return false;
      const now = new Date();
      const blockStart = new Date(block.start_time);
      const blockEnd = new Date(block.end_time);
      return now >= blockStart && now <= blockEnd;
    });

    const occupiedPlayerCourts = new Set(courtPlayerSessions.map(s => s.court_number));
    const blockedCourtNumbers = new Set(activeCourtBlocks.map(b => b.court_number));
    
    const totalUniqueOccupied = new Set([...occupiedPlayerCourts, ...blockedCourtNumbers]).size;

    return Math.max(0, court.total_courts - totalUniqueOccupied);
  };

  const getEstimatedTennisWaitTime = (court) => {
    const courtSessions = activeSessions.filter(session => session.court_id === court.id && session.sport === 'tennis');
    if (courtSessions.length === 0) return 0;
    
    const earliestEndTime = courtSessions.reduce((earliest, session) => {
      const endTime = new Date(session.estimated_end_time);
      return endTime < earliest ? endTime : earliest;
    }, new Date(courtSessions[0].estimated_end_time));
    
    const now = new Date();
    const waitTimeMinutes = Math.max(0, Math.ceil((earliestEndTime - now) / (1000 * 60)));
    return waitTimeMinutes;
  };
  
  const getPickleballPlayersOnCourt = (court) => {
      return activeSessions.filter(session => session.court_id === court.id && session.sport === 'pickleball').length;
  };
  
  const getPickleballPlayersWaiting = (court) => {
      return waitingSessions.filter(session => session.court_id === court.id && session.status === 'waiting').length;
  };
  
  const getEstimatedPickleballWaitTime = (court) => {
      const playersOnCourt = getPickleballPlayersOnCourt(court);
      const playersWaiting = getPickleballPlayersWaiting(court);
      
      const now = new Date();
      const activeBlocks = courtBlocks.filter(block => {
          if (block.court_id !== court.id) return false;
          const blockStart = new Date(block.start_time);
          const blockEnd = new Date(block.end_time);
          return now >= blockStart && now <= blockEnd;
      });
      const blockedCourtNumbers = [...new Set(activeBlocks.map(b => b.court_number))];
      const availableCourtCount = Math.max(0, court.total_courts - blockedCourtNumbers.length);

      const maxPlayersWithoutWait = availableCourtCount * 4;
      
      if (playersOnCourt < maxPlayersWithoutWait) {
        return 0;
      }
      
      if (playersWaiting === 0) return 0;
      
      const avgGameTime = 20;
      const effectiveCourts = Math.max(1, availableCourtCount);
      const waitingGroups = Math.ceil(playersWaiting / 4);
      
      return Math.ceil(waitingGroups / effectiveCourts) * avgGameTime;
  };

  const handlePlayRecommendation = (recommendation) => {
    const courtsSection = document.querySelector('[data-courts-section]');
    if (courtsSection) {
      courtsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isGuest = playerProfile?.is_guest || false;

  // Show location permission screen if not granted
  if (locationPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <LocationPermission onRetry={retryLocation} error={locationError} />
        </div>
      </div>
    );
  }
  
  if (isLoading && !currentLocation) {
     return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
        <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Getting your location...</p>
            <p className="text-sm text-gray-500 mt-2">This can take a moment, especially on the first try.</p>
        </div>
      </div>
    );
  }

  const getLocationStatusText = () => {
    if (isLoading && !currentLocation) {
        return 'Locating...';
    }
    if (currentLocation) {
        if (locationSource === 'gps') return 'Searching from your precise GPS location';
        if (locationSource === 'cached') return 'Searching from your cached location';
        if (locationSource === 'manual_gps') return 'Searching from your manually updated location';
        if (locationSource === 'very_old_cache') return 'Searching from your approximate location (older cache)';
        if (locationSource === 'approximate_cache') return 'Searching from your approximate cached location';
        return 'Searching from current location';
    }
    return 'Location not available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Guest Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust2" alt="OpenCourts Logo" className="w-8 h-8" />
                <h1 className="text-xl font-bold text-gray-900">OpenCourts</h1>
              </Link>
              {playerProfile && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Playing as: {playerProfile.display_name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSignUp} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up Free
              </Button>
              <Link to={createPageUrl("Home")}>
                <Button variant="outline">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 max-w-full overflow-x-hidden pb-[5rem] sm:pb-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>{!navigator.onLine ? "You're Offline" : "Connection Issue"}</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <span>{error}</span>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="w-fit"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Page
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span className="text-xs sm:text-sm text-gray-500">
                {getLocationStatusText()}
              </span>
            </div>
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Find Courts Near You</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {sportView === 'tennis' ? `${courts.length} tennis courts found` : `${pickleballCourts.length} pickleball courts found`} • {nearbyPlayers.length} players nearby
                </p>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Privacy-First:</strong> Check in to courts and see if they're occupied - but your identity stays completely private. No one can see who is playing.
                    <Button 
                      variant="link" 
                      onClick={handleSignUp}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium ml-1"
                    >
                      Sign up free
                    </Button>
                    {" "}to connect with players (when you choose to), save favorite courts, and access tournaments.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => setSportView('tennis')} 
                  variant={sportView === 'tennis' ? 'default' : 'outline'} 
                  className={`text-xs sm:text-sm ${sportView === 'tennis' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                  size="sm"
                >
                  <MapPin className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 w-4" /> Tennis
                </Button>
                <Button 
                  onClick={() => setSportView('pickleball')} 
                  variant={sportView === 'pickleball' ? 'default' : 'outline'} 
                  className={`text-xs sm:text-sm ${sportView === 'pickleball' ? 'bg-teal-500 hover:bg-teal-600' : ''}`}
                  size="sm"
                >
                  <Voicemail className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 w-4" /> Pickleball
                </Button>
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          {currentLocation && (
            <div className="mb-6 sm:mb-8">
              <WeatherWidget 
                currentLocation={currentLocation}
                courts={sportView === 'tennis' ? courts : pickleballCourts}
                onPlayRecommendation={handlePlayRecommendation}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6 sm:mb-8">
            <QuickActions 
              playerProfile={playerProfile}
              isGuest={isGuest}
              nearbyPlayers={nearbyPlayers}
              availableCourts={courts.filter(court => getAvailableCourts(court) > 0)}
            />
          </div>

          {/* Courts Section */}
          <div data-courts-section>
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">
                Don't see your favorite park near your house? Use the{" "}
                <Link 
                  to={createPageUrl("AddCourt")} 
                  className="text-emerald-600 hover:bg-emerald-700 font-medium underline"
                >
                  add courts option
                </Link>
                {" "}to add your favorite courts.
              </p>
            </div>

            {sportView === 'tennis' ? (
                <CourtList 
                  courts={courts}
                  activeSessions={activeSessions}
                  courtBlocks={courtBlocks}
                  getAvailableCourts={getAvailableCourts}
                  getEstimatedWaitTime={getEstimatedTennisWaitTime}
                  isLoading={isLoading}
                  onRefresh={loadNearbyTennisData}
                  currentPlayer={playerProfile}
                />
            ) : (
                <PickleballCourtList
                    courts={pickleballCourts}
                    activeSessions={activeSessions}
                    waitingSessions={waitingSessions}
                    courtBlocks={courtBlocks}
                    getPlayersOnCourt={getPickleballPlayersOnCourt}
                    getPlayersWaiting={getPickleballPlayersWaiting}
                    getEstimatedWaitTime={getEstimatedPickleballWaitTime}
                    isLoading={isLoading}
                    onRefresh={loadNearbyPickleballData}
                    currentPlayer={playerProfile}
                />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
