import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NewsletterSubscription } from "@/api/entities";
import { User } from "@/api/entities";
import { Mail, Bell, CheckCircle } from "lucide-react";

export default function NewsletterPreferences() {
  const [subscription, setSubscription] = useState(null);
  const [preferences, setPreferences] = useState({
    include_court_updates: true,
    include_feature_updates: true,
    include_community_highlights: true,
    include_tips: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const subscriptions = await NewsletterSubscription.filter({ 
        user_id: currentUser.id 
      });
      
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        setSubscription(sub);
        if (sub.preferences) {
          setPreferences(sub.preferences);
        }
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionToggle = async (subscribed) => {
    setIsSaving(true);
    try {
      if (subscribed && !subscription) {
        // Create new subscription
        const newSubscription = await NewsletterSubscription.create({
          user_id: user.id,
          email: user.email,
          subscription_type: "biweekly_updates",
          status: "active",
          preferences: preferences,
          unsubscribe_token: generateUnsubscribeToken()
        });
        setSubscription(newSubscription);
      } else if (!subscribed && subscription) {
        // Unsubscribe
        await NewsletterSubscription.update(subscription.id, {
          status: "unsubscribed"
        });
        setSubscription({ ...subscription, status: "unsubscribed" });
      } else if (subscribed && subscription && subscription.status === "unsubscribed") {
        // Resubscribe
        await NewsletterSubscription.update(subscription.id, {
          status: "active"
        });
        setSubscription({ ...subscription, status: "active" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = async (preference, value) => {
    const newPreferences = { ...preferences, [preference]: value };
    setPreferences(newPreferences);

    if (subscription && subscription.status === "active") {
      setIsSaving(true);
      try {
        await NewsletterSubscription.update(subscription.id, {
          preferences: newPreferences
        });
      } catch (error) {
        console.error("Error updating preferences:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const generateUnsubscribeToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSubscribed = subscription && subscription.status === "active";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Newsletter Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Subscription Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold">Biweekly Updates</h4>
            </div>
            <p className="text-sm text-gray-600">
              Get the latest OpenCourts features, community highlights, and tennis tips delivered to your inbox every two weeks.
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleSubscriptionToggle}
            disabled={isSaving}
          />
        </div>

        {/* Preference Details */}
        {isSubscribed && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">What would you like to receive?</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Features & Updates</p>
                  <p className="text-sm text-gray-600">Latest app improvements and new functionality</p>
                </div>
                <Switch
                  checked={preferences.include_feature_updates}
                  onCheckedChange={(value) => handlePreferenceChange('include_feature_updates', value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Court Updates</p>
                  <p className="text-sm text-gray-600">New courts added in your area</p>
                </div>
                <Switch
                  checked={preferences.include_court_updates}
                  onCheckedChange={(value) => handlePreferenceChange('include_court_updates', value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Community Highlights</p>
                  <p className="text-sm text-gray-600">Success stories and community achievements</p>
                </div>
                <Switch
                  checked={preferences.include_community_highlights}
                  onCheckedChange={(value) => handlePreferenceChange('include_community_highlights', value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tennis & Pickleball Tips</p>
                  <p className="text-sm text-gray-600">Pro tips and strategy advice</p>
                </div>
                <Switch
                  checked={preferences.include_tips}
                  onCheckedChange={(value) => handlePreferenceChange('include_tips', value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        )}

        {subscription && subscription.status === "unsubscribed" && (
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-600 mb-2">You're currently unsubscribed from newsletters</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubscriptionToggle(true)}
              disabled={isSaving}
            >
              Resubscribe
            </Button>
          </div>
        )}

        {isSubscribed && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span>You're subscribed! Next newsletter: Every other Monday at 9 AM</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}