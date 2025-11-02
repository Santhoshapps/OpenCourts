
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Municipality, Court, CourtSession } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BarChart, Clock, Zap, Users, TrendingUp, Filter } from 'lucide-react';
import { createPageUrl } from "@/utils";
import { subDays, subMonths, format, getHours, parseISO, differenceInMinutes } from 'date-fns';

import KeyMetrics from '../components/analytics/KeyMetrics';
import UtilizationChart from '../components/analytics/UtilizationChart';
import HourlyActivityChart from '../components/analytics/HourlyActivityChart';
import DailyActivityChart from '../components/analytics/DailyActivityChart';
import GuestAnalytics from '../components/analytics/GuestAnalytics'; // New import for Guest Analytics

// Helper to get the start date for filtering based on timeframe
const getTimeRangeStart = (timeframe) => {
    const now = new Date();
    switch (timeframe) {
        case '7d': return subDays(now, 7);
        case '30d': return subDays(now, 30);
        case '3m': return subMonths(now, 3);
        case '6m': return subMonths(now, 6);
        case '1y': return subMonths(now, 12);
        default: return subDays(now, 30);
    }
};

// Helper to process data for analytics with better error handling
const processDataForAnalytics = (courts, sessions, timeframe) => {
    if (!courts || courts.length === 0) {
        return {
            keyMetrics: { 
                playHoursToday: 0, 
                totalCheckIns: 0, 
                busiestCourt: 'No courts', 
                peakHour: 'No data',
                averageUtilization: 0
            },
            utilizationData: [],
            hourlyData: Array.from({length: 24}, (_, i) => ({ hour: `${i}:00`, checkins: 0 })),
            dailyData: Array.from({length: 7}, (_, i) => ({ day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i], checkins: 0 }))
        };
    }

    const now = new Date();
    // Set todayStart to the beginning of the current day to filter sessions for "today"
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Filter sessions by the selected timeframe
    const filteredSessions = sessions.filter(s => {
        if (!s.created_date) return false; // Ensure created_date exists
        const sessionDate = parseISO(s.created_date);
        return sessionDate >= getTimeRangeStart(timeframe);
    });

    console.log(`Processing ${filteredSessions.length} sessions out of ${sessions.length} total for timeframe ${timeframe}`);

    // Key Metrics
    const todaySessions = filteredSessions.filter(s => {
        const sessionDate = parseISO(s.created_date);
        return sessionDate >= todayStart;
    });

    const totalCheckIns = filteredSessions.length;

    const playHoursToday = todaySessions.reduce((total, s) => {
        if (s.status === 'completed' && s.actual_end_time) {
            return total + differenceInMinutes(parseISO(s.actual_end_time), parseISO(s.start_time));
        }
        if (s.estimated_end_time) {
            // Use estimated_end_time if actual_end_time is not available
            return total + differenceInMinutes(parseISO(s.estimated_end_time), parseISO(s.start_time));
        }
        return total + 90; // Default 90 minutes
    }, 0) / 60;

    // Court utilization data (hours played per court)
    const courtUsage = courts.map(court => {
        const courtSessions = filteredSessions.filter(s => s.court_id === court.id);
        const totalHours = courtSessions.reduce((total, s) => {
            if (s.status === 'completed' && s.actual_end_time) {
                return total + differenceInMinutes(parseISO(s.actual_end_time), parseISO(s.start_time));
            }
            if (s.estimated_end_time) {
                return total + differenceInMinutes(parseISO(s.estimated_end_time), parseISO(s.start_time));
            }
            return total + 90; // Default session length in minutes
        }, 0) / 60; // Convert minutes to hours
        
        return {
            name: court.name.length > 20 ? court.name.substring(0, 20) + '...' : court.name,
            hours: Math.round(totalHours * 10) / 10, // Round to one decimal place
            checkins: courtSessions.length
        };
    });

    // Find busiest court based on check-ins
    const busiestCourt = courtUsage.reduce((max, court) => 
        court.checkins > max.checkins ? court : max, 
        { checkins: -1, name: 'No activity' } // Initialize with -1 to ensure any court with 0+ check-ins is picked
    );
    if (busiestCourt.checkins === -1 || busiestCourt.checkins === 0) busiestCourt.name = 'No activity yet'; // Fallback if no activity at all

    // Hourly activity data
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
        const hourSessions = filteredSessions.filter(s => {
            if (!s.start_time) return false; // Ensure start_time exists
            const sessionHour = getHours(parseISO(s.start_time));
            return sessionHour === hour;
        });
        return { hour: `${hour}:00`, checkins: hourSessions.length };
    });

    // Find peak hour
    const peakHour = hourlyActivity.reduce((max, current) => 
        current.checkins > max.checkins ? current : max, 
        { checkins: -1, hour: 'No data' }
    );
    if (peakHour.checkins === -1 || peakHour.checkins === 0) peakHour.hour = 'No data';

    // Daily activity for the selected timeframe (grouped by day of week)
    const dailyActivity = Array.from({ length: 7 }, (_, dayIndex) => {
        const sessionsForDay = filteredSessions.filter(s => {
            if (!s.start_time) return false; // Ensure start_time exists
            const sessionDay = parseISO(s.start_time).getDay();
            return sessionDay === dayIndex;
        });
        return { 
            day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayIndex], 
            checkins: sessionsForDay.length 
        };
    });

    return {
        keyMetrics: {
            totalCheckIns: totalCheckIns,
            playHoursToday: Math.round(playHoursToday * 10) / 10, // Ensure one decimal place
            busiestCourt: busiestCourt.name,
            peakHour: peakHour.hour,
            averageUtilization: courts.length > 0 ? Math.round((totalCheckIns / courts.length) * 100) / 10 : 0
        },
        utilizationData: courtUsage,
        hourlyData: hourlyActivity,
        dailyData: dailyActivity
    };
};

export default function TownAnalytics() {
    const [municipality, setMunicipality] = useState(null);
    const [courts, setCourts] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [filteredData, setFilteredData] = useState(null); // This data is still processed but not passed directly to all charts in the new tabbed view
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter states
    const [selectedCourt, setSelectedCourt] = useState('all');
    const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
    const [activeTab, setActiveTab] = useState('overview'); // New state for tabs
    
    const urlParams = new URLSearchParams(window.location.search);
    const municipalityId = urlParams.get('municipality_id');

    useEffect(() => {
        if (municipalityId) {
            // Get filters from URL if they exist
            const urlCourt = urlParams.get('court_id') || 'all';
            const urlTimeframe = urlParams.get('timeframe') || '30d';
            
            setSelectedCourt(urlCourt);
            setSelectedTimeframe(urlTimeframe);
            
            const loadData = async () => {
                setIsLoading(true);
                setError(null);
                console.log('Loading data for municipality:', municipalityId);
                
                try {
                    // Load municipality data
                    const municipalityData = await Municipality.filter({ id: municipalityId });
                    if (municipalityData.length === 0) {
                        throw new Error("Municipality not found");
                    }
                    setMunicipality(municipalityData[0]);
                    console.log('Municipality loaded:', municipalityData[0].name);

                    // Load courts for this municipality
                    const courtsData = await Court.filter({ municipality_id: municipalityId });
                    setCourts(courtsData);
                    console.log('Courts loaded:', courtsData.length);
                    
                    // Load all sessions and filter for municipal courts
                    const allSessions = await CourtSession.list();
                    const municipalCourtIds = courtsData.map(c => c.id);
                    const municipalSessions = allSessions.filter(s => municipalCourtIds.includes(s.court_id));
                    setSessions(municipalSessions);
                    console.log('Sessions loaded:', municipalSessions.length, 'total,', allSessions.length, 'all sessions');
                    
                } catch (error) {
                    console.error('Error loading analytics data:', error);
                    setError(error.message || "Failed to load analytics data");
                } finally {
                    setIsLoading(false);
                }
            };

            loadData();
        } else {
            setError("No municipality ID provided in URL");
            setIsLoading(false);
        }
    }, [municipalityId]);

    useEffect(() => {
        // Only process data if municipality, courts, and sessions are loaded
        // This still processes data for the current filters, but the new UI components
        // are expected to handle their own data fetching/processing based on props.
        if (municipality && courts.length >= 0 && sessions.length >= 0) {
            console.log('Processing filtered data...', { 
                municipality: municipality.name, 
                courts: courts.length, 
                sessions: sessions.length,
                selectedCourt,
                selectedTimeframe 
            });
            
            const processFilteredData = () => {
                let displayCourts = courts;
                let displaySessions = sessions;
                
                // Filter courts and sessions based on selectedCourt filter
                if (selectedCourt !== 'all') {
                    displayCourts = courts.filter(c => c.id === selectedCourt);
                    displaySessions = sessions.filter(s => s.court_id === selectedCourt);
                }

                // Pass the filtered data and selected timeframe to the processing helper
                const processed = processDataForAnalytics(displayCourts, displaySessions, selectedTimeframe);
                setFilteredData(processed);
                console.log('Processed data:', processed);
            };

            processFilteredData();
        }
    }, [municipality, courts, sessions, selectedCourt, selectedTimeframe]);

    const timeframeOptions = [
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '3m', label: 'Last 3 Months' },
        { value: '6m', label: 'Last 6 Months' },
        { value: '1y', label: 'Last 12 Months' }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics data...</p>
                </div>
            </div>
        );
    }

    if (error || !municipality) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <BarChart className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Analytics</h3>
                    <p className="text-gray-600 mb-4">{error || "Municipality not found"}</p>
                    <Link to={createPageUrl('Admin')}>
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Admin
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Derive dateRange for child components
    const dateRange = {
        start: getTimeRangeStart(selectedTimeframe),
        end: new Date()
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8"> {/* Changed padding */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Changed padding */}
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to={createPageUrl('Admin')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Admin
                            </Button>
                        </Link>
                        {municipality.logo_url && (
                            <img src={municipality.logo_url} alt={municipality.name} className="w-10 h-10 rounded-full object-cover" />
                        )}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900">{municipality.name} Analytics</h1>
                    <p className="text-gray-600 mt-1">
                        Comprehensive insights into park usage and court activity • {courts.length} courts tracked
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Analytics Filters
                        </CardTitle>
                        <CardDescription>Customize the data view by selecting specific courts and time periods</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="court-filter">Filter by Court</Label>
                                <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                                    <SelectTrigger id="court-filter">
                                        <SelectValue placeholder="Select court..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Courts ({courts.length} courts)</SelectItem>
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
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <span className="font-medium">Current View:</span> {' '}
                                {selectedCourt === 'all' ? 'All Courts' : courts.find(c => c.id === selectedCourt)?.name || 'Selected Court'} • {' '}
                                {timeframeOptions.find(t => t.value === selectedTimeframe)?.label} • {' '}
                                {filteredData ? filteredData.keyMetrics.totalCheckIns : '...'} total sessions
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabbed Analytics Content */}
                {municipality && (
                    <div className="space-y-8">
                        {/* Tabs for different analytics views */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'overview'
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('utilization')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'utilization'
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Court Utilization
                                </button>
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'activity'
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Activity Patterns
                                </button>
                                <button
                                    onClick={() => setActiveTab('guests')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'guests'
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Guest Analytics
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <KeyMetrics municipality={municipality} dateRange={dateRange} />
                        )}
                        
                        {activeTab === 'utilization' && (
                            <UtilizationChart municipality={municipality} dateRange={dateRange} />
                        )}
                        
                        {activeTab === 'activity' && (
                            <div className="space-y-8">
                                <HourlyActivityChart municipality={municipality} dateRange={dateRange} />
                                <DailyActivityChart municipality={municipality} dateRange={dateRange} />
                            </div>
                        )}

                        {activeTab === 'guests' && (
                            <GuestAnalytics municipality={municipality} dateRange={dateRange} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
