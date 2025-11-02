
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertCircle, CheckCircle, RefreshCw, Link } from 'lucide-react';
import { googleCalendarSync } from "@/api/functions";

export default function GoogleCalendarSync({ court, municipalityId }) {
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    // Check if we came back from OAuth and have a code in sessionStorage
    const oauthCode = sessionStorage.getItem('google_oauth_code');
    if (oauthCode && !isConnected) {
      handleOAuthCallback(oauthCode);
      sessionStorage.removeItem('google_oauth_code'); // Clean up
    }
  }, [isConnected]);

  const handleConnect = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const { data } = await googleCalendarSync({
        action: 'getAuthUrl'
      });
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to initialize Google Calendar connection. Please check that API credentials are configured.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await googleCalendarSync({
        action: 'exchangeCode',
        code: code
      });
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      if (data.access_token) {
        setAccessToken(data.access_token);
        setIsConnected(true);
        setSuccess('Connected to Google Calendar successfully!');
        
        // Automatically load calendars after successful connection
        await loadCalendars(data.access_token);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError('Failed to complete Google Calendar connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendars = async (token = accessToken) => {
    if (!token) {
      setError('No access token available. Please reconnect.');
      return;
    }
    
    setIsLoadingCalendars(true);
    setError('');
    
    try {
      console.log('🔍 DEBUG: Loading calendars with token:', token.substring(0, 20) + '...');
      
      const response = await googleCalendarSync({
        action: 'getCalendars',
        accessToken: token
      });
      
      console.log('🔍 DEBUG: Raw API response:', response);
      console.log('🔍 DEBUG: Response data:', response.data);
      
      const { data } = response;
      
      if (data.error) {
        console.error('🔍 DEBUG: API returned error:', data.error);
        setError(`Failed to load calendars: ${data.error}`);
        setCalendars([]);
        return;
      }
      
      // Google Calendar API returns items in a 'items' array
      if (data.items && Array.isArray(data.items)) {
        console.log('🔍 DEBUG: Found calendars:', data.items.length);
        console.log('🔍 DEBUG: Calendar details:', data.items.map(cal => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary
        })));
        
        setCalendars(data.items);
        
        if (data.items.length === 0) {
          setError('No calendars found in your Google account. Make sure you have at least one calendar created.');
        } else {
          setSuccess(`Found ${data.items.length} calendars in your Google account.`);
        }
      } else {
        console.error('🔍 DEBUG: Unexpected calendar data structure:', data);
        console.error('🔍 DEBUG: Expected "items" array, got:', typeof data.items);
        setError('Unexpected response format from Google Calendar API.');
        setCalendars([]);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error loading calendars:', error);
      console.error('🔍 DEBUG: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(`Failed to load calendars: ${error.message || 'Unknown error'}`);
      setCalendars([]);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleSync = async () => {
    if (!selectedCalendar || !accessToken) {
      setError('Please select a calendar first.');
      return;
    }

    // Add guard clause to ensure court and municipality info is present
    if (!court || !court.id || !municipalityId) {
      setError('Component is missing required Court or Municipality information. Please refresh the page and try again.');
      console.error('DEBUG: Sync failed because props were missing.', { court, municipalityId });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const { data } = await googleCalendarSync({
        action: 'syncEvents',
        accessToken: accessToken,
        calendarId: selectedCalendar,
        courtId: court.id,
        municipalityId: municipalityId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      if (data.error) {
        setError(data.error);
      } else if (data.success) {
        setSuccess(data.message || 'Successfully synced calendar events!');
      }
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred during sync.';
      setError(`Failed to sync calendar events: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Import events from your Google Calendar to automatically create court blocks and reservations.
        </p>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {!isConnected ? (
          <div className="space-y-2">
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Connect to Google Calendar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Connected to Google Calendar</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Calendar</label>
              <div className="flex gap-2">
                <Select value={selectedCalendar} onValueChange={setSelectedCalendar} disabled={isLoadingCalendars}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={
                      isLoadingCalendars 
                        ? "Loading calendars..." 
                        : calendars.length === 0 
                          ? "No calendars found - click Refresh" 
                          : "Choose a calendar to sync"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => loadCalendars()} 
                  disabled={isLoadingCalendars}
                  size="sm"
                >
                  {isLoadingCalendars ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* DEBUG INFO */}
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Debug: {calendars.length} calendars loaded, Access token: {accessToken ? 'Present' : 'Missing'}
              </div>
            </div>
            
            <Button 
              onClick={handleSync} 
              disabled={!selectedCalendar || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing Events...
                </>
              ) : (
                'Sync Calendar Events'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
