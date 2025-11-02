import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewsletterSubscription } from "@/api/entities";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Unsubscribe() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleUnsubscribe();
  }, []);

  const handleUnsubscribe = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) {
        setError("Invalid unsubscribe link");
        return;
      }

      // Find subscription by unsubscribe token
      const subscriptions = await NewsletterSubscription.filter({ 
        unsubscribe_token: token 
      });

      if (subscriptions.length === 0) {
        setError("Subscription not found or already unsubscribed");
        return;
      }

      // Update subscription status
      await NewsletterSubscription.update(subscriptions[0].id, {
        status: "unsubscribed"
      });

      setIsUnsubscribed(true);
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setError("Failed to unsubscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {isUnsubscribed ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-600" />
            </div>
          )}
          <CardTitle>
            {isUnsubscribed ? "Successfully Unsubscribed" : "Unsubscribe Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {isUnsubscribed ? (
            <div>
              <p className="text-gray-600 mb-6">
                You've been unsubscribed from OpenCourts newsletters. We're sorry to see you go!
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You can always resubscribe in your profile settings if you change your mind.
              </p>
              <Link to={createPageUrl("Dashboard")}>
                <Button className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to OpenCourts
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-6">
                {error || "There was an error processing your unsubscribe request."}
              </p>
              <div className="space-y-3">
                <Link to={createPageUrl("Profile")}>
                  <Button variant="outline" className="w-full">
                    Manage Preferences in Profile
                  </Button>
                </Link>
                <Link to={createPageUrl("Support")}>
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}