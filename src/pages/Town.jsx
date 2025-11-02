import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Municipality, Court, CourtBlock } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Navigation,
  Users,
  Layers,
  Info,
  Camera,
  Phone,
  Globe,
  Star,
  Car,
  Droplets,
  Lightbulb,
  Home,
  AlertTriangle,
  ExternalLink,
  Smartphone
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info);
  }

  render() {
    return this.state.hasError 
      ? (this.props.fallback ?? <div className="p-4 text-red-600">Something went wrong with this page.</div>)
      : this.props.children;
  }
}

export default function Town() {
  const { slug } = useParams();
  
  // Client-side mounting guard
  const [isMounted, setIsMounted] = useState(false);
  const [origin, setOrigin] = useState("");
  
  // Component state
  const [municipality, setMunicipality] = useState(null);
  const [courts, setCourts] = useState([]);
  const [courtBlocks, setCourtBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourts, setExpandedCourts] = useState(new Set());
  const [selectedSport, setSelectedSport] = useState('all');
  
  // Image fallback states
  const [logoBroken, setLogoBroken] = useState(false);
  const [coverBroken, setCoverBroken] = useState(false);

  // Preview mode - show sample data for Apex NC
  const [isPreviewMode] = useState(slug === 'apex-nc-township' || slug === 'preview');

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (isPreviewMode) {
      loadPreviewData();
    } else if (slug) {
      loadTownData();
    }
  }, [slug, isMounted, isPreviewMode]);

  const loadPreviewData = () => {
    setIsLoading(true);
    
    // Sample municipality data for Apex NC
    const sampleMunicipality = {
      id: "preview-apex",
      name: "Town of Apex",
      city: "Apex",
      state: "North Carolina",
      unique_slug: "apex-nc-township",
      description: "Welcome to Apex, North Carolina - where residents enjoy world-class recreational facilities including premier tennis and pickleball courts. Our community is committed to providing exceptional outdoor recreation opportunities for all skill levels.",
      logo_url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center",
      cover_image_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop&crop=center"
    };

    // Sample courts data
    const sampleCourts = [
      {
        id: "court-1",
        name: "Apex Community Park Tennis Courts",
        address: "851 Laura Duncan Rd, Apex, NC 27502",
        latitude: 35.7321,
        longitude: -78.8503,
        sport: "tennis",
        total_courts: 8,
        court_type: "hard",
        is_public: true,
        amenities: ["parking", "restrooms", "lighting", "water_fountains"],
        operating_hours: { info: "Dawn to Dusk, Courts 1-4 have lights until 10 PM" },
        municipality_id: "preview-apex"
      },
      {
        id: "court-2", 
        name: "Beaver Creek Commons",
        address: "3201 Beaver Creek Commons Dr, Apex, NC 27523",
        latitude: 35.7156,
        longitude: -78.8234,
        sport: "tennis",
        total_courts: 4,
        court_type: "hard",
        is_public: true,
        amenities: ["parking", "restrooms"],
        operating_hours: { info: "6 AM - 10 PM Daily" },
        municipality_id: "preview-apex"
      },
      {
        id: "court-3",
        name: "Apex Nature Park Pickleball Courts", 
        address: "2600 Evans Rd, Apex, NC 27502",
        latitude: 35.7089,
        longitude: -78.8167,
        sport: "pickleball",
        total_courts: 6,
        court_type: "hard",
        is_public: true,
        amenities: ["parking", "restrooms", "shade"],
        operating_hours: { info: "Sunrise to Sunset" },
        municipality_id: "preview-apex"
      },
      {
        id: "court-4",
        name: "Salem Street Park Courts",
        address: "1000 Salem St, Apex, NC 27502", 
        latitude: 35.7298,
        longitude: -78.8567,
        sport: "tennis",
        total_courts: 2,
        court_type: "hard",
        is_public: true,
        amenities: ["parking"],
        operating_hours: { info: "Dawn to Dusk" },
        municipality_id: "preview-apex"
      }
    ];

    // Sample scheduled events
    const sampleBlocks = [
      {
        id: "block-1",
        court_id: "court-1",
        municipality_id: "preview-apex",
        court_number: 1,
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        title: "Youth Tennis Lessons",
        reason: "lesson",
        status: "active"
      },
      {
        id: "block-2",
        court_id: "court-1", 
        municipality_id: "preview-apex",
        court_number: 2,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        title: "Adult Tennis League",
        reason: "league",
        status: "active"
      },
      {
        id: "block-3",
        court_id: "court-3",
        municipality_id: "preview-apex", 
        court_number: 1,
        start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        title: "Pickleball Tournament",
        reason: "tournament", 
        status: "active"
      }
    ];

    setTimeout(() => {
      setMunicipality(sampleMunicipality);
      setCourts(sampleCourts);
      setCourtBlocks(sampleBlocks);
      setIsLoading(false);
    }, 500);
  };

  const loadTownData = async () => {
    if (!slug) {
      setError("No town identifier found in URL");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading town data for:", slug);
      
      const municipalities = await Municipality.filter({ unique_slug: slug });
      
      if (municipalities.length === 0) {
        throw new Error("Town not found. Please check the URL and try again.");
      }

      const townData = municipalities[0];
      setMunicipality(townData);

      // Load courts and blocks in parallel
      const [townCourts, blocks] = await Promise.all([
        Court.filter({ municipality_id: townData.id }),
        CourtBlock.filter({ municipality_id: townData.id })
      ]);
      
      setCourts(townCourts || []);
      setCourtBlocks(blocks || []);

    } catch (err) {
      console.error("Error loading town data:", err);
      setError(err?.message || "Failed to load town information. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourtExpansion = (courtId) => {
    if (!courtId) return;
    const newExpanded = new Set(expandedCourts);
    if (newExpanded.has(courtId)) {
      newExpanded.delete(courtId);
    } else {
      newExpanded.add(courtId);
    }
    setExpandedCourts(newExpanded);
  };

  const getCourtSchedule = (courtId) => {
    if (!courtId || !courtBlocks) return [];
    
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return courtBlocks
      .filter(block => 
        block.court_id === courtId && 
        new Date(block.start_time) >= now &&
        new Date(block.start_time) <= next7Days &&
        block.status === 'active'
      )
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  };

  const formatScheduleDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return "Today";
      if (isTomorrow(date)) return "Tomorrow";
      return format(date, "MMM d");
    } catch {
      return "";
    }
  };

  const getAmenityIcon = (amenity) => {
    if (!amenity) return <Star className="w-4 h-4" />;
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('parking')) return <Car className="w-4 h-4" />;
    if (amenityLower.includes('restroom') || amenityLower.includes('bathroom')) return <Home className="w-4 h-4" />;
    if (amenityLower.includes('light')) return <Lightbulb className="w-4 h-4" />;
    if (amenityLower.includes('water') || amenityLower.includes('fountain')) return <Droplets className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  const filteredCourts = courts.filter(court => {
    if (selectedSport === 'all') return true;
    return court.sport === selectedSport;
  });

  // Don't render until mounted (prevents SSR issues)
  if (!isMounted) {
    return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading town information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-4">Unable to Load Town Information</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!municipality) {
    return (
      <div className="min-h-screen bg-yellow-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Info className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-yellow-800">Town Not Found</h1>
          <p className="text-yellow-600">The requested town could not be found.</p>
        </div>
      </div>
    );
  }

  const publicUrl = origin && municipality.unique_slug 
    ? `${origin}/town/${municipality.unique_slug}`
    : "";

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section with Cover Image */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white overflow-hidden">
          {municipality.cover_image_url && !coverBroken && (
            <div className="absolute inset-0">
              <img 
                src={municipality.cover_image_url}
                alt={`${municipality.name} Cover`}
                className="w-full h-full object-cover opacity-30"
                onError={() => setCoverBroken(true)}
              />
            </div>
          )}
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Logo */}
              {municipality.logo_url && !logoBroken && (
                <div className="w-20 h-20 bg-white/90 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <img 
                    src={municipality.logo_url} 
                    alt={`${municipality.name} Logo`}
                    className="max-w-full max-h-full object-contain p-2"
                    onError={() => setLogoBroken(true)}
                  />
                </div>
              )}
              
              {/* Title and Description */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{municipality.name}</h1>
                <p className="text-xl text-emerald-100 mb-4">{municipality.city}, {municipality.state}</p>
                {municipality.description && (
                  <p className="text-lg text-white/90 max-w-3xl leading-relaxed">
                    {municipality.description}
                  </p>
                )}
              </div>
              
              {/* CTA Button */}
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-lg"
                  onClick={() => window.open(`${origin}?utm_source=town_page&utm_medium=cta&utm_campaign=${municipality.unique_slug}`, '_blank')}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Get the OpenCourts App
                </Button>
                <p className="text-sm text-center text-emerald-100">
                  Find players • Reserve courts • Join tournaments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Preview Banner */}
          {isPreviewMode && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Preview Mode</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                This is a preview of how the Apex NC Township public page would appear to residents and visitors.
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Layers className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">{courts.length}</h3>
                <p className="text-gray-600">Court Facilities</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">{courts.reduce((sum, court) => sum + court.total_courts, 0)}</h3>
                <p className="text-gray-600">Total Courts</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">{courtBlocks.length}</h3>
                <p className="text-gray-600">Scheduled Events</p>
              </CardContent>
            </Card>
          </div>

          {/* Sport Filter */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              variant={selectedSport === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedSport('all')}
              className={selectedSport === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              All Sports ({courts.length})
            </Button>
            <Button
              variant={selectedSport === 'tennis' ? 'default' : 'outline'}
              onClick={() => setSelectedSport('tennis')}
              className={selectedSport === 'tennis' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Tennis ({courts.filter(c => c.sport === 'tennis').length})
            </Button>
            <Button
              variant={selectedSport === 'pickleball' ? 'default' : 'outline'}
              onClick={() => setSelectedSport('pickleball')}
              className={selectedSport === 'pickleball' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Pickleball ({courts.filter(c => c.sport === 'pickleball').length})
            </Button>
          </div>

          {/* Courts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourts.map((court) => {
              const schedule = getCourtSchedule(court.id);
              const isExpanded = expandedCourts.has(court.id);
              
              return (
                <Card key={court.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {court.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{court.address}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="capitalize">
                            {court.sport}
                          </Badge>
                          <Badge variant="outline">
                            {court.total_courts} {court.total_courts === 1 ? 'Court' : 'Courts'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {court.court_type} Surface
                          </Badge>
                          {court.is_public && (
                            <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Operating Hours */}
                    {court.operating_hours?.info && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{court.operating_hours.info}</span>
                      </div>
                    )}

                    {/* Amenities */}
                    {court.amenities && court.amenities.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {court.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              {getAmenityIcon(amenity)}
                              <span className="capitalize">{amenity.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scheduled Events */}
                    {schedule.length > 0 && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleCourtExpansion(court.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Upcoming Events ({schedule.length})</span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="space-y-2">
                            {schedule.slice(0, 3).map((block) => (
                              <div key={block.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-900">{block.title}</div>
                                <div className="text-sm text-blue-700">
                                  {formatScheduleDate(block.start_time)} at {format(parseISO(block.start_time), 'h:mm a')}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  Court {block.court_number} • {block.reason}
                                </div>
                              </div>
                            ))}
                            {schedule.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{schedule.length - 3} more events this week
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const url = `https://maps.google.com?q=${court.latitude},${court.longitude}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Directions
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => window.open(`${origin}?utm_source=court_card&utm_medium=cta&utm_campaign=${municipality.unique_slug}&court=${court.id}`, '_blank')}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Find Players
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCourts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courts Found</h3>
                <p className="text-gray-600">
                  {selectedSport === 'all' 
                    ? "No courts are currently available for this location."
                    : `No ${selectedSport} courts are currently available for this location.`
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer CTA */}
          <Card className="mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Play?</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Download the OpenCourts app to connect with other players, check court availability in real-time, 
                and join tournaments in {municipality.city}.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  onClick={() => window.open(`${origin}?utm_source=footer_cta&utm_medium=cta&utm_campaign=${municipality.unique_slug}`, '_blank')}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Get OpenCourts App
                </Button>
                {publicUrl && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      alert('Page link copied to clipboard!');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share This Page
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}