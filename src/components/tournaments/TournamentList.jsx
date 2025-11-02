
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, Crown, MapPin, Plus, Filter, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

// Assuming these are defined elsewhere and correctly imported
// e.g., import LadderTournament from "@/lib/models/LadderTournament";
// e.g., import CreateTournament from "@/components/CreateTournament";
// e.g., import TournamentDetails from "@/components/TournamentDetails";
// For the purpose of providing a functional file, I'll include mock imports if not real ones.
// In a real project, these would be actual paths to your models and components.

// --- MOCK IMPORTS (REMOVE IN REAL PROJECT IF YOU HAVE ACTUAL IMPORTS) ---
const LadderTournament = {
  list: async () => {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: "1",
            name: "Summer Slam Tennis Singles",
            description: "A competitive singles tennis tournament for 3.5 NTRP players.",
            ntrp_level: 3.5,
            max_participants: 16,
            tournament_format: "singles",
            sport: "tennis",
            city: "Springfield",
            state: "IL",
            status: "open",
            start_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1, 15)).toISOString(),
            entry_fee: 50,
          },
          {
            id: "2",
            name: "Doubles Pickleball Challenge",
            description: "Team up for a fun doubles pickleball tournament!",
            ntrp_level: 3.0,
            max_participants: 12,
            tournament_format: "doubles",
            sport: "pickleball",
            city: "Greenville",
            state: "SC",
            status: "open",
            start_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
            end_date: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
            entry_fee: 40,
          },
          {
            id: "3",
            name: "Fall Open Tennis",
            description: "Annual fall tennis tournament for all levels.",
            ntrp_level: 4.0,
            max_participants: 32,
            tournament_format: "singles",
            sport: "tennis",
            city: "Portland",
            state: "OR",
            status: "active",
            start_date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
            end_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
            entry_fee: 60,
          },
          {
            id: "4",
            name: "Winter Indoor Pickleball",
            description: "Stay warm with some indoor pickleball action.",
            ntrp_level: 2.5,
            max_participants: 10,
            tournament_format: "singles",
            sport: "pickleball",
            city: "Denver",
            state: "CO",
            status: "completed",
            start_date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() - 2, 7)).toISOString(),
            entry_fee: 30,
          },
          {
            id: "5",
            name: "Local Tennis Ladder (Points Robin)",
            description: "Continuous points robin for local tennis enthusiasts.",
            ntrp_level: 3.0,
            max_participants: null, // Unlimited players for points_robin
            tournament_format: "singles",
            sport: "tennis",
            city: "Austin",
            state: "TX",
            status: "open",
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
            entry_fee: 0,
            tournament_type: "points_robin"
          }
        ]);
      }, 500);
    });
  },
  // Add other methods like create, join, delete if needed for a full mock
};

// Mock CreateTournament Component
const CreateTournament = ({ onTournamentCreated, onCancel }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ntrpLevel, setNtrpLevel] = useState("3.0");
  const [sport, setSport] = useState("tennis");
  const [format, setFormat] = useState("singles");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [entryFee, setEntryFee] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTournament = {
      id: String(Date.now()), // Simple unique ID
      name,
      description,
      ntrp_level: parseFloat(ntrpLevel),
      max_participants: parseInt(maxParticipants, 10),
      tournament_format: format,
      sport,
      city,
      state,
      status: "open", // New tournaments are open by default
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      entry_fee: parseFloat(entryFee),
    };
    onTournamentCreated(newTournament);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Tournament</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tournament Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">NTRP Level</label>
            <Select value={ntrpLevel} onValueChange={setNtrpLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => (i * 0.5) + 2.0).map(level => (
                  <SelectItem key={level} value={level.toFixed(1)}>{level.toFixed(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sport</label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="pickleball">Pickleball</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singles">Singles</SelectItem>
                <SelectItem value="doubles">Doubles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Participants</label>
            <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State (e.g., CA)</label>
            <Input value={state} onChange={(e) => setState(e.target.value)} maxLength="2" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Entry Fee ($)</label>
          <Input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} min="0" step="0.01" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Create Tournament</Button>
        </div>
      </form>
    </div>
  );
};

// Mock TournamentDetails Component
const TournamentDetails = ({ tournament, onClose, onJoin }) => {
  if (!tournament) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">{tournament.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-sm">
              {tournament.sport === 'tennis' ? '🎾' : '🏓'} {tournament.sport}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {tournament.tournament_format === 'singles' ? '👤 Singles' : '👥 Doubles'}
            </Badge>
          </div>
        </div>
        <Badge className={`px-3 py-1 rounded-full text-sm ${
            tournament.status === "open" ? "bg-green-100 text-green-800" :
            tournament.status === "active" ? "bg-blue-100 text-blue-800" :
            "bg-gray-100 text-gray-800"
          }`}>
          {tournament.status}
        </Badge>
      </div>

      <p className="text-gray-700 text-lg">{tournament.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <span>{tournament.city}, {tournament.state}</span>
        </div>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          <span>NTRP {tournament.ntrp_level} Level</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>
            {tournament.max_participants ? `Max ${tournament.max_participants} ${tournament.tournament_format === 'singles' ? 'players' : 'teams'}` : 'Unlimited players'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span>
            {format(new Date(tournament.start_date), 'MMM d, yyyy')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
          </span>
        </div>
        {tournament.entry_fee > 0 && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <span>${tournament.entry_fee} Entry Fee</span>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {tournament.status === 'open' && (
          <Button onClick={() => onJoin(tournament)}>Join Tournament</Button>
        )}
        {tournament.status !== 'open' && (
          <Button disabled>Tournament Not Open</Button>
        )}
      </div>
    </div>
  );
};
// --- END MOCK IMPORTS ---

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    skillLevel: "all",
    status: "all",
    location: "", // For city/state text search
    sport: "all",
    format: "all",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const loadTournaments = async () => {
    setIsLoading(true);
    try {
      const allTournaments = await LadderTournament.list();
      setTournaments(allTournaments);
    } catch (error) {
      console.error("Error loading tournaments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleViewTournament = (tournament) => {
    setSelectedTournament(tournament);
  };

  const handleJoinTournament = (tournament) => {
    // This would typically involve an API call to join the tournament.
    // For this example, we just log and close the modal.
    console.log(`Player attempting to join tournament: ${tournament.name}`);
    alert(`You are attempting to join ${tournament.name}. This is a mock action.`);
    setSelectedTournament(null); // Close modal after "joining"
    // In a real app, you might also trigger a refresh of the tournaments
    // or specifically update the joined tournament's status/participant count.
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.state.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel =
      filters.skillLevel === "all" ||
      tournament.ntrp_level.toString() === filters.skillLevel;
    const matchesStatus =
      filters.status === "all" || tournament.status === filters.status;
    const matchesLocation =
      !filters.location ||
      tournament.city.toLowerCase().includes(filters.location.toLowerCase()) ||
      tournament.state.toLowerCase().includes(filters.location.toLowerCase());
    const matchesSport =
      filters.sport === "all" || tournament.sport === filters.sport;
    const matchesFormat =
      filters.format === "all" || tournament.tournament_format === filters.format;

    return (
      matchesSearch &&
      matchesLevel &&
      matchesStatus &&
      matchesLocation &&
      matchesSport &&
      matchesFormat
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-8 lg:p-10">
        <div className="flex justify-between items-center animate-pulse">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tennis & Pickleball Tournaments</h2>
          <p className="text-gray-600">Join singles and doubles ladder tournaments in your area</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search tournaments, cities, or states..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg mt-4">
                <Select value={filters.sport} onValueChange={(value) => setFilters({...filters, sport: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="pickleball">Pickleball</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.format} onValueChange={(value) => setFilters({...filters, format: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="doubles">Doubles</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.skillLevel} onValueChange={(value) => setFilters({...filters, skillLevel: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Skill Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {Array.from({ length: 7 }, (_, i) => (i * 0.5) + 2.0).map(level => (
                      <SelectItem key={level} value={level.toFixed(1)}>{level.toFixed(1)} NTRP</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Location (city/state)"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="col-span-full sm:col-span-1"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Tournament Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {tournament.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {tournament.sport === 'tennis' ? '🎾' : '🏓'} {tournament.sport}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tournament.tournament_format === 'singles' ? (
                          <>👤 Singles</>
                        ) : (
                          <>👥 Doubles</>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={getStatusColor(tournament.status)}>
                    {tournament.status}
                  </Badge>
                </div>

                {/* Tournament Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tournament.city}, {tournament.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>{tournament.ntrp_level} NTRP Level</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {tournament.max_participants ? `Up to ${tournament.max_participants} ${tournament.tournament_format === 'singles' ? 'players' : 'teams'}` : (tournament.tournament_type === 'points_robin' ? 'Unlimited players' : 'Max players not specified')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {tournament.entry_fee > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>${tournament.entry_fee} entry fee</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {tournament.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {tournament.description}
                  </p>
                )}

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant={tournament.status === 'open' ? 'default' : 'outline'}
                  onClick={() => handleViewTournament(tournament)}
                >
                  {tournament.status === 'open' ? 'View & Join' : 'View Details'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTournaments.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ?
              `No tournaments match your search for "${searchTerm}".` :
              "No tournaments available with the selected filters."
            }
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => setShowCreateForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Tournament
            </Button>
            {(searchTerm || Object.values(filters).some(f => f !== "all" && f !== "")) && (
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setFilters({
                  skillLevel: "all",
                  status: "all",
                  location: "",
                  sport: "all",
                  format: "all"
                });
                setShowFilters(false);
              }}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CreateTournament
              onTournamentCreated={(tournament) => {
                setTournaments(prev => [tournament, ...prev]);
                setShowCreateForm(false);
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Tournament Details Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TournamentDetails
              tournament={selectedTournament}
              onClose={() => setSelectedTournament(null)}
              onJoin={handleJoinTournament}
            />
          </div>
        </div>
      )}
    </div>
  );
}
