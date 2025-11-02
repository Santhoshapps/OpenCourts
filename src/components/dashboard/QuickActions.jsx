import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Play, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions({ playerProfile, isGuest, nearbyPlayers, availableCourts }) {
  const handleActionClick = (e) => {
    if (isGuest) {
      e.preventDefault();
      alert("Please sign up or log in to use this feature.");
    }
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Nearby Players */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Players Nearby
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {nearbyPlayers.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {nearbyPlayers.length === 1 ? "player" : "players"} within 25 miles
            </p>
            <Link to={createPageUrl("Players")} onClick={handleActionClick}>
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                Find Players
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Available Courts */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            Open Courts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {availableCourts.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              courts with availability
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" disabled>
              <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Quick Play
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {isGuest ? 'N/A' : '0'}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              unread messages
            </p>
            <Link to={createPageUrl("Messages")} onClick={handleActionClick}>
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                View Messages
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}