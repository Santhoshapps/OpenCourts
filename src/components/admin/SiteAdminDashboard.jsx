
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Municipality, MunicipalityAdmin } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Building, PlusCircle, Mail, RefreshCw, AlertTriangle, CheckCircle, Database, Layers, MapPin } from "lucide-react"; // Added Layers, MapPin
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateApexData } from "@/api/functions";
import { Badge } from "@/components/ui/badge"; // Added this import for the new UI section
import { Link } from 'react-router-dom'; // Assuming Link is from react-router-dom

// Utility function to create admin page URLs
const createPageUrl = (pageName) => {
  // This is a placeholder. In a real app, this would map to actual routes.
  // Example: /admin/architecture, /admin/court-management, /admin/newsletter-management
  return `/admin/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
};

export default function SiteAdminDashboard() {
  const [municipalities, setMunicipalities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMunicipality, setNewMunicipality] = useState({ name: "", city: "", state: "" });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [generationResult, setGenerationResult] = useState(null); // New state for data generation outcome

  // New states for duplicate municipality management
  const [duplicateMunicipalities, setDuplicateMunicipalities] = useState([]);
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    loadMunicipalities();
    findDuplicateMunicipalities(); // Call this on initial load to detect duplicates
  }, []);

  const loadMunicipalities = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const data = await Municipality.list();
      setMunicipalities(data);
    } catch (err) {
      console.error("Failed to load municipalities:", err);
      setError("Error: Could not load municipalities.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeAddress = (address) => {
    return address
      .toLowerCase()
      .trim()
      .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|place|pl)\b/g, '')
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim();
  };

  const findDuplicateMunicipalities = async () => {
    try {
      const allMunicipalities = await Municipality.list();
      const duplicates = [];
      const seen = new Map();

      allMunicipalities.forEach(municipality => {
        // Use normalized city-state as the key, but also check for similar names
        const normalizedKey = `${municipality.city.toLowerCase().trim()}-${municipality.state.toLowerCase().trim()}`;
        const nameKey = municipality.name.toLowerCase().trim();
        
        if (seen.has(normalizedKey)) {
          const existing = seen.get(normalizedKey);
          const existingGroup = duplicates.find(group => group.some(m => m.id === existing.id));
          if (existingGroup) {
            existingGroup.push(municipality);
          } else {
            duplicates.push([existing, municipality]);
          }
        } else {
          // Also check for similar municipality names in the same area
          const similarEntry = Array.from(seen.entries()).find(([key, muni]) => {
            const [city, state] = key.split('-');
            return state === municipality.state.toLowerCase().trim() && 
                   (city.includes(municipality.city.toLowerCase().trim()) || 
                    municipality.city.toLowerCase().trim().includes(city) ||
                    muni.name.toLowerCase().trim().includes(nameKey) ||
                    nameKey.includes(muni.name.toLowerCase().trim()));
          });
          
          if (similarEntry) {
            const existing = similarEntry[1];
            const existingGroup = duplicates.find(group => group.some(m => m.id === existing.id));
            if (existingGroup) {
              existingGroup.push(municipality);
            } else {
              duplicates.push([existing, municipality]);
            }
          } else {
            seen.set(normalizedKey, municipality);
          }
        }
      });

      console.log("Found duplicate municipality groups:", duplicates);
      setDuplicateMunicipalities(duplicates);
      return duplicates;
    } catch (error) {
      console.error("Error finding duplicates:", error);
      return [];
    }
  };

  const mergeMunicipalities = async (primaryId, duplicateIds) => {
    setIsMerging(true);
    setError(null);
    setSuccessMessage(null);
    setGenerationResult(null); // Clear other messages

    try {
      const { mergeDuplicateMunicipalities } = await import("@/api/functions");
      
      const result = await mergeDuplicateMunicipalities({
        primaryMunicipalityId: primaryId,
        duplicateMunicipalityIds: duplicateIds
      });

      if (result.data.success) {
        setSuccessMessage(result.data.message);
        await loadMunicipalities(); // Refresh the main list
        await findDuplicateMunicipalities(); // Refresh duplicates list
      } else {
        setError(result.data.message || "Failed to merge municipalities. Please try again.");
      }
    } catch (error) {
      console.error("Error merging municipalities:", error);
      setError("Failed to merge municipalities. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  const handleCreateMunicipality = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setGenerationResult(null); // Clear generation result when performing other actions
    try {
      const slug = newMunicipality.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      await Municipality.create({ ...newMunicipality, unique_slug: slug });
      setShowAddForm(false);
      setNewMunicipality({ name: "", city: "", state: "" });
      await loadMunicipalities();
      await findDuplicateMunicipalities(); // Re-check for duplicates after creating new municipality
      setSuccessMessage(`Municipality "${newMunicipality.name}" created successfully!`);
    } catch (error) {
      console.error("Failed to create municipality:", error);
      setError("Error: Could not create municipality. A municipality with this name might already exist.");
    }
  };
  
  const handleInviteAdmin = async (municipality) => {
    setSelectedMunicipality(municipality);
    setShowInviteForm(true);
    setInviteEmail("");
    setError(null);
    setSuccessMessage(null);
    setGenerationResult(null); // Clear generation result when performing other actions
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !selectedMunicipality) return;

    setIsSending(true);
    setError(null);
    setGenerationResult(null); // Clear generation result when performing other actions

    try {
      // Generate a 8-character access code
      const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create the admin invitation record
      await MunicipalityAdmin.create({
        municipality_id: selectedMunicipality.id,
        invited_email: inviteEmail.trim(),
        access_code: accessCode,
        expires_at: expiresAt,
        status: "pending_code"
      });

      // Send invitation email using the same HTML template format
      const subject = `You're invited to manage ${selectedMunicipality.name} on OpenCourts`;
      const body = `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #059669;">OpenCourts Admin Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited to become a Town Administrator for <strong>${selectedMunicipality.name}</strong> on the OpenCourts platform.</p>
          <p>To accept your invitation and gain administrative access, please follow these steps:</p>
          <ol>
            <li>Log in to your OpenCourts account using this email address (${inviteEmail.trim()}).</li>
            <li>Navigate to the <a href="https://opencourts.app/Admin">Admin Page</a>.</li>
            <li>Enter the following 8-character access code:</li>
          </ol>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 0; color: #1f2937;">${accessCode}</p>
          </div>
          <p>This code is valid for 7 days and can only be used once.</p>
          <p>As a Town Administrator, you'll be able to:</p>
          <ul>
            <li>Add and manage tennis and pickleball courts for your municipality</li>
            <li>Block courts for tournaments, lessons, and maintenance</li>
            <li>Customize your town's public courts page with branding</li>
            <li>Generate QR codes and links for residents</li>
          </ul>
          <p>If you have any questions, please contact your site administrator.</p>
          <p>Thank you,<br>The OpenCourts Team</p>
        </div>
      `;

      await SendEmail({
        to: inviteEmail.trim(),
        subject: subject,
        body: body
      });

      setSuccessMessage(`Invitation sent successfully to ${inviteEmail}! They will receive an access code via email.`);
      setShowInviteForm(false);
      setInviteEmail("");
      setSelectedMunicipality(null);

    } catch (error) {
      console.error("Failed to send invitation:", error);
      setError("Failed to send invitation. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateData = async () => {
    setIsGeneratingData(true);
    setGenerationResult(null); // Clear previous result
    setError(null); // Also clear global error messages
    setSuccessMessage(null); // Also clear global success messages

    try {
        const response = await generateApexData(); // Assuming this returns an Axios-like response object
        if (response.status >= 200 && response.status < 300) {
            setGenerationResult({
                type: 'success',
                message: response.data.message || 'Sample data generated successfully!'
            });
            // If the data generation creates a municipality (e.g., "Apex NC Township"),
            // reload municipalities to reflect the change.
            if (response.data.municipalityCreated || response.data.message.includes("Apex NC Township")) {
                await loadMunicipalities();
                await findDuplicateMunicipalities(); // Re-check for duplicates after data generation
            }
        } else {
            // Handle non-2xx responses, like 400 Bad Request, where Axios doesn't throw an error directly
            setGenerationResult({
                type: 'error',
                message: response.data.error || 'Failed to generate sample data'
            });
        }
    } catch (error) {
        console.error('Error generating sample data:', error);
        const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred while generating sample data.';
        setGenerationResult({
            type: 'error',
            message: `Error: ${errorMessage}`
        });
    } finally {
        setIsGeneratingData(false);
    }
  };

  if (isLoading) {
    return <div>Loading municipalities...</div>;
  }

  return (
    <div className="space-y-8"> {/* Changed from space-y-6 to space-y-8 for new section spacing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Site Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            to={createPageUrl("Architecture")} 
            className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">App Architecture</h3>
                <p className="text-sm text-blue-700">Technical overview and system design</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to={createPageUrl("CourtManagement")} 
            className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Court Management</h3>
                <p className="text-sm text-green-700">Manage and sync court data</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to={createPageUrl("NewsletterManagement")} 
            className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900">Newsletter Management</h3>
                <p className="text-sm text-purple-700">Create and send newsletters</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

       {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert variant="default" className="mb-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Analytics Sample Data
              </CardTitle>
              <CardDescription>
                  Generate sample court check-in data for "Apex NC Township" over the last 6 months to test the analytics dashboard. This creates realistic evening and weekend usage patterns.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {generationResult && (
                  <Alert className={generationResult.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      <AlertDescription className={generationResult.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                          {generationResult.message}
                      </AlertDescription>
                  </Alert>
              )}
              <Button onClick={handleGenerateData} disabled={isGeneratingData}>
                  {isGeneratingData ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Data...
                      </>
                  ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Generate Sample Data for Apex NC Township
                      </>
                  )}
              </Button>
          </CardContent>
      </Card>

      {/* Duplicate Municipalities Section */}
      {duplicateMunicipalities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Duplicate Municipalities Detected
            </CardTitle>
            <CardDescription>
              These municipalities appear to be duplicates and should be merged to maintain data integrity. For each group, the first municipality listed will be kept as the primary, and all courts from the other duplicates will be reassigned to it. The duplicate municipalities will then be removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {duplicateMunicipalities.map((group, index) => (
              <div key={index} className="border rounded-lg p-4 bg-red-50">
                <h4 className="font-semibold mb-2">Duplicate Group #{index + 1} (Primary: {group[0].name})</h4>
                <div className="space-y-2 mb-3">
                  {group.map(municipality => (
                    <div key={municipality.id} className="flex justify-between items-center bg-white p-2 rounded">
                      <span>{municipality.name} - {municipality.city}, {municipality.state}</span>
                      <Badge variant="outline">{municipality.unique_slug}</Badge>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    const primary = group[0]; // Use first as primary
                    const duplicates = group.slice(1).map(m => m.id);
                    // Only attempt merge if there are actual duplicates to merge (i.e., group has more than one item)
                    if (duplicates.length > 0) { 
                        mergeMunicipalities(primary.id, duplicates);
                    } else {
                        console.warn("Attempted to merge a group with no secondary duplicates. This should not happen if `findDuplicateMunicipalities` works correctly.", group);
                    }
                  }}
                  disabled={isMerging}
                  size="sm"
                  variant="destructive"
                >
                  {isMerging ? 'Merging...' : `Merge courts into "${group[0].name}"`}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Municipalities</h3>
        <div>
          <Button variant="outline" size="sm" onClick={loadMunicipalities} className="mr-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            {showAddForm ? "Cancel" : "Add Municipality"}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Municipality</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMunicipality} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="name">Municipality Name</Label>
                    <Input id="name" value={newMunicipality.name} onChange={e => setNewMunicipality({...newMunicipality, name: e.target.value})} required />
                </div>
                 <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={newMunicipality.city} onChange={e => setNewMunicipality({...newMunicipality, city: e.target.value})} required />
                </div>
                 <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={newMunicipality.state} onChange={e => setNewMunicipality({...newMunicipality, state: e.target.value})} required />
                </div>
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Invite Admin Form */}
      {showInviteForm && selectedMunicipality && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Town Admin for {selectedMunicipality.name}</CardTitle>
            <CardDescription>Enter the email address of the person you want to invite as a Town Administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendInvitation} className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input 
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="admin@cityname.gov"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSending}>
                  {isSending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {municipalities.map(muni => (
          <Card key={muni.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="w-4 h-4"/>{muni.name}</CardTitle>
              <CardDescription>{muni.city}, {muni.state}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => handleInviteAdmin(muni)}>
                <Mail className="w-4 h-4 mr-2" />
                Invite Admin
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
