
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Shield, RefreshCw, Lock, Eye, Clock, Wifi, AlertTriangle } from "lucide-react";

export default function LocationPermission({ onRetry, error }) {

  const getErrorMessage = () => {
    if (!error || !error.type) {
      return {
        title: "Location Access Required",
        message: "OpenCourts needs your location to find nearby courts and connect you with players. The app cannot function properly without it."
      };
    }
    switch (error.type) {
      case 'denied':
        return {
          title: "Location Access Denied",
          message: "You've denied location access. Please enable it in your browser settings (often near the address bar) and then click 'Try Again'."
        };
      case 'timeout':
        return {
          title: "Location Timed Out",
          message: "We couldn't get your location in time. This can happen with a weak GPS signal. Try moving outdoors and retrying."
        };
      case 'unavailable':
        return {
          title: "Location Unavailable",
          message: "Your device is reporting that your location is unavailable. Please check your device's main location/GPS settings to ensure they are enabled."
        };
       case 'unsupported':
        return {
            title: "Browser Not Supported",
            message: "Your browser doesn't support the required location services. Please try using a modern browser like Chrome, Safari, or Firefox."
        };
      default:
        return {
          title: "Location Error",
          message: error.message || "An unknown error occurred. Please try refreshing the page or using a different browser."
        };
    }
  };

  const { title, message } = getErrorMessage();

  return (
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">{title}</CardTitle>
          <CardDescription className="text-gray-700">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="text-center">
             <Button 
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <p className="font-semibold text-blue-800 text-sm">Your Privacy is Protected</p>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Your exact location is never shared with other players.</li>
              <li>• Location is only used to find nearby courts and for check-ins.</li>
            </ul>
          </div>

        </CardContent>
      </Card>
  );
}
