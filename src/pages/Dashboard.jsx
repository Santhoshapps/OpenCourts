
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Court, CourtSession, Player, CourtBlock } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Navigation, Play, RefreshCw, PlusCircle, Voicemail, Home, Layers, User as UserIcon, Target, XCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import LocationPermission from "../components/dashboard/LocationPermission";
import CourtList from "../components/dashboard/CourtList";
import PickleballCourtList from "../components/pickleball/PickleballCourtList";
import BasketballCourtList from "../components/basketball/BasketballCourtList";
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

export default function Dashboard() {
  const [courts, setCourts] = useState([]);
  const [pickleballCourts, setPickleballCourts] = useState([]);
  const [basketballCourts, setBasketballCourts] = useState([]);
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [courtBlocks, setCourtBlocks] = useState([]); // State for court blocks
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null); // Changed to null
  const [isLoading, setIsLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [sportView, setSportView] = useState('basketball'); // Set default view to basketball
  const [error, setError] = useState(null); // General application errors
  const [lastDataLoad, setLastDataLoad] = useState(0);
  const [locationError, setLocationError] = useState(null); // Dedicated state for location errors
  const [locationSource, setLocationSource] = useState(null); // Track how we got location

  // Refs to prevent duplicate API calls and handle component unmounting
  const loadingRef = useRef(false);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true); // Track if component is mounted

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced retryNetworkRequest with better error detection
  const retryNetworkRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.log(`Network request failed (attempt ${attempt}):`, error);
        
        // Enhanced network error detection
        const isNetworkError = 
          error.message?.includes('Network Error') || 
          error.message?.includes('timeout') ||
          error.message?.includes('ERR_NETWORK') ||
          error.name === 'AxiosError' || // Common for Axios (used by entities)
          error.code === 'ERR_NETWORK' || 
          error.code === 'NETWORK_ERROR' || 
          !navigator.onLine || 
          (error.response && error.response.status >= 500) ||
          (error.response && error.response.status === 0); // Connection refused, CORS issues

        if (attempt === maxRetries) {
          // On final attempt, throw a more specific error
          if (isNetworkError) {
            const networkError = new Error('NETWORK_ERROR');
            networkError.originalError = error; // Store the original error for debugging
            throw networkError;
          }
          throw error; // Re-throw the original error if not a retryable network error
        }
        
        if (isNetworkError) {
          console.log(`Retrying network request in ${delay * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue; // Continue to the next attempt
        }
        
        // If it's not a retryable error, throw immediately
        throw error;
      }
    }
  };

  // Memoize calculateDistance to prevent useCallback dependencies from changing
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Log distance calculations for debugging
    console.log(`Distance from (${lat1}, ${lon1}) to (${lat2}, ${lon2}): ${distance.toFixed(3)} miles`);
    
    return distance;
  }, []);

  // Enhanced updatePlayerLocation with better error handling
  const updatePlayerLocation = useCallback(async (lat, lng) => {
    if (!mountedRef.current || !playerProfile || playerProfile.is_guest) return; // Don't update location for guests
    
    try {
      await retryNetworkRequest(async () => {
        if (!mountedRef.current) return;
        
        // Ensure playerProfile is available before attempting to update
        if (!playerProfile) {
          try {
            const user = await User.me();
            if (!mountedRef.current) return;
            
            const players = await Player.filter({ user_id: user.id });
            if (!mountedRef.current) return;
            
            if (players.length > 0) {
              if (mountedRef.current) {
                setPlayerProfile(players[0]);
              }
              await Player.update(players[0].id, {
                current_latitude: lat,
                current_longitude: lng,
                last_location_update: new Date().toISOString(),
                availability_status: "available"
              });
            } else {
              console.warn("Player profile not found, cannot update location.");
            }
          } catch (error) {
            console.error("Error getting user/player data for update:", error);
            throw error; // Re-throw to be caught by outer try-catch
          }
          return;
        }

        await Player.update(playerProfile.id, {
          current_latitude: lat,
          current_longitude: lng,
          last_location_update: new Date().toISOString(),
          availability_status: "available"
        });
      });
    } catch (error) {
      console.error("Error updating player location:", error);
      // Don't set visible error for location updates as it's a background operation
      // But ensure we don't leave unhandled promises if retryNetworkRequest throws
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

    setLocationError(null); // Clear previous location errors
    setIsLoading(true);

    try {
      const position = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Location request timed out after 30 seconds."));
        }, 30000); // Overall promise timeout

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            let errorType = 'unknown';
            let errorMessage = err.message;

            if (err.code === err.PERMISSION_DENIED) {
                errorType = 'denied';
                errorMessage = "Location access was denied. You'll need to enable it in your browser settings to find nearby courts.";
            } else if (err.code === err.POSITION_UNAVAILABLE) {
                errorType = 'unavailable';
                errorMessage = "Your device reported that location is currently unavailable. Check your device's GPS or location settings.";
            } else if (err.code === err.TIMEOUT) {
                errorType = 'timeout';
                errorMessage = "Could not get your location in time. This can happen with a weak signal. Try moving to an open area.";
            }
            reject({ type: errorType, message: errorMessage, code: err.code });
          },
          { 
            enableHighAccuracy: true, // Request high accuracy
            timeout: 25000,          // Geolocation API's internal timeout
            maximumAge: 60000        // Accept cached location up to 1 minute old
          }
        );
      });
      
      if (!mountedRef.current) return;

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log("Location acquired:", newLocation, "Accuracy:", position.coords.accuracy, "meters");
      
      if (mountedRef.current) {
        setCurrentLocation(newLocation);
        setLocationPermission(true);
        setLocationError(null); // Clear any previous errors on success
        setLocationSource('gps');
        await updatePlayerLocation(position.coords.latitude, position.coords.longitude);
      }
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error("Location error during checkLocationPermission:", err.message);
      setCurrentLocation(null);
      setLocationPermission(false); // Set permission to false on any failure

      let specificError = { type: 'unknown', message: 'An unexpected error occurred while fetching your location.' };
      
      if (err.type) { // Error object from our promise rejection
        specificError.type = err.type;
        specificError.message = err.message;
      } else if (err.message?.includes("timed out")) { // Generic timeout error from browser
          specificError.type = 'timeout';
          specificError.message = "Could not get your location in time. This can happen with a weak signal. Try moving to an open area.";
      }
      
      if (mountedRef.current) {
          setLocationError(specificError);
      }
    } finally {
        if(mountedRef.current) {
            setIsLoading(false);
        }
    }
  }, [updatePlayerLocation]);
  
  // Enhanced loadPlayerProfile with better error handling and guest support
  const loadPlayerProfile = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      // Try to get a logged-in user first
      const user = await User.me();
      const players = await Player.filter({ user_id: user.id });
      const profile = players.length > 0 ? players[0] : null;
      
      if (profile) {
        if (mountedRef.current) setPlayerProfile(profile);
      } else {
        // Logged in but no profile, create a guest profile as fallback
        console.warn("User is logged in but has no player profile. Creating guest fallback.");
        const guest = await getOrCreateGuestPlayer(); 
        if (mountedRef.current) setPlayerProfile(guest);
      }

    } catch (error) {
      // User is not logged in or network error, treat as a guest
      console.log("User not logged in or network error, loading guest profile:", error.message);
      try {
        const guest = await getOrCreateGuestPlayer();
        if (mountedRef.current) setPlayerProfile(guest);
      } catch (guestError) {
        console.error("Failed to load or create guest player profile:", guestError);
        
        // Enhanced error handling for guest creation
        if (guestError.message?.includes('Network Error') || !navigator.onLine) {
          if (mountedRef.current) {
            setError("You appear to be offline. The app will work with limited features until connection is restored.");
            // Create a minimal offline profile so the app can still function
            setPlayerProfile({
              id: 'offline-guest-' + Date.now(),
              display_name: 'Offline Player',
              is_guest: true,
              availability_status: 'offline'
            });
          }
        } else {
          if (mountedRef.current) {
            setError("Could not initialize player session. Some features may be limited.");
            // Create a minimal fallback profile
            setPlayerProfile({
              id: 'fallback-guest-' + Date.now(),
              display_name: 'Guest Player',
              is_guest: true,
              availability_status: 'available'
            });
          }
        }
      }
    }
  }, []);

  // Enhanced loadNearbyTennisData with better error handling
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
        
        // DYNAMIC DATA: Fetch sessions and blocks every time, outside of cache
        const [sessionsData, blocksData] = await Promise.all([
          CourtSession.list(),
          CourtBlock.list()
        ]);

        if (!mountedRef.current) return;

        const now = new Date();
        const trulyActiveSessions = sessionsData.filter(s => s.status === 'active' && s.sport === 'tennis' && new Date(s.estimated_end_time) > now);
        if (mountedRef.current) {
          setActiveSessions(trulyActiveSessions);
          setCourtBlocks(blocksData);
        }

        // Determine effective search location
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

        // STATIC DATA: Check cache for courts and players
        const cacheKey = `tennisStaticData_${effectiveSearchLocation.lat}_${effectiveSearchLocation.lng}`;
        let courtsData;
        let playersData;
        const cached = getCachedData(cacheKey);

        // Use cached data only if no forced location refresh
        if (cached && !forceLocation) { 
          courtsData = cached.courts;
          playersData = cached.players;
          console.log("Using cached tennis data");
        } else {
          // If not cached or forcing refresh, fetch STATIC court and player data
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

        // Filter courts within 15 miles and sort by distance
        const nearbyCourts = courtsWithDistance
          .filter(court => court.distance <= 15)
          .sort((a, b) => a.distance - b.distance);

        console.log(`Found ${nearbyCourts.length} tennis courts within 15 miles`);
        
        if (mountedRef.current) {
          setCourts(nearbyCourts);
        }
        
        // Filter players within 15 miles (always use the most accurate available location for players, which is currentLocation if set)
        const actualCurrentLocation = forceLocation || currentLocation;
        const playersWithDistance = playersData
          .filter(player => 
            player.current_latitude && 
            player.current_longitude && 
            player.availability_status === "available" &&
            actualCurrentLocation // Ensure actual currentLocation is available for player distance calculation
          )
          .map(player => ({
            ...player,
            distance: calculateDistance(
              actualCurrentLocation.lat, // Use actual current location for player search
              actualCurrentLocation.lng, // Use actual current location for player search
              player.current_latitude,
              player.current_longitude
            )
          }))
          .filter(player => player.distance <= 15)
          .sort((a, b) => a.distance - b.distance);

        if (mountedRef.current) {
          setNearbyPlayers(playersWithDistance);

          // Update STATIC data in cache only if not a forced refresh scenario
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
      // Enhanced error handling
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

  // Enhanced loadNearbyPickleballData with better error handling
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
        
        // DYNAMIC DATA: Fetch sessions and blocks every time, outside of cache
        const [sessionsData, blocksData] = await Promise.all([
          CourtSession.list(),
          CourtBlock.list()
        ]);
        
        if (!mountedRef.current) return;
        
        const now = new Date();
        const pickleballActiveSessions = sessionsData.filter(s => s.status === 'active' && s.sport === 'pickleball' && new Date(s.estimated_end_time) > now);
        if (mountedRef.current) {
          setActiveSessions(pickleballActiveSessions);
          setCourtBlocks(blocksData);
        }

        // Determine effective search location
        let effectiveSearchLocation = forceLocation || currentLocation;

        if (!effectiveSearchLocation) {
          console.log("No effective search location for pickleball data");
          if (mountedRef.current) {
            setPickleballCourts([]);
            setWaitingSessions([]);
          }
          return;
        }

        console.log("Loading pickleball data for location:", effectiveSearchLocation);

        // STATIC DATA: Check cache for courts
        const cacheKey = `pickleballStaticData_${effectiveSearchLocation.lat}_${effectiveSearchLocation.lng}`;
        const cached = getCachedData(cacheKey);
        let courtsData;

        // Use cached data only if no forced location refresh
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

          // Update STATIC data in cache only if not a forced refresh scenario
          if (!forceLocation) {
            setCachedData(cacheKey, { courtsData });
          }
        }

        // Filter sessions for pickleball and separate active from waiting
        const pickleballSessions = sessionsData.filter(s => 
          courtsData.some(court => court.id === s.court_id && court.sport === 'pickleball') &&
          new Date(s.estimated_end_time) > now
        );
        
        if (mountedRef.current) {
          setWaitingSessions(pickleballSessions); // Include both active and waiting for pickleball
        }
      });
      
      if (mountedRef.current) {
        setLastDataLoad(Date.now());
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error("Error loading pickleball data:", error);
      // Enhanced error handling
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

  // Enhanced loadNearbyBasketballData
  const loadNearbyBasketballData = useCallback(async (forceLocation = null) => {
    if (loadingRef.current || !mountedRef.current) return;
    
    loadingRef.current = true;
    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      await retryNetworkRequest(async () => {
        if (!mountedRef.current) return;
        
        // DYNAMIC DATA: Fetch sessions and blocks every time
        const [sessionsData, blocksData] = await Promise.all([
          CourtSession.list(),
          CourtBlock.list()
        ]);

        if (!mountedRef.current) return;

        const now = new Date();
        const basketballActiveSessions = sessionsData.filter(s => s.sport === 'basketball' && s.status === 'active' && new Date(s.estimated_end_time) > now);
        if (mountedRef.current) {
          setActiveSessions(basketballActiveSessions);
          setCourtBlocks(blocksData);
        }

        // Determine effective search location
        let effectiveSearchLocation = forceLocation || currentLocation;

        if (!effectiveSearchLocation) {
          console.log("No effective search location for basketball data");
          if (mountedRef.current) {
            setBasketballCourts([]);
          }
          return;
        }

        console.log("Loading basketball data for location:", effectiveSearchLocation);

        // STATIC DATA: Check cache for courts
        const cacheKey = `basketballStaticData_${effectiveSearchLocation.lat}_${effectiveSearchLocation.lng}`;
        let courtsData;
        const cached = getCachedData(cacheKey);

        if (cached && !forceLocation) { 
          courtsData = cached.courts;
          console.log("Using cached basketball data");
        } else {
          console.log("Fetching fresh basketball data from API");
          [courtsData] = await Promise.all([Court.filter({ sport: 'basketball' })]);
          
          if (!mountedRef.current) return;
          
          console.log(`Fetched ${courtsData.length} basketball courts`);
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

        // Filter courts within 15 miles and sort by distance
        const nearbyCourts = courtsWithDistance
          .filter(court => court.distance <= 15)
          .sort((a, b) => a.distance - b.distance);

        console.log(`Found ${nearbyCourts.length} basketball courts within 15 miles`);
        
        if (mountedRef.current) {
          setBasketballCourts(nearbyCourts);

          // Update cache
          if (!forceLocation) {
            setCachedData(cacheKey, { courts: nearbyCourts });
          }
        }
      });
      
      if (mountedRef.current) {
        setLastDataLoad(Date.now());
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error("Error loading nearby basketball data:", error);
      if (error.message === 'NETWORK_ERROR' || !navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection.");
      } else if (error.response?.status === 429) {
        setError("Too many requests. Please wait before refreshing.");
      } else if (error.response?.status >= 500) {
        setError("Server issues detected. Please try again in a moment.");
      } else {
        setError("Couldn't load basketball data. Please try refreshing.");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [currentLocation, calculateDistance]);

  // Enhanced useEffect for initial dashboard setup with better error handling
  useEffect(() => {
    if (initializingRef.current) return; // Prevent duplicate initialization
    
    const initializeDashboard = async () => {
      if (!mountedRef.current) return; // Exit if component unmounted
      
      initializingRef.current = true;
      setIsLoading(true);
      setError(null);
      setLocationError(null);
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view');
        if (view === 'pickleball') {
          if (mountedRef.current) {
            setSportView('pickleball');
          }
        } else if (view === 'basketball') { // Check for basketball view from URL
            if (mountedRef.current) {
              setSportView('basketball');
            }
        }

        // Load player profile first, but handle its error gracefully
        try {
          await loadPlayerProfile();
        } catch (profileError) {
          console.error("Player profile initialization failed (may be expected):", profileError);
          // Don't set a critical error here, as app can still function
        }
        
        if (!mountedRef.current) return; // Check if still mounted
        
        // Then try to get location, also handle its error gracefully
        try {
          await checkLocationPermission();
        } catch (locationCheckError) {
          console.error("Location permission initialization failed (may be expected):", locationCheckError);
          // checkLocationPermission already sets locationError state
        }

      } catch (error) {
        if (!mountedRef.current) return; // Don't set state if unmounted
        
        console.error("Dashboard initialization error:", error);
        
        // Generic error message if something unexpected goes wrong
        if (error.message === 'NETWORK_ERROR' || !navigator.onLine) {
          setError("You appear to be offline. Please check your internet connection and try again.");
        } else {
          setError("There was a problem initializing the dashboard. Please try refreshing the page.");
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          initializingRef.current = false;
        }
      }
    };

    // Wrap in try-catch to handle any synchronous errors during `initializeDashboard` setup
    try {
      initializeDashboard().catch(err => {
        // This catches unhandled promise rejections from initializeDashboard
        console.error("Critical dashboard initialization error (unhandled promise rejection):", err);
        if (mountedRef.current) {
          setError("Could not initialize the app. Please refresh the page.");
          setIsLoading(false);
          initializingRef.current = false;
        }
      });
    } catch (syncError) {
      // This catches synchronous errors during the call to initializeDashboard
      console.error("Synchronous dashboard initialization error:", syncError);
      if (mountedRef.current) {
        setError("Could not start the app. Please refresh the page.");
        setIsLoading(false);
        initializingRef.current = false;
      }
    }
  }, [loadPlayerProfile, checkLocationPermission]);

  // Enhanced data loading effect with better error handling
  useEffect(() => {
    if (!mountedRef.current || !playerProfile) return; // Wait for profile to load
    
    // Don't load data if we're still loading from a previous cycle or if it's been less than 30 seconds since last load
    if (loadingRef.current || Date.now() - lastDataLoad < 30000) {
      return;
    }

    // Determine the effective location to use for searches
    let effectiveLocation = null;
    
    if (currentLocation) {
      effectiveLocation = currentLocation;
    }

    // Load data if we have an effective location
    if (effectiveLocation) {
      console.log("Loading data with location:", effectiveLocation);
      // Wrap in try-catch to handle synchronous errors from loadNearby*Data calls
      const loadData = async () => {
        try {
          if (sportView === 'tennis') {
            await loadNearbyTennisData();
          } else if (sportView === 'pickleball') {
            await loadNearbyPickleballData();
          } else if (sportView === 'basketball') {
            await loadNearbyBasketballData();
          }
        } catch (err) {
          console.error("Data loading failed in useEffect:", err);
          // Specific error message already set by loadNearby*Data functions
        }
      };
      loadData();
    } else {
      // Clear data if no location is available and display a general error if no specific location error
      if (mountedRef.current) {
        setCourts([]);
        setPickleballCourts([]);
        setBasketballCourts([]);
        setNearbyPlayers([]);
        setActiveSessions([]);
        setWaitingSessions([]);
        if (!locationError && locationPermission === false) {
             setError("Location is unavailable, so we can't show nearby courts and players.");
        }
      }
      console.log("No effective location available, clearing court data");
    }
  }, [currentLocation, playerProfile, sportView, lastDataLoad, loadNearbyTennisData, loadNearbyPickleballData, loadNearbyBasketballData, locationError, locationPermission]); 

  // Manual location retry function
  const retryLocation = () => {
    if (mountedRef.current) {
      setLocationError(null); // Clear existing error
      setIsLoading(true); // Indicate loading state
      checkLocationPermission(); // Re-attempt location acquisition
    }
  };

  const isBlockCurrentlyActive = (block) => {
    const now = new Date();
    // This is a simplified check. A more robust one would consider timezone.
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    return now >= blockStart && now <= blockEnd;
  };

  // Tennis-specific helpers
  const getAvailableCourts = (court) => {
    // Get player sessions on this court
    const courtPlayerSessions = activeSessions.filter(session => session.court_id === court.id && session.sport === 'tennis');
    
    // Get currently active blocks on this court
    const activeCourtBlocks = courtBlocks.filter(block => block.court_id === court.id && isBlockCurrentlyActive(block));

    // Get unique court numbers occupied by players and blocks
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
    }, new Date(courtSessions[0].estimated_end_time)); // Initialize with first session's end time
    
    const now = new Date();
    const waitTimeMinutes = Math.max(0, Math.ceil((earliestEndTime - now) / (1000 * 60)));
    return waitTimeMinutes;
  };
  
  // Pickleball-specific helpers
  const getPickleballPlayersOnCourt = (court) => {
      return activeSessions.filter(session => session.court_id === court.id && session.sport === 'pickleball').length;
  };
  
  const getPickleballPlayersWaiting = (court) => {
      return waitingSessions.filter(session => session.court_id === court.id && session.status === 'waiting' && session.sport === 'pickleball').length;
  };
  
  const getEstimatedPickleballWaitTime = (court) => {
      const playersOnCourt = getPickleballPlayersOnCourt(court);
      const playersWaiting = getPickleballPlayersWaiting(court);
      
      const now = new Date();
      // This logic is simplified; a robust implementation would use a shared helper
      const activeBlocks = courtBlocks.filter(block => {
          if (block.court_id !== court.id) return false;
          // Note: Timezone should be handled here for accuracy
          const blockStart = new Date(block.start_time);
          const blockEnd = new Date(block.end_time);
          return now >= blockStart && now <= blockEnd;
      });
      const blockedCourtNumbers = [...new Set(activeBlocks.map(b => b.court_number))];
      const availableCourtCount = Math.max(0, court.total_courts - blockedCourtNumbers.length);

      const maxPlayersWithoutWait = availableCourtCount * 4;
      
      if (playersOnCourt < maxPlayersWithoutWait) {
        return 0; // No wait time if courts aren't full
      }
      
      if (playersWaiting === 0) return 0;
      
      // Calculate wait time: average game time is 20 minutes
      // Each court can handle 4 players, so waiting players divided by available court capacity
      const avgGameTime = 20;
      const effectiveCourts = Math.max(1, availableCourtCount);
      const waitingGroups = Math.ceil(playersWaiting / 4);
      
      return Math.ceil(waitingGroups / effectiveCourts) * avgGameTime;
  };

  const handlePlayRecommendation = (recommendation) => {
    // Scroll to courts section or highlight best courts
    const courtsSection = document.querySelector('[data-courts-section]');
    if (courtsSection) {
      courtsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check if user has a real profile or is a guest
  const isGuest = playerProfile?.is_guest || false;

  // Only show LocationPermission component if permission is explicitly denied
  if (locationPermission === false) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <LocationPermission onRetry={retryLocation} error={locationError} />
        </div>
    );
  }

  const getLocationStatusText = () => {
    if (isLoading && !currentLocation) {
        return 'Locating...';
    }
    if (currentLocation) {
        if (locationSource === 'gps') return 'Searching from your precise GPS location';
        if (locationSource === 'cached') return 'Searching from your cached location'; // No longer explicitly setting cached
        if (locationSource === 'manual_gps') return 'Searching from your manually updated location'; // No longer explicitly setting manual
        if (locationSource === 'very_old_cache') return 'Searching from your approximate location (older cache)'; // No longer explicitly setting very old cache
        if (locationSource === 'approximate_cache') return 'Searching from your approximate cached location'; // No longer explicitly setting approximate cache
        return 'Searching from current location'; // Default if source not specific
    }
    if (locationError) {
        return `Location unavailable: ${locationError.type}`;
    }
    return 'Location not available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 sm:p-6 max-w-full overflow-x-hidden pb-[5rem] sm:pb-6">
        <div className="max-w-7xl mx-auto">
          {/* General Application Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setError(null); setIsLoading(true); window.location.reload(); }}
                  className="w-fit mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
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
                  {sportView === 'tennis' ? `${courts.length} tennis courts found` : 
                   sportView === 'pickleball' ? `${pickleballCourts.length} pickleball courts found` :
                   `${basketballCourts.length} basketball courts found`} • {nearbyPlayers.length} players nearby
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => setSportView('tennis')} 
                  variant={sportView === 'tennis' ? 'default' : 'outline'} 
                  className={`text-xs sm:text-sm ${sportView === 'tennis' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                  size="sm"
                >
                  <MapPin className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Tennis
                </Button>
                <Button 
                  onClick={() => setSportView('pickleball')} 
                  variant={sportView === 'pickleball' ? 'default' : 'outline'} 
                  className={`text-xs sm:text-sm ${sportView === 'pickleball' ? 'bg-teal-500 hover:bg-teal-600' : ''}`}
                  size="sm"
                >
                  <Voicemail className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Pickleball
                </Button>
                <Button 
                  onClick={() => setSportView('basketball')} 
                  variant={sportView === 'basketball' ? 'default' : 'outline'} 
                  className={`text-xs sm:text-sm ${sportView === 'basketball' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                  size="sm"
                >
                  <Target className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Basketball
                </Button>
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          {currentLocation ? (
            <div className="mb-6 sm:mb-8">
              <WeatherWidget 
                currentLocation={currentLocation}
                courts={sportView === 'tennis' ? courts : sportView === 'pickleball' ? pickleballCourts : basketballCourts}
                onPlayRecommendation={handlePlayRecommendation}
              />
            </div>
          ) : isLoading ? (
            <div className="mb-6 sm:mb-8 p-4 bg-gray-100 rounded-lg animate-pulse h-24"></div>
          ) : null}

          {/* Quick Actions */}
          <div className="mb-6 sm:mb-8">
            <QuickActions 
              playerProfile={playerProfile}
              isGuest={isGuest} // Pass isGuest prop
              nearbyPlayers={nearbyPlayers}
              availableCourts={courts.filter(court => getAvailableCourts(court) > 0)}
            />
          </div>

          {/* Courts Section */}
          <div data-courts-section>
            {/* Helpful message about adding courts */}
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
                  courtBlocks={courtBlocks} // Pass blocks to CourtList
                  getAvailableCourts={getAvailableCourts}
                  getEstimatedWaitTime={getEstimatedTennisWaitTime}
                  isLoading={isLoading}
                  onRefresh={loadNearbyTennisData}
                  currentPlayer={playerProfile}
                />
            ) : sportView === 'pickleball' ? (
                <PickleballCourtList
                    courts={pickleballCourts}
                    activeSessions={activeSessions}
                    waitingSessions={waitingSessions}
                    courtBlocks={courtBlocks} // Pass blocks to PickleballCourtList
                    getPlayersOnCourt={getPickleballPlayersOnCourt}
                    getPlayersWaiting={getPickleballPlayersWaiting}
                    getEstimatedWaitTime={getEstimatedPickleballWaitTime}
                    isLoading={isLoading}
                    onRefresh={loadNearbyPickleballData}
                    currentPlayer={playerProfile}
                />
            ) : ( // Default to BasketballCourtList if sportView is 'basketball'
                <BasketballCourtList
                    courts={basketballCourts}
                    activeSessions={activeSessions}
                    courtBlocks={courtBlocks}
                    isLoading={isLoading}
                    onRefresh={loadNearbyBasketballData}
                    currentPlayer={playerProfile}
                />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
