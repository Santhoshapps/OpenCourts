
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Zap } from "lucide-react";
import { Court, Player, FavoriteCourt } from "@/api/entities"; // Added FavoriteCourt assuming it's part of entities/all, adjust if needed
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { geocodeAddress } from "@/api/functions"; // New import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // New imports
import { Skeleton } from "@/components/ui/skeleton"; // New import

export default function SyncCourts() {
  const [isSyncing, setIsSyncing] = useState(false); // For LLM sync
  const [isProcessingFile, setIsProcessingFile] = useState(false); // For file upload processing
  const [playerProfile, setPlayerProfile] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [processingMessage, setProcessingMessage] = useState(""); // New state for file processing status
  const [syncResult, setSyncResult] = useState(null); // New state for file processing summary { created: 0, updated: 0, failed: 0, errors: [] }
  const [showProcessingDetails, setShowProcessingDetails] = useState(false); // New state to control visibility of processing alerts
  const [file, setFile] = useState(null); // New state for the selected file

  useEffect(() => {
    loadPlayerAndLocation();
  }, []);
  
  const loadPlayerAndLocation = async () => {
    try {
        const user = await User.me();
        const players = await Player.filter({ user_id: user.id });
        if (players.length > 0) {
            setPlayerProfile(players[0]);
        }
    } catch (error) {
        console.error("Error loading player profile:", error);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            (error) => console.error("Location error:", error)
        );
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

  const syncCourtsWithGoogleMaps = async () => {
    if (!currentLocation && (!playerProfile?.use_home_location || !playerProfile?.home_latitude)) {
      alert("Please enable location services or set a home address in your profile to find new courts.");
      return;
    }
    setIsSyncing(true);

    try {
      let searchLat, searchLng, searchDescription;
      if (playerProfile?.use_home_location && playerProfile?.home_latitude && playerProfile?.home_longitude) {
        searchLat = playerProfile.home_latitude;
        searchLng = playerProfile.home_longitude;
        searchDescription = "home location";
      } else {
        searchLat = currentLocation.lat;
        searchLng = currentLocation.lng;
        searchDescription = "current location";
      }

      const timezoneSchema = { type: "object", properties: { timezone: { type: "string" } }, required: ["timezone"] };
      const timezoneResult = await InvokeLLM({
          prompt: `What is the IANA timezone for latitude ${searchLat} and longitude ${searchLng}?`,
          add_context_from_internet: true, response_json_schema: timezoneSchema,
      });
      const searchTimezone = timezoneResult?.timezone || "America/New_York";

      const courtSchemaForExtraction = {
        type: "object",
        properties: {
          tennis_courts: { type: "array", items: { type: "object", properties: { name: { type: "string" }, address: { type: "string" }, latitude: { type: "number" }, longitude: { type: "number" }, court_count: { type: "number" }, facility_type: { type: "string" } }, required: ["name", "address", "latitude", "longitude"]}},
          pickleball_courts: { type: "array", items: { type: "object", properties: { name: { type: "string" }, address: { type: "string" }, latitude: { type: "number" }, longitude: { type: "number" }, court_count: { type: "number" }, facility_type: { type: "string" } }, required: ["name", "address", "latitude", "longitude"]}}
        }
      };

      const result = await InvokeLLM({
        prompt: `Find ONLY public parks, recreation centers, and municipal facilities with tennis courts AND pickleball courts within a 10-mile radius of latitude ${searchLat} and longitude ${searchLng}. EXCLUDE private clubs, residential courts, and HOA facilities. For each PUBLIC facility found, identify court type and details.`,
        add_context_from_internet: true,
        response_json_schema: courtSchemaForExtraction
      });

      if (result && (result.tennis_courts?.length > 0 || result.pickleball_courts?.length > 0)) {
        const existingCourts = await Court.list();
        const courtsToCreate = [];
        const processCourts = (courtList, sport) => {
            if (!courtList) return;
            const publicCourts = courtList.filter(court => {
                const name = court.name.toLowerCase();
                const facilityType = court.facility_type?.toLowerCase() || '';
                const privateKeywords = ['country club', 'private', 'club', 'residential', 'hoa'];
                const isPrivate = privateKeywords.some(keyword => name.includes(keyword) || facilityType.includes(keyword));
                return !isPrivate;
            });
            const newCourts = publicCourts.filter(googleCourt => 
                !existingCourts.some(dbCourt => calculateDistance(googleCourt.latitude, googleCourt.longitude, dbCourt.latitude, dbCourt.longitude) < 0.1)
            );
            newCourts.forEach(court => courtsToCreate.push({
                name: court.name, address: court.address, latitude: court.latitude, longitude: court.longitude,
                total_courts: court.court_count || 2, court_type: 'hard', is_public: true,
                amenities: ["parking"], sport: sport, timezone: searchTimezone
            }));
        };

        processCourts(result.tennis_courts, 'tennis');
        processCourts(result.pickleball_courts, 'pickleball');
        
        if (courtsToCreate.length > 0) {
          await Court.bulkCreate(courtsToCreate);
          const tennisCount = courtsToCreate.filter(c => c.sport === 'tennis').length;
          const pickleballCount = courtsToCreate.filter(c => c.sport === 'pickleball').length;
          let message = `Sync complete! Found and added ${courtsToCreate.length} new public courts near your ${searchDescription}!\n`;
          if (tennisCount > 0) message += `• ${tennisCount} tennis facilities\n`;
          if (pickleballCount > 0) message += `• ${pickleballCount} pickleball facilities`;
          alert(message);
        } else {
          alert(`No new public tennis or pickleball courts found near your ${searchDescription}.`);
        }
      } else {
        alert(`No public courts found by Google Maps in this area.`);
      }
    } catch (error) {
      console.error("Error syncing with Google Maps:", error);
      alert(`An error occurred while syncing courts.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // New function from outline for processing uploaded placemark data
  const processPlacemarks = async (placemarks) => {
    setIsProcessingFile(true);
    setProcessingMessage("Starting to process placemarks...");
    setSyncResult(null); // Clear previous results
    setShowProcessingDetails(true); // Show details alert

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const processingErrors = [];

    const allCourts = await Court.list(); // Fetch all courts once for efficient lookup

    for (const placemark of placemarks) {
        setProcessingMessage(`Processing: ${placemark.name}`);
        try {
            const address = placemark.address;

            // Geocode address using Google Maps API
            const { data: geoResult, error: geoError } = await geocodeAddress({ address });

            if (geoError || !geoResult || geoResult.latitude === undefined || geoResult.longitude === undefined) {
                throw new Error(`Geocoding failed for ${placemark.name}: ${geoError?.message || 'Unknown error. Check address format or API key.'}`);
            }
            const { latitude, longitude, timezone } = geoResult;

            const courtData = {
                name: placemark.name,
                address: address,
                latitude,
                longitude,
                // Safely extract court_count and court_type, providing defaults
                total_courts: parseInt(placemark.description?.match(/Number of courts: (\d+)/)?.[1], 10) || 1,
                court_type: placemark.description?.match(/Surface: (\w+)/)?.[1]?.toLowerCase() || "hard",
                is_public: true,
                sport: placemark.sport || "tennis", // Assume placemark might specify sport, default to tennis
                timezone: timezone || "America/New_York"
            };

            const existingCourt = allCourts.find(court =>
                // Check if a court already exists at a very close proximity (0.2 miles)
                calculateDistance(latitude, longitude, court.latitude, court.longitude) < 0.2
            );

            if (existingCourt) {
                // Update existing court
                await Court.update(existingCourt.id, courtData);
                updatedCount++;
            } else {
                // Create new court
                const newCourt = await Court.create(courtData);
                // The outline used 'currentPlayer', which maps to 'playerProfile' in this component
                if (newCourt && newCourt.id && playerProfile) {
                    await FavoriteCourt.create({
                        player_id: playerProfile.id,
                        court_id: newCourt.id
                    });
                }
                createdCount++;
            }
        } catch (err) {
            console.error(`Failed to process ${placemark.name}:`, err);
            failedCount++;
            processingErrors.push(`- ${placemark.name}: ${err.message}`);
        }
    }
    
    setSyncResult({ created: createdCount, updated: updatedCount, failed: failedCount, errors: processingErrors });
    setProcessingMessage("Processing complete.");
    setIsProcessingFile(false);
  };

  // New function from outline for handling file uploads
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) {
      setFile(null);
      setSyncResult(null);
      setShowProcessingDetails(false);
      return;
    }
    setFile(uploadedFile);
    setSyncResult(null); // Clear previous results when new file is selected
    setShowProcessingDetails(false); // Hide details until processing starts

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let placemarks = [];

        // Currently assuming JSON format for placemarks
        if (uploadedFile.name.toLowerCase().endsWith('.json')) {
            placemarks = JSON.parse(content);
        } else {
            alert("Unsupported file format. Please upload a JSON file.");
            setFile(null);
            return;
        }

        if (!Array.isArray(placemarks) || placemarks.length === 0) {
            alert("No valid placemarks found in the file. Please ensure it's an array of objects.");
            setFile(null);
            return;
        }

        await processPlacemarks(placemarks);

      } catch (error) {
        console.error("Error reading or parsing file:", error);
        alert(`Error processing file: ${error.message}`);
        setSyncResult({ created: 0, updated: 0, failed: 0, errors: [`File parsing error: ${error.message}`] });
        setIsProcessingFile(false);
        setFile(null);
      }
    };
    reader.readAsText(uploadedFile);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-emerald-600" />
                Automated Court Sync
            </CardTitle>
            <CardDescription>
                Use our AI-powered tool to automatically find and add all public tennis and pickleball courts near your location from Google Maps. This helps keep our database fresh and comprehensive.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button
                onClick={syncCourtsWithGoogleMaps}
                disabled={isSyncing || isProcessingFile}
                className="w-full sm:w-auto"
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? `Searching all courts...` : `Sync All Courts Now (AI-Powered)`}
            </Button>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 mb-4 text-lg">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Upload Placemark Data
                </CardTitle>
                <CardDescription className="mb-4">
                    Upload a JSON file containing court placemark data (e.g., from an external source) to automatically add or update courts. Each object in the JSON array should have at least `name` and `address` properties.
                </CardDescription>
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    disabled={isSyncing || isProcessingFile}
                />
                {file && <p className="mt-2 text-sm text-gray-600">Selected file: {file.name}</p>}

                {isProcessingFile && (
                    <div className="mt-4 flex items-center space-x-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <span className="text-sm text-gray-500 animate-pulse">{processingMessage}</span>
                    </div>
                )}

                {syncResult && showProcessingDetails && (
                    <Alert className="mt-4">
                        <AlertTitle>Processing Summary</AlertTitle>
                        <AlertDescription>
                            <p><strong>Created:</strong> {syncResult.created}</p>
                            <p><strong>Updated:</strong> {syncResult.updated}</p>
                            <p><strong>Failed:</strong> {syncResult.failed}</p>
                            {syncResult.errors.length > 0 && (
                                <div className="mt-2">
                                    <h4 className="font-semibold text-red-700">Errors:</h4>
                                    <ul className="list-disc list-inside text-red-600 text-sm">
                                        {syncResult.errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
