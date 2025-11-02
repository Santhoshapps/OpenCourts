import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PaymentSuccess() {
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get session_id from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      // You could fetch session details from your backend if needed
      setSessionDetails({
        sessionId,
        // Add other details as needed
      });
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600">
              Your payment has been processed successfully. You should receive a confirmation email shortly.
            </p>

            {sessionDetails?.sessionId && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Payment ID: <code className="text-xs">{sessionDetails.sessionId.slice(-12)}</code>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link to={createPageUrl("Tournaments")}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Trophy className="w-4 h-4 mr-2" />
                  View My Tournaments
                </Button>
              </Link>
              
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="outline" className="w-full">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Questions about your payment? Contact support at support@opencourts.app
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}