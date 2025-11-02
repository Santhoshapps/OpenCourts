
import React, { useState } from 'react';
import { Player } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertTriangle, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function CreateProfileForm({ user, onProfileCreated }) {
  const [formData, setFormData] = useState({
    display_name: user.full_name || '',
    ntrp_rating: '3.0',
    utr_rating: '3.0', // Added UTR rating
    sport_preference: 'both', // Added sport preference
    preferred_play_style: 'both',
    bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [networkRetryCount, setNetworkRetryCount] = useState(0); // Added for network retry tracking
  const { toast } = useToast();

  // Network retry helper
  const retryNetworkRequest = async (requestFn, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.log(`Network request failed (attempt ${attempt}):`, error);
        
        // Check for specific network error indicators
        const isNetworkError = error.message?.includes('Network Error') || 
                              error.message?.includes('ERR_NETWORK') ||
                              error.code === 'NETWORK_ERROR' || 
                              (error.isAxiosError && !error.response); // Axios error with no response indicates network issue

        if (attempt === maxRetries) {
          if (isNetworkError) {
            throw new Error('NETWORK_ERROR'); // Custom error for network issues
          }
          throw error; // Re-throw other errors after max retries
        }
        
        if (isNetworkError) {
          console.log(`Network error detected, retrying in ${1000 * attempt}ms...`);
          // Increment retry count only for actual retries due to network issues
          if (attempt < maxRetries) {
             setNetworkRetryCount(prev => prev + 1);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue; // Try again
        }
        
        throw error; // Non-network errors shouldn't be retried
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNetworkRetryCount(0); // Reset network retry count on new submission

    if (!formData.display_name) {
      setError("Display name is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      await retryNetworkRequest(async () => {
        await Player.create({
          user_id: user.id,
          display_name: formData.display_name,
          ntrp_rating: parseFloat(formData.ntrp_rating),
          utr_rating: parseFloat(formData.utr_rating), // Pass UTR rating
          sport_preference: formData.sport_preference, // Pass sport preference
          preferred_play_style: formData.preferred_play_style,
          bio: formData.bio
        });
      });
      
      toast({
        title: "Profile Created!",
        description: "Welcome to OpenCourts. Your profile is now active.",
      });

      // Notify parent component that profile is created so it can reload
      if (onProfileCreated) {
        onProfileCreated();
      }

    } catch (err) {
      console.error("Failed to create profile:", err);
      
      // Detailed error handling based on error type
      if (err.message === 'NETWORK_ERROR' || !navigator.onLine) {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again in a few moments.");
      } else {
        setError("An error occurred while creating your profile. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-emerald-500" />
          <CardTitle className="text-2xl mt-4">Create Your Player Profile</CardTitle>
          <CardDescription>
            Welcome to OpenCourts! Let's set up your profile so you can start finding matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <p>{error}</p>
                  {error.includes("Network connection") && (
                    <p className="text-xs mt-1">
                      Check your internet connection. {networkRetryCount > 0 && `(Retried ${networkRetryCount} time${networkRetryCount > 1 ? 's' : ''})`}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="How you'll appear to others"
                required
              />
              <p className="text-xs text-gray-500">This is public. For your privacy, we suggest not using your full real name.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sport_preference">Preferred Sport</Label>
                  <Select
                      value={formData.sport_preference}
                      onValueChange={(value) => setFormData({ ...formData, sport_preference: value })}
                  >
                    <SelectTrigger id="sport_preference">
                      <SelectValue placeholder="Select preferred sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="pickleball">Pickleball</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="play_style">Preferred Play Style</Label>
                  <Select 
                      value={formData.preferred_play_style}
                      onValueChange={(value) => setFormData({ ...formData, preferred_play_style: value })}
                  >
                    <SelectTrigger id="play_style">
                      <SelectValue placeholder="Select play style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">Singles</SelectItem>
                      <SelectItem value="doubles">Doubles</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ntrp_rating">Tennis Skill (NTRP)</Label>
                  <Select 
                      value={formData.ntrp_rating} 
                      onValueChange={(value) => setFormData({ ...formData, ntrp_rating: value })}
                  >
                    <SelectTrigger id="ntrp_rating">
                      <SelectValue placeholder="Select your NTRP rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.5">1.5 - Beginner</SelectItem>
                      <SelectItem value="2.0">2.0 - Beginner</SelectItem>
                      <SelectItem value="2.5">2.5 - Adv. Beginner</SelectItem>
                      <SelectItem value="3.0">3.0 - Intermediate</SelectItem>
                      <SelectItem value="3.5">3.5 - Adv. Intermediate</SelectItem>
                      <SelectItem value="4.0">4.0 - Advanced</SelectItem>
                      <SelectItem value="4.5">4.5 - Adv.+</SelectItem>
                      <SelectItem value="5.0">5.0 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">For tennis players.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utr_rating">Pickleball Skill (UTR)</Label>
                  <Select
                      value={String(formData.utr_rating)}
                      onValueChange={(value) => setFormData({ ...formData, utr_rating: value })}
                  >
                    <SelectTrigger id="utr_rating">
                      <SelectValue placeholder="Select your UTR rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">1.0 - Beginner</SelectItem>
                      <SelectItem value="2.0">2.0 - Beginner</SelectItem>
                      <SelectItem value="3.0">3.0 - Intermediate</SelectItem>
                      <SelectItem value="3.5">3.5 - Intermediate</SelectItem>
                      <SelectItem value="4.0">4.0 - Advanced</SelectItem>
                      <SelectItem value="4.5">4.5 - Advanced</SelectItem>
                      <SelectItem value="5.0">5.0+ - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                   <p className="text-xs text-gray-500">For pickleball players.</p>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell others about your playing style, what you're looking for in a partner, etc."
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : "Create Profile & Get Started"}
            </Button>

            {/* Show connection status if there are network issues */}
            {networkRetryCount > 0 && error && error.includes("Network connection") && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {navigator.onLine ? "Connected to internet" : "⚠️ You appear to be offline"}
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
