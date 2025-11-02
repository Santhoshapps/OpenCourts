
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Court, CourtBlock, Municipality } from "@/api/entities";
import { UploadFile, GenerateImage, InvokeLLM } from "@/api/integrations"; // InvokeLLM is used now
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar as CalendarIcon,
  PlusCircle,
  Lock,
  Upload,
  Image as ImageIcon,
  QrCode,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Settings,
  Palette,
  Link as LinkIcon,
  Download,
  Mail,
  Copy,
  Loader2,
  BarChart,
  Users,
  Clock,
  TrendingUp,
  Save,
  Globe,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Building,
  Layers,
  Calendar,
  RefreshCw,
  Info, // Added for BrandingAndPublicPage
  Camera // Added for BrandingAndPublicPage
} from "lucide-react";
import { format } from "date-fns";
import GoogleCalendarSync from "./GoogleCalendarSync";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TownAdminDashboard({ municipalities }) {
  // We use selectedMunicipality to control the active data context
  const [selectedMunicipality, setSelectedMunicipality] = useState(municipalities.length > 0 ? municipalities[0] : null);
  const [activeTab, setActiveTab] = useState('overview'); // New state for main tabs
  const [courts, setCourts] = useState([]); // Used for both display and court selection for GCalSync
  const [courtBlocks, setCourtBlocks] = useState([]); // Used for CourtBlocksManager
  const [selectedCourt, setSelectedCourt] = useState(null); // Used for Google Calendar Sync
  const [isLoadingCourts, setIsLoadingCourts] = useState(false); // Loading state for courts for GCalSync selection
  const [isLoadingMunicipalityData, setIsLoadingMunicipalityData] = useState(true); // General loading for courts/blocks
  const [isAddCourtDialogOpen, setIsAddCourtDialogOpen] = useState(false); // State to control AddCourtDialog

  // Load municipality-specific data whenever the selected municipality or active tab changes
  useEffect(() => {
    if (selectedMunicipality) {
      loadAllMunicipalityData();
    }
  }, [selectedMunicipality, activeTab]);

  // Specific function to load courts for the Google Calendar Sync court selection
  useEffect(() => {
    if (selectedMunicipality) {
      loadMunicipalityCourtsForSync();
    }
  }, [selectedMunicipality]);

  const loadMunicipalityCourtsForSync = async () => {
    if (!selectedMunicipality?.id) return;

    setIsLoadingCourts(true);
    try {
      const municipalityCourts = await Court.filter({
        municipality_id: selectedMunicipality.id
      });
      setCourts(municipalityCourts);
      // Set first court as default selection if nothing is selected or current selection is invalid
      if (municipalityCourts.length > 0 && (!selectedCourt || !municipalityCourts.find(c => c.id === selectedCourt.id))) {
        setSelectedCourt(municipalityCourts[0]);
      } else if (municipalityCourts.length === 0) {
        setSelectedCourt(null);
      }
    } catch (error) {
      console.error("Error loading courts for sync:", error);
    } finally {
      setIsLoadingCourts(false);
    }
  };

  const loadAllMunicipalityData = async () => {
    if (!selectedMunicipality) return;
    setIsLoadingMunicipalityData(true);
    try {
      const [courtsData, blocksData] = await Promise.all([
        Court.filter({ municipality_id: selectedMunicipality.id }),
        CourtBlock.filter({ municipality_id: selectedMunicipality.id })
      ]);
      setCourts(courtsData); // Update courts state
      setCourtBlocks(blocksData);
    } catch (error) {
      console.error("Error loading municipality data:", error);
    } finally {
      setIsLoadingMunicipalityData(false);
    }
  };

  // This function will now be called after a court is successfully created
  const handleCourtAdded = () => {
    console.log("Court successfully added, refreshing court list...");
    loadAllMunicipalityData(); // Re-fetch the courts and blocks from the server
  };

  if (municipalities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No municipalities assigned to your account.</p>
      </div>
    );
  }

  const renderOverview = () => (
    <AnalyticsTabContent municipality={selectedMunicipality} />
  );

  const renderManageCourts = () => (
    <div className="space-y-8">
      {/* Court Management */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Court Management
                </CardTitle>
                <CardDescription>
                    View and manage all courts within {selectedMunicipality?.name}.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={loadAllMunicipalityData} variant="outline" size="sm" disabled={isLoadingMunicipalityData}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingMunicipalityData ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                <AddCourtDialog
                    municipality={selectedMunicipality}
                    onCourtAdded={handleCourtAdded}
                    isOpen={isAddCourtDialogOpen}
                    setIsOpen={setIsAddCourtDialogOpen}
                />
            </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Courts in {selectedMunicipality?.name}</h4>
            {isLoadingMunicipalityData ? (
              <p>Loading courts...</p>
            ) : courts.length > 0 ? (
              <ul className="space-y-2">
                {courts.map(court => (
                  <li key={court.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{court.name} - ({court.total_courts} courts)</span>
                    <Button variant="outline" size="sm">Edit</Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No courts added yet</p>
                <p className="text-sm mb-4">Add your first court to get started with court management.</p>
                 <AddCourtDialog
                    municipality={selectedMunicipality}
                    onCourtAdded={handleCourtAdded}
                    isOpen={isAddCourtDialogOpen}
                    setIsOpen={setIsAddCourtDialogOpen}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync court reservations and events from a Google Calendar to block off courts automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Court for Sync
            </label>
            <Select
              value={selectedCourt?.id || ''}
              onValueChange={(courtId) => {
                const court = courts.find(c => c.id === courtId);
                setSelectedCourt(court);
              }}
              disabled={isLoadingCourts || courts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={courts.length > 0 ? "Select a court..." : "No courts available"} />
              </SelectTrigger>
              <SelectContent>
                {courts.map(court => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {courts.length === 0 && !isLoadingCourts && (
              <p className="text-xs text-gray-500 mt-1">
                You must add at least one court to this municipality before you can sync a calendar.
              </p>
            )}
          </div>

          {selectedCourt && selectedMunicipality ? (
            <GoogleCalendarSync
              court={selectedCourt}
              municipalityId={selectedMunicipality.id}
            />
          ) : (
            <div className="p-4 text-center bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Please select a court to manage its calendar sync settings.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Court Blocks Manager */}
      <CourtBlocksManager
        courts={courts}
        courtBlocks={courtBlocks}
        municipalityId={selectedMunicipality.id}
        onUpdate={loadAllMunicipalityData}
      />
    </div>
  );

  const renderSettingsAndBranding = () => (
    <BrandingAndPublicPage
      municipality={selectedMunicipality}
      onMunicipalityUpdate={setSelectedMunicipality} // Pass setSelectedMunicipality to update parent state
    />
  );

  return (
    <div className="space-y-8">
      {/* Municipality Selector */}
      {municipalities.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Municipality
              </label>
              <Select
                value={selectedMunicipality?.id || ''}
                onValueChange={(value) => {
                  const municipality = municipalities.find(m => m.id === value);
                  setSelectedMunicipality(municipality);
                  setSelectedCourt(null); // Reset selected court when municipality changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a municipality" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality.id} value={municipality.id}>
                      {municipality.name} ({municipality.city}, {municipality.state})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMunicipality ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart className="w-4 h-4 mr-2"/> Overview
            </TabsTrigger>
            <TabsTrigger value="manage_courts">
              <Layers className="w-4 h-4 mr-2"/> Manage Courts
            </TabsTrigger>
            <TabsTrigger value="settings_branding">
              <Settings className="w-4 h-4 mr-2"/> Settings & Branding
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            {renderOverview()}
          </TabsContent>
          <TabsContent value="manage_courts" className="mt-6">
            {renderManageCourts()}
          </TabsContent>
          <TabsContent value="settings_branding" className="mt-6">
            {renderSettingsAndBranding()}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p>No municipality selected or assigned.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// New component for the Analytics Tab with filtering
function AnalyticsTabContent({ municipality }) {
  const [selectedCourt, setSelectedCourt] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [courts, setCourts] = useState([]);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);

  useEffect(() => {
    loadCourts();
  }, [municipality.id]);

  const loadCourts = async () => {
    setIsLoadingCourts(true);
    try {
      const courtsData = await Court.filter({ municipality_id: municipality.id });
      setCourts(courtsData);
    } catch (error) {
      console.error("Error loading courts for analytics:", error);
    } finally {
      setIsLoadingCourts(false);
    }
  };

  const timeframeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last 12 Months' }
  ];

  const buildAnalyticsUrl = () => {
    const params = new URLSearchParams({
      municipality_id: municipality.id,
      court_id: selectedCourt,
      timeframe: selectedTimeframe
    });
    return createPageUrl(`TownAnalytics?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-emerald-600" />
          Park Analytics Dashboard
        </CardTitle>
        <CardDescription>
          Analyze court utilization, peak hours, player check-ins, and activity trends for {municipality.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="court-filter">Filter by Court</Label>
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger id="court-filter">
                <SelectValue placeholder="Select court..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courts.map(court => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe-filter">Time Period</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger id="timeframe-filter">
                <SelectValue placeholder="Select timeframe..." />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analytics Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">Total Check-ins</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {selectedTimeframe === '7d' ? '127' :
                     selectedTimeframe === '30d' ? '543' :
                     selectedTimeframe === '3m' ? '1,621' :
                     selectedTimeframe === '6m' ? '3,247' : '6,892'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Peak Hours</p>
                  <p className="text-lg font-bold text-blue-900">6-8 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Avg. Utilization</p>
                  <p className="text-lg font-bold text-purple-900">
                    {selectedCourt === 'all' ? '67%' : '74%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current View:</span> {' '}
            {selectedCourt === 'all' ? 'All Courts' : courts.find(c => c.id === selectedCourt)?.name || 'Selected Court'} • {' '}
            {timeframeOptions.find(t => t.value === selectedTimeframe)?.label}
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link to={buildAnalyticsUrl()}>
            <Button className="w-full md:w-auto" size="lg">
              <BarChart className="w-4 h-4 mr-2" />
              View Detailed Analytics Report
            </Button>
          </Link>
          <p className="text-xs text-gray-500 mt-3">
            Get comprehensive charts, trends, and insights to optimize your park operations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Updated AddCourtDialog Component using AI-powered search like AddCourt page
function AddCourtDialog({ municipality, onCourtAdded, isOpen, setIsOpen }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    sport: 'tennis',
    total_courts: 1,
    court_type: 'hard',
    is_public: true,
    amenities: [],
    operating_hours_info: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [parkSuggestions, setParkSuggestions] = useState([]);
  const [isSearchingParks, setIsSearchingParks] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      sport: 'tennis',
      total_courts: 1,
      court_type: 'hard',
      is_public: true,
      amenities: [],
      operating_hours_info: ''
    });
    setFormError(null);
    setParkSuggestions([]);
    setIsSearchingParks(false);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
  };

  const handleNameChange = (e) => {
    const query = e.target.value;
    setFormData(prev => ({ ...prev, name: query, address: query === "" ? "" : prev.address }));

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

      const municipalityContext = municipality ? ` in ${municipality.name}, ${municipality.city}, ${municipality.state}` : '';

      const result = await InvokeLLM({
        prompt: `Find ONLY public parks, recreation centers, and municipal facilities that match the name "${query}"${municipalityContext} and have or could have ${formData.sport} courts. 

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
        
        setParkSuggestions(publicLocations);
      }
    } catch (err) {
      console.error("Error searching for public parks:", err);
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findSimilarCourt = (courts, newCourtData) => {
    return courts.find(court => {
      // Primary factor: Address matching
      const normalizeAddress = (addr) => addr.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
      const newAddressNorm = normalizeAddress(newCourtData.address);
      const existingAddressNorm = normalizeAddress(court.address);
      
      if (newAddressNorm === existingAddressNorm) {
        return true;
      }
      
      // Secondary factor: Geographic proximity (within 0.1 miles)
      if (newCourtData.latitude && newCourtData.longitude && court.latitude && court.longitude) {
        const distance = calculateDistance(
          court.latitude,
          court.longitude,
          newCourtData.latitude,
          newCourtData.longitude
        );
        if (distance < 0.1) {
          return true;
        }
      }
      
      return false;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!municipality) {
      setFormError("No municipality selected.");
      return;
    }

    if (!formData.name.trim()) {
      setFormError("Court name is required.");
      return;
    }

    if (!formData.address.trim()) {
      setFormError("Address is required.");
      return;
    }

    if (!formData.total_courts || formData.total_courts < 1) {
      setFormError("Number of courts must be at least 1.");
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log("Getting coordinates for address:", formData.address);
      
      // Use LLM directly to get coordinates (same as AddCourt page)
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

      // Prepare court data with all required fields
      const courtData = {
        name: formData.name.trim(),
        address: formData.address.trim(), // Use the input address for consistency
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        sport: formData.sport,
        total_courts: parseInt(formData.total_courts),
        court_type: formData.court_type,
        is_public: Boolean(formData.is_public),
        municipality_id: municipality.id,
        amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
        timezone: timezone || 'America/New_York'
      };

      // Add operating hours if provided
      if (formData.operating_hours_info) {
        courtData.operating_hours = { info: formData.operating_hours_info };
      }

      console.log("Prepared court data:", courtData);

      // Check for existing similar courts using address as primary factor
      console.log("Checking for duplicate courts...");
      const allCourts = await Court.list();
      const similarCourt = findSimilarCourt(allCourts, courtData);

      if (similarCourt) {
        const shouldMerge = window.confirm(
          `A court at a similar address already exists:\n\n` +
          `Existing: "${similarCourt.name}"\n` +
          `Address: ${similarCourt.address}\n\n` +
          `Your new court: "${courtData.name}"\n` +
          `Address: ${courtData.address}\n\n` +
          `Would you like to update the existing court with your information and assign it to ${municipality.name}?`
        );

        if (shouldMerge) {
          console.log("Updating existing court:", similarCourt.id);
          
          // Update the existing court with town admin's data
          const updateData = { ...courtData };
          const updatedCourt = await Court.update(similarCourt.id, updateData);
          console.log("Court successfully merged:", updatedCourt);
          
          alert(
            `Success! The existing court has been updated:\n\n` +
            `"${courtData.name}" is now managed by ${municipality.name}`
          );
          
          // Call the callback to refresh the court list
          if (onCourtAdded) {
            onCourtAdded();
          }
          
          setIsOpen(false);
          resetForm();
          return;
        } else {
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new court
        console.log("Creating new court with data:", courtData);
        const newCourt = await Court.create(courtData);
        console.log("New court created:", newCourt);
        
        alert(`Success! New court "${courtData.name}" has been added to ${municipality.name}.`);
        
        // Call the callback to refresh the court list
        if (onCourtAdded) {
          onCourtAdded();
        }
      }

      setIsOpen(false);
      resetForm();

    } catch (error) {
      console.error("Error creating/updating court:", error);
      setFormError(error.message || "Failed to add court. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const amenitiesList = ["Parking", "Restrooms", "Lights", "Water Fountain", "Backboard"];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Court
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Court to {municipality?.name}</DialogTitle>
          <DialogDescription>
            As a Town Administrator, your entries will be the authoritative source for court information.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Enhanced Name Input with AI Park Search */}
          <div className="space-y-2 relative">
            <Label htmlFor="name">Court/Park Name *</Label>
            <div className="relative">
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Central Park Tennis Courts"
                required
                autoComplete="off"
              />
              {isSearchingParks && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            {/* Park Suggestions Dropdown */}
            {parkSuggestions.length > 0 && (
              <Card className="absolute z-50 w-full mt-1 bg-white shadow-lg border">
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
                        {suggestion.facility_type && (
                          <p className="text-xs text-blue-600">{suggestion.facility_type}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Select a park above or enter address manually"
              required
            />
            <p className="text-xs text-gray-500">
              The address will be used to place the court on the map.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sport">Sport *</Label>
              <Select value={formData.sport} onValueChange={(value) => setFormData({...formData, sport: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="pickleball">Pickleball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_courts">Number of Courts *</Label>
              <Input
                id="total_courts"
                type="number"
                min="1"
                max="50"
                value={formData.total_courts}
                onChange={(e) => setFormData({...formData, total_courts: parseInt(e.target.value) || 1})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="court_type">Surface Type *</Label>
              <Select value={formData.court_type} onValueChange={(value) => setFormData({...formData, court_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hard">Hard Court</SelectItem>
                  <SelectItem value="clay">Clay Court</SelectItem>
                  <SelectItem value="grass">Grass Court</SelectItem>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operating_hours">Operating Hours</Label>
              <Input
                id="operating_hours"
                value={formData.operating_hours_info}
                onChange={(e) => setFormData({...formData, operating_hours_info: e.target.value})}
                placeholder="e.g., Dawn to Dusk, 6 AM - 10 PM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
              />
              <Label htmlFor="is_public" className="text-sm">Public Access</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2">
              {amenitiesList.map(amenity => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityChange(amenity)}
                  />
                  <Label htmlFor={amenity} className="text-sm capitalize">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding Court...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Court
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Court Card Component (Simplified)
function CourtCard({ court, onUpdate }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{court.name}</h3>
            <p className="text-sm text-gray-600">{court.address}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline">{court.sport}</Badge>
              <Badge variant="outline">{court.total_courts} courts</Badge>
              <Badge variant="outline">{court.court_type}</Badge>
              {court.amenities && court.amenities.map(amenity => (
                <Badge key={amenity} variant="secondary">{amenity}</Badge>
              ))}
              {court.operating_hours?.info && (
                <Badge variant="secondary">{court.operating_hours.info}</Badge>
              )}
            </div>
          </div>
          {/* Action buttons like Edit/Delete could go here in the future */}
        </div>
      </CardContent>
    </Card>
  );
}

// Court Blocking Form Component (Enhanced with Court Number Selection)
function CourtBlockingForm({ courts, municipalityId, onBlockSuccess }) {
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedCourtNumbers, setSelectedCourtNumbers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    reason: 'lesson',
    start_time: '',
    end_time: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedCourt = courts.find(c => c.id === selectedCourtId);

  const handleCourtChange = (courtId) => {
    setSelectedCourtId(courtId);
    setSelectedCourtNumbers([]); // Reset court number selections when court changes
  };

  const handleCourtNumberToggle = (courtNumber) => {
    setSelectedCourtNumbers(prev => {
      if (prev.includes(courtNumber)) {
        return prev.filter(num => num !== courtNumber);
      } else {
        return [...prev, courtNumber];
      }
    });
  };

  const handleSelectAllCourts = () => {
    if (!selectedCourt) return;

    if (selectedCourtNumbers.length === selectedCourt.total_courts) {
      setSelectedCourtNumbers([]); // Deselect all if all are selected
    } else {
      const allNumbers = Array.from({ length: selectedCourt.total_courts }, (_, i) => i + 1);
      setSelectedCourtNumbers(allNumbers);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourtId || selectedCourtNumbers.length === 0 || !formData.title || !formData.start_time || !formData.end_time) {
      setFormError('Please fill in all required fields and select at least one court number.');
      return;
    }

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      setFormError('End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      // Create a separate block for each selected court number
      const blockPromises = selectedCourtNumbers.map(courtNumber =>
        CourtBlock.create({
          court_id: selectedCourtId,
          municipality_id: municipalityId,
          court_number: courtNumber, // Add court number to the block
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          title: formData.title,
          reason: formData.reason,
          notes: formData.notes
        })
      );

      await Promise.all(blockPromises);

      onBlockSuccess();
    } catch (error) {
      console.error('Error creating court blocks:', error);
      setFormError('Failed to create court blocks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Schedule Court Block/Reservation</DialogTitle>
        <DialogDescription>
          Block specific courts for lessons, tournaments, maintenance, or other events.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="court">Select Court Location</Label>
            <Select value={selectedCourtId} onValueChange={handleCourtChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a court..." />
              </SelectTrigger>
              <SelectContent>
                {courts.map(court => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name} ({court.total_courts} courts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Event Type</Label>
            <Select value={formData.reason} onValueChange={value => setFormData(prev => ({...prev, reason: value}))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">Tennis/Pickleball Lesson</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="league">League Play</SelectItem>
                <SelectItem value="event">Community Event</SelectItem>
                <SelectItem value="renovation">Maintenance/Renovation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCourt && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Select Court Numbers to Block</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllCourts}
              >
                {selectedCourtNumbers.length === selectedCourt.total_courts ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: selectedCourt.total_courts }, (_, i) => i + 1).map(courtNumber => (
                <Button
                  key={courtNumber}
                  type="button"
                  variant={selectedCourtNumbers.includes(courtNumber) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCourtNumberToggle(courtNumber)}
                  className={selectedCourtNumbers.includes(courtNumber) ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  Court {courtNumber}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedCourtNumbers.length} of {selectedCourt.total_courts} courts selected
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
            placeholder="e.g., Junior Tennis Lesson, USTA Tournament"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={formData.start_time}
              onChange={e => setFormData(prev => ({...prev, start_time: e.target.value}))}
            />
          </div>

          <div>
            <Label htmlFor="end_time">End Time</Label>
            <Input
              id="end_time"
              type="datetime-local"
              value={formData.end_time}
              onChange={e => setFormData(prev => ({...prev, end_time: e.target.value}))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Internal Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))}
            placeholder="Additional notes for internal reference..."
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedCourtId || selectedCourtNumbers.length === 0}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Schedule Block
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// Court Blocks Manager Component (Enhanced to show court numbers)
function CourtBlocksManager({ courts, courtBlocks, municipalityId, onUpdate }) {
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const activeBlocks = courtBlocks.filter(block => new Date(block.end_time) > new Date());
  const pastBlocks = courtBlocks.filter(block => new Date(block.end_time) <= new Date());

  // Group blocks by court and time for better display
  const groupedActiveBlocks = activeBlocks.reduce((acc, block) => {
    // A unique key for a group of blocks that share court, time, and title
    const key = `${block.court_id}_${block.start_time}_${block.end_time}_${block.title}`;
    if (!acc[key]) {
      acc[key] = {
        ...block,
        court_numbers: [block.court_number],
        block_ids: [block.id]
      };
    } else {
      acc[key].court_numbers.push(block.court_number);
      acc[key].block_ids.push(block.id);
    }
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Court Reservations & Blocks</CardTitle>
            <CardDescription>Block specific courts for lessons, tournaments, maintenance, etc.</CardDescription>
          </div>
          <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Schedule New Block
              </Button>
            </DialogTrigger>
            <CourtBlockingForm
              courts={courts}
              municipalityId={municipalityId}
              onBlockSuccess={() => {
                setShowBlockDialog(false);
                onUpdate();
              }}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Active & Upcoming Blocks</h3>
          {Object.keys(groupedActiveBlocks).length === 0 ? (
            <p className="text-gray-500">No active court blocks.</p>
          ) : (
            <div className="space-y-3">
              {Object.values(groupedActiveBlocks).map(block => {
                const court = courts.find(c => c.id === block.court_id);
                const sortedCourtNumbers = block.court_numbers.sort((a, b) => a - b);
                return (
                  <Card key={`${block.court_id}_${block.start_time}_${block.title}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{block.title}</h4>
                          <p className="text-sm text-gray-600">{court?.name || 'Unknown Court'}</p>
                          <p className="text-sm">
                            {format(new Date(block.start_time), 'MMM d, h:mm a')} - {format(new Date(block.end_time), 'h:mm a')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">{block.reason}</Badge>
                            <Badge variant="secondary">
                              Court{sortedCourtNumbers.length > 1 ? 's' : ''} {sortedCourtNumbers.join(', ')}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Delete all blocks in this group
                            if (confirm(`Delete this block for ${sortedCourtNumbers.length} court(s)?`)) {
                              Promise.all(block.block_ids.map(id => CourtBlock.delete(id)))
                                .then(() => onUpdate())
                                .catch(err => {
                                  console.error('Error deleting blocks:', err);
                                  alert('Failed to delete some blocks.');
                                });
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {pastBlocks.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Past Blocks (Last 10)</h3>
            <div className="space-y-2">
              {pastBlocks.slice(-10).reverse().map(block => {
                const court = courts.find(c => c.id === block.court_id);
                return (
                  <div key={block.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-700">{block.title}</p>
                      <p className="text-sm text-gray-500">
                        {court?.name} - Court {block.court_number} - {format(new Date(block.start_time), 'MMM d')}
                      </p>
                    </div>
                    <Badge variant="outline" className="opacity-60 capitalize">{block.reason}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Updated BrandingAndPublicPage Component
function BrandingAndPublicPage({ municipality, onMunicipalityUpdate }) {
  const [isMounted, setIsMounted] = useState(false);
  const [origin, setOrigin] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [logoBroken, setLogoBroken] = useState(false);
  const [coverBroken, setCoverBroken] = useState(false);
  const [qrBroken, setQrBroken] = useState(false);

  const [formData, setFormData] = useState({
    name: municipality?.name || '',
    city: municipality?.city || '',
    state: municipality?.state || '',
    description: municipality?.description || '',
    unique_slug: municipality?.unique_slug || '',
    logo_url: municipality?.logo_url || '',
    cover_image_url: municipality?.cover_image_url || ''
  });

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Update form data when municipality changes
  useEffect(() => {
    if (municipality) {
      setFormData({
        name: municipality.name || '',
        city: municipality.city || '',
        state: municipality.state || '',
        description: municipality.description || '',
        unique_slug: municipality.unique_slug || '',
        logo_url: municipality.logo_url || '',
        cover_image_url: municipality.cover_image_url || ''
      });
      // Reset image error states when municipality changes
      setLogoBroken(false);
      setCoverBroken(false);
      setQrBroken(false);
    }
  }, [municipality]);

  // Safe async handler wrapper
  async function safeCall(fn, friendlyMessage) {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      return await fn();
    } catch (err) {
      console.error(err);
      setErrorMsg(friendlyMessage + (err.message ? `: ${err.message}` : ""));
      return null;
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLogoUploadSafe = (e) =>
    safeCall(
      async () => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          throw new Error('Please select an image file.');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Logo file must be smaller than 5MB.");
        }

        setIsUploadingLogo(true);
        const { UploadFile } = await import("@/api/integrations");
        const result = await UploadFile({ file });
        
        if (result?.file_url) {
          setFormData(prev => ({ ...prev, logo_url: result.file_url }));
          setLogoBroken(false);
          setSuccessMsg("Logo uploaded successfully!");
        } else {
          throw new Error("Upload response was incomplete.");
        }
      },
      "Logo upload failed."
    ).finally(() => {
      setIsUploadingLogo(false);
      e.target.value = ''; // Clear file input
    });

  const handleCoverUploadSafe = (e) =>
    safeCall(
      async () => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          throw new Error('Please select an image file.');
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Cover image must be smaller than 10MB.");
        }

        setIsUploadingCover(true);
        const { UploadFile } = await import("@/api/integrations");
        const result = await UploadFile({ file });
        
        if (result?.file_url) {
          setFormData(prev => ({ ...prev, cover_image_url: result.file_url }));
          setCoverBroken(false);
          setSuccessMsg("Cover image uploaded successfully!");
        } else {
          throw new Error("Upload response was incomplete.");
        }
      },
      "Cover image upload failed."
    ).finally(() => {
      setIsUploadingCover(false);
      e.target.value = ''; // Clear file input
    });

  const onSaveAll = () =>
    safeCall(
      async () => {
        if (!municipality) throw new Error("No municipality selected");
        
        setIsSaving(true);
        const updatedMunicipality = await Municipality.update(municipality.id, formData);
        
        // Update parent component
        if (onMunicipalityUpdate) {
          onMunicipalityUpdate(updatedMunicipality); // Pass the fully updated object from the backend
        }
        
        setSuccessMsg("All changes saved successfully!");
      },
      "Couldn't save changes."
    ).finally(() => setIsSaving(false));

  // Generate URL slug from city and state
  const generateSlug = () => {
    if (!formData.city || !formData.state) {
      setErrorMsg("Please enter city and state first");
      return;
    }
    
    const slug = `${formData.city.toLowerCase().replace(/\s+/g, '-')}-${formData.state.toLowerCase().replace(/\s+/g, '-')}`;
    handleInputChange('unique_slug', slug);
  };

  // Don't render until mounted (prevents SSR issues)
  if (!isMounted) {
    return <div className="p-4 text-sm text-gray-500">Loading branding settings...</div>;
  }

  // Guard against missing municipality
  if (!municipality) {
    return <div className="p-4 text-sm text-gray-500">No municipality selected.</div>;
  }

  const publicUrl = formData.unique_slug && origin
    ? `${origin}/town/${formData.unique_slug}`
    : "";

  const isBusy = isUploadingLogo || isUploadingCover || isSaving;

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
      
      {successMsg && (
        <Alert className="bg-green-50 border border-green-200">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          <AlertDescription className="text-green-600">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Update your municipality's basic information and display name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="municipality-name">Municipality Name</Label>
              <Input
                id="municipality-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Town of Apex"
                disabled={isBusy}
              />
            </div>
            <div>
              <Label htmlFor="municipality-city">City</Label>
              <Input
                id="municipality-city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="e.g., Apex"
                disabled={isBusy}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="municipality-state">State/Province</Label>
            <Input
              id="municipality-state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="e.g., North Carolina"
              disabled={isBusy}
            />
          </div>

          <div>
            <Label htmlFor="municipality-description">Description</Label>
            <Textarea
              id="municipality-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="A brief welcome message for your public page..."
              disabled={isBusy}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo & Cover Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Visual Branding
          </CardTitle>
          <CardDescription>
            Upload your municipality's logo and cover image for the public page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div>
              <Label className="text-sm font-medium">Municipality Logo</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="h-32 flex items-center justify-center">
                  {formData.logo_url && !logoBroken ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo Preview"
                      className="h-full w-full object-contain rounded-lg p-2"
                      onError={() => setLogoBroken(true)}
                    />
                  ) : (
                    <span className="text-xs text-gray-500 text-center">No Logo Uploaded</span>
                  )}
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUploadSafe}
                  className="hidden"
                  disabled={isBusy}
                />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={isUploadingLogo || isBusy}
                  className="w-full mt-2"
                >
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    {isUploadingLogo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Choose Logo'
                    )}
                  </label>
                </Button>
                {formData.logo_url && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('logo_url', null)}
                        className="w-full mt-2"
                        disabled={isBusy}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Logo
                    </Button>
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div>
              <Label className="text-sm font-medium">Cover Image</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="h-32 flex items-center justify-center">
                  {formData.cover_image_url && !coverBroken ? (
                    <img
                      src={formData.cover_image_url}
                      alt="Cover Preview"
                      className="h-full w-full object-cover rounded-lg"
                      onError={() => setCoverBroken(true)}
                    />
                  ) : (
                    <span className="text-xs text-gray-500 text-center">No Cover Image Uploaded</span>
                  )}
                </div>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUploadSafe}
                  className="hidden"
                  disabled={isBusy}
                />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={isUploadingCover || isBusy}
                  className="w-full mt-2"
                >
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    {isUploadingCover ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Choose Cover'
                    )}
                  </label>
                </Button>
                {formData.cover_image_url && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('cover_image_url', null)}
                        className="w-full mt-2"
                        disabled={isBusy}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Cover
                    </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public Page Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Public Page Settings
          </CardTitle>
          <CardDescription>
            Configure your public-facing page that residents can visit to see court information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="unique-slug">URL Slug</Label>
            <div className="flex gap-2">
              <Input
                id="unique-slug"
                value={formData.unique_slug}
                onChange={(e) => handleInputChange('unique_slug', e.target.value)}
                placeholder="e.g., apex-north-carolina"
                disabled={isBusy}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSlug}
                disabled={isBusy}
              >
                Auto-Generate
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This creates your public URL: {origin}/town/{formData.unique_slug || '[slug]'}
            </p>
          </div>

          {/* Public URL Preview & QR Code */}
          {publicUrl ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Your Public Page</Label>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border mt-2">
                    <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <code className="text-sm font-mono flex-1 truncate">{publicUrl}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                      disabled={isBusy}
                    >
                      Visit Page
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <Label className="text-sm font-medium block mb-2">QR Code</Label>
                  {origin && !qrBroken ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicUrl)}`}
                      alt="Public Page QR Code"
                      className="w-32 h-32 border rounded-md"
                      onError={() => setQrBroken(true)}
                    />
                  ) : (
                    <div className="w-32 h-32 border rounded-md grid place-items-center text-xs text-gray-500">
                      QR unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
              Save a URL slug to activate your public page and generate a QR code.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSaveAll}
          disabled={isBusy}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
