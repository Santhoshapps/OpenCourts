
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Court, Player, FavoriteCourt } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, MapPin, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

const amenitiesList = ["Parking", "Restrooms", "Lights", "Water Fountain", "Backboard"];

export default function AddCourtPage() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    sport: "tennis", // Added sport field
    total_courts: 1,
    court_type: "hard", // Initial default, can change based on sport
    is_public: true,
    amenities: [],
    operating_hours_info: "", // Added operating hours
    has_hoops: null, // New field for basketball, boolean
    court_size: null, // New field for basketball, string ('full', 'half')
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(""); // Renamed from 'error' to submitError
  const navigate = useNavigate();
  const [parkSuggestions, setParkSuggestions] = useState([]);
  const [isSearchingParks, setIsSearchingParks] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [searchError, setSearchError] = useState(null); // New state for search errors
  const nameInputRef = useRef(null); // New ref for the name input
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const user = await User.me();
        const players = await Player.filter({ user_id: user.id });
        if (players.length > 0) {
          setCurrentPlayer(players[0]);
        }
      } catch (error) {
        console.error("Error loading current player:", error);
      }
    };
    loadPlayer();
  }, []);

  const handleNameChange = (e) => {
    const query = e.target.value;
    setFormData(prev => ({ ...prev, name: query, address: query === "" ? "" : prev.address }));
    setSearchError(null); // Clear previous errors when user types

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (!query || query.length < 3) {
      setParkSuggestions([]);
      return;
    }

    setDebounceTimeout(setTimeout(() => {
      searchForParks(query);
    }, 500));
  };

  const searchForParks = async (query) => {
    setIsSearchingParks(true);
    setParkSuggestions([]);
    setSearchError(null); // Reset error state on new search

    try {
      const parkSchema = {
        type: "object",
        properties: {
          locations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                facility_type: { type: "string", description: "Type of facility (public park, recreation center, etc.)" }
              },
              required: ["name", "address"]
            }
          }
        },
        required: ["locations"]
      };

      const result = await InvokeLLM({
        prompt: `Find ONLY public parks, recreation centers, and municipal facilities that match the name "${query}" and have or could have ${formData.sport} courts. 

INCLUDE:
- Public parks
- Municipal recreation centers  
- City/county sports complexes
- Community centers
- Public school facilities

EXCLUDE:
- Private country clubs
- Private tennis/pickleball clubs
- Residential community courts
- HOA facilities
- Private sports clubs

Provide a list of up to 5 PUBLIC locations with their name and full address.`,
        add_context_from_internet: true,
        response_json_schema: parkSchema
      });

      if (result && result.locations) {
        // Filter to ensure only public facilities
        const publicLocations = result.locations.filter(location => {
          const name = location.name.toLowerCase();
          const facilityType = location.facility_type?.toLowerCase() || '';
          
          const privateKeywords = ['country club', 'private club', 'tennis club', 'racquet club', 'residential', 'hoa', 'homeowners', 'gated'];
          const isPrivate = privateKeywords.some(keyword => name.includes(keyword) || facilityType.includes(keyword));
          
          const publicKeywords = ['park', 'recreation', 'municipal', 'city', 'county', 'community center', 'public', 'school'];
          const isPublic = publicKeywords.some(keyword => name.includes(keyword) || facilityType.includes(keyword));
          
          return !isPrivate && isPublic;
        });
        
        if (publicLocations.length === 0) {
          setSearchError("No public parks found matching your search.");
        }
        setParkSuggestions(publicLocations);
      }
    } catch (err) {
      console.error("Error searching for parks:", err);
      // Set a user-friendly error message
      if (err.message && err.message.includes('Failed to fetch')) {
        setSearchError("Network issue. Please check your connection and try again.");
      } else {
        setSearchError("Could not fetch park suggestions. Please try again in a moment.");
      }
    } finally {
      setIsSearchingParks(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      address: suggestion.address
    }));
    setParkSuggestions([]);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id, value) => {
    setFormData((prev) => {
      let newState = { ...prev, [id]: value };

      if (id === 'sport') {
        if (value === 'basketball') {
          // Set basketball specific defaults if not already set
          newState.has_hoops = prev.has_hoops === null ? true : prev.has_hoops;
          newState.court_size = prev.court_size === null ? 'full' : prev.court_size;
          // Consider setting a default court_type more appropriate for basketball if switching from another sport's default
          if (prev.sport !== 'basketball' && (prev.court_type === 'clay' || prev.court_type === 'grass')) {
            newState.court_type = 'hard'; // A common default for basketball
          }
        } else {
          // Clear basketball specific fields if changing to another sport
          newState.has_hoops = null;
          newState.court_size = null;
          // If the previous sport was basketball and the court_type was asphalt/concrete,
          // change it to a generic 'hard' for other sports
          if (prev.sport === 'basketball' && (prev.court_type === 'asphalt' || prev.court_type === 'concrete')) {
            newState.court_type = 'hard';
          }
        }
      }
      return newState;
    });
  };

  const handleCheckboxChange = (amenity, checked) => {
    setFormData((prev) => {
      const newAmenities = checked
        ? [...prev.amenities, amenity]
        : prev.amenities.filter((a) => a !== amenity);
      return { ...prev, amenities: newAmenities };
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(""); // Clear previous submission errors

    if (!currentPlayer) {
      setSubmitError("Could not identify player. Please make sure you are logged in.");
      setIsLoading(false);
      return;
    }

    try {
      // Use LLM directly to get coordinates - no separate function needed
      const geocodeSchema = {
        type: "object",
        properties: {
          latitude: { type: "number", description: "Latitude coordinate" },
          longitude: { type: "number", description: "Longitude coordinate" },
          city: { type: "string", description: "City name" },
          state: { type: "string", description: "State or province" },
          timezone: { type: "string", description: "IANA timezone name (e.g., 'America/New_York')" }
        },
        required: ["latitude", "longitude"]
      };

      const locationResult = await InvokeLLM({
        prompt: `Find the precise latitude, longitude, city, state, and timezone for this address: ${formData.address}. Provide accurate coordinates and the IANA timezone name.`,
        add_context_from_internet: true,
        response_json_schema: geocodeSchema
      });

      if (!locationResult || !locationResult.latitude || !locationResult.longitude) {
        throw new Error("Could not find coordinates for the address provided. Please check the address and try again.");
      }

      const { latitude, longitude, timezone } = locationResult;

      // Step 2: Check if a court already exists at this location
      const existingCourts = await Court.list();
      const existingCourt = existingCourts.find(court => 
        calculateDistance(latitude, longitude, court.latitude, court.longitude) < 0.2 // Check within ~0.2 miles
      );
      
      const finalData = { 
        ...formData, 
        latitude, 
        longitude, 
        timezone: timezone || "America/New_York" 
      };
      
      if (finalData.operating_hours_info) {
          finalData.operating_hours = { info: finalData.operating_hours_info };
      }
      delete finalData.operating_hours_info;

      // Clean up fields not relevant to the selected sport before submission
      if (finalData.sport !== 'basketball') {
        delete finalData.has_hoops;
        delete finalData.court_size;
      }

      if (existingCourt) {
        // Step 3a: Update existing court
        await Court.update(existingCourt.id, finalData);
        // Automatically favorite the updated court for the user if it's not already a favorite
        const existingFavorites = await FavoriteCourt.filter({ player_id: currentPlayer.id, court_id: existingCourt.id });
        if (existingFavorites.length === 0) {
            await FavoriteCourt.create({
                player_id: currentPlayer.id,
                court_id: existingCourt.id
            });
        }
        alert(`Successfully updated court information for ${formData.name} and saved it to your favorites!`);
      } else {
        // Step 3b: Create new court
        const newCourt = await Court.create(finalData);
        
        // Automatically favorite the new court
        if (newCourt && newCourt.id) {
            await FavoriteCourt.create({
                player_id: currentPlayer.id,
                court_id: newCourt.id
            });
            alert(`Successfully added and favorited the new court: ${formData.name}!`);
        } else {
            alert(`Successfully added the new court: ${formData.name}!`);
        }
      }
      
      navigate(createPageUrl("Dashboard"));

    } catch (err) {
      console.error("Error adding/updating court:", err);
      // Enhanced error handling for submission process
      if (err.message && err.message.includes('Failed to fetch')) {
        setSubmitError("Network issue. Could not process your request. Please check your connection and try again.");
      } else if (err.message.includes('Could not find coordinates')) {
        setSubmitError(err.message); // Display specific geocoding error
      } else {
        setSubmitError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600" />
              Add or Update a Court
            </CardTitle>
            <CardDescription>
              Help the community by adding new courts or updating information for existing ones. If a court already exists at the address you provide, its details will be updated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 relative">
                <Label htmlFor="name">Court or Park Name</Label>
                <Input 
                  ref={nameInputRef} // Added ref
                  id="name" 
                  value={formData.name} 
                  onChange={handleNameChange} 
                  placeholder="e.g., Central Park Tennis Center" 
                  required 
                  autoComplete="off"
                />
                {isSearchingParks && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
              </div>
              {/* Display Search Error */}
              {searchError && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{searchError}</span>
                </div>
              )}
              {parkSuggestions.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 bg-white shadow-lg border">
                      <CardContent className="p-2">
                          <ul className="space-y-1">
                              {parkSuggestions.map((suggestion, index) => (
                                  <li 
                                      key={index}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                  >
                                      <p className="font-semibold">{suggestion.name}</p>
                                      <p className="text-sm text-gray-500">{suggestion.address}</p>
                                  </li>
                              ))}
                          </ul>
                      </CardContent>
                  </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Input id="address" value={formData.address} onChange={handleInputChange} placeholder="Select a park above or enter address manually" required />
                <p className="text-xs text-gray-500">The address will be used to place the court on the map.</p>
              </div>

              {/* New grid for Sport and Total Courts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport</Label>
                  <Select id="sport" value={formData.sport} onValueChange={value => handleSelectChange('sport', value)}>
                    <SelectTrigger><SelectValue placeholder="Select a sport" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="pickleball">Pickleball</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_courts">Total Number of Courts</Label>
                  <Input id="total_courts" type="number" min="1" value={formData.total_courts} onChange={e => setFormData(prev => ({ ...prev, total_courts: parseInt(e.target.value, 10) }))} required />
                </div>
              </div>

              {/* Existing grid for Court Surface, now potentially a single column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="court_type">Court Surface</Label>
                  <Select id="court_type" value={formData.court_type} onValueChange={value => handleSelectChange('court_type', value)}>
                    <SelectTrigger><SelectValue placeholder="Select court surface" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hard">Hard Court</SelectItem>
                      <SelectItem value="clay">Clay Court</SelectItem>
                      <SelectItem value="grass">Grass Court</SelectItem>
                      <SelectItem value="indoor">Indoor Court</SelectItem>
                      <SelectItem value="outdoor">Outdoor Court</SelectItem>
                      <SelectItem value="asphalt">Asphalt</SelectItem>
                      <SelectItem value="concrete">Concrete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operating_hours_info">Operating Hours</Label>
                  <Input
                    id="operating_hours_info"
                    value={formData.operating_hours_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, operating_hours_info: e.target.value }))}
                    placeholder="e.g., 8am - 10pm or Dawn to Dusk"
                  />
                </div>
              </div>

              {/* Show basketball-specific options when basketball is selected */}
              {formData.sport === 'basketball' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="has_hoops">Has Hoops?</Label>
                    <Select 
                      value={formData.has_hoops === true ? 'yes' : 'no'} 
                      onValueChange={(value) => setFormData(prev => ({...prev, has_hoops: value === 'yes'}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Are hoops available?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes - Hoops Available</SelectItem>
                        <SelectItem value="no">No - No Hoops</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="court_size">Court Size</Label>
                    <Select 
                      value={formData.court_size || 'full'} 
                      onValueChange={(value) => setFormData(prev => ({...prev, court_size: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Court size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Court</SelectItem>
                        <SelectItem value="half">Half Court</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenitiesList.map(amenity => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Checkbox 
                        id={amenity} 
                        onCheckedChange={checked => handleCheckboxChange(amenity, checked)}
                        checked={formData.amenities.includes(amenity)}
                      />
                      <Label htmlFor={amenity} className="font-normal">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display Submission Errors */}
              {submitError && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Processing..." : "Submit Court Information"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
