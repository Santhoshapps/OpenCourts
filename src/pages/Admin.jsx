
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
// Correctly import entities individually instead of from a barrel file
import { Municipality } from "@/api/entities";
import { MunicipalityAdmin } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SiteAdminDashboard from "../components/admin/SiteAdminDashboard";
import TownAdminDashboard from "../components/admin/TownAdminDashboard";
import { Shield, Building, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button"; // Added import for Button component
import RedeemAccessCode from "../components/admin/RedeemAccessCode";
import CheckoutControls from "../components/admin/CheckoutControls"; // New import

export default function Admin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSiteAdmin, setIsSiteAdmin] = useState(false); // Renamed for clarity
  const [townAdminMunicipalities, setTownAdminMunicipalities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    setError(null);
    setIsLoading(true);
    try {
      console.log("Admin Page: Checking user role...");
      const user = await User.me();
      setCurrentUser(user);
      console.log("Admin Page: User loaded", user);
      
      if (user.role === 'admin') {
        setIsSiteAdmin(true);
        console.log("Admin Page: User is a site admin.");
      } else {
        setIsSiteAdmin(false); // Ensure isAdmin is false if not a site admin
      }

      console.log("Admin Page: Checking for town admin roles...");
      const activeAdminRoles = await MunicipalityAdmin.filter({ user_id: user.id, status: 'active' });
      console.log("Admin Page: Found town admin roles:", activeAdminRoles);
      
      if (activeAdminRoles.length > 0) {
        const municipalityIds = activeAdminRoles.map(r => r.municipality_id);
        console.log("Admin Page: Fetching municipalities with IDs:", municipalityIds);
        const municipalities = await Municipality.filter({ 
            id: { "$in": municipalityIds }
        });
        setTownAdminMunicipalities(municipalities);
        console.log("Admin Page: Loaded town admin municipalities:", municipalities);
      } else {
        setTownAdminMunicipalities([]); // Ensure array is empty if no roles
      }

    } catch (err) {
      console.error("Admin Page: Error checking user role:", err);
      setError(`An unexpected error occurred while loading your credentials: ${err.message}. Please try refreshing the page.`);
      setCurrentUser(null); // Clear user on error
    } finally {
      setIsLoading(false);
      console.log("Admin Page: Finished loading.");
    }
  };

  const handleAccessGranted = () => {
    checkUserRole(); // Re-fetch roles to update the UI
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Display error message if something went wrong
  if (error) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-xl mx-auto">
                <Alert variant="destructive" className="mt-8">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Admin Page</AlertTitle>
                    <AlertDescription>
                        {error}
                        <Button onClick={() => window.location.reload()} className="mt-4 w-full">
                            Refresh Page
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
      );
  }
  
  const hasAnyAdminRole = isSiteAdmin || townAdminMunicipalities.length > 0;

  // Scenario 1: User has NO admin roles. Show only the redeem code form.
  if (!currentUser || !hasAnyAdminRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <RedeemAccessCode onAccessGranted={handleAccessGranted} />
      </div>
    );
  }
  
  // Scenario 2: User has AT LEAST ONE admin role. Show the full dashboard.
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your assigned municipalities and system settings.</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
            {isSiteAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600"/>
                    Site Administration
                  </CardTitle>
                  <CardDescription>Manage municipalities, users, and platform-wide settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SiteAdminDashboard />
                </CardContent>
              </Card>
            )}

            {townAdminMunicipalities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600"/>
                    My Municipalities
                  </CardTitle>
                  <CardDescription>Manage courts, branding, and settings for your assigned municipalities.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TownAdminDashboard municipalities={townAdminMunicipalities} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar column for tools - only shows content if user is a site admin */}
          <div className="lg:col-span-1 space-y-8">
            {isSiteAdmin && (
              <>
                <RedeemAccessCode onAccessGranted={handleAccessGranted} />
                <CheckoutControls onRefresh={checkUserRole} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
