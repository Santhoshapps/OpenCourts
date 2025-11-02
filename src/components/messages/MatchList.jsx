import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Clock, MessageSquare, Edit } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchList({ 
  matches, 
  selectedMatch, 
  onSelectMatch, 
  getOtherPlayer, 
  getUnreadCount,
  handleMatchAction,
  isLoading,
  currentPlayerId,
  onLeaveFeedback
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMatchTypeDisplay = (type) => {
    switch (type) {
      case "singles":
        return "Singles";
      case "doubles_seeking_pair":
        return "Doubles (need 2)";
      case "doubles_complete":
        return "Doubles";
      default:
        return "Match";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {matches.length === 0 ? (
        <div className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No matches yet</p>
          <p className="text-sm text-gray-500">Start by finding players to connect with</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {matches.map((match) => {
            const otherPlayer = getOtherPlayer(match);
            const unreadCount = getUnreadCount(match);
            
            return (
              <div
                key={match.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedMatch?.id === match.id 
                    ? "bg-emerald-50 border-2 border-emerald-200" 
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
                onClick={() => onSelectMatch(match)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {otherPlayer?.display_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {otherPlayer?.display_name || 'Unknown Player'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getMatchTypeDisplay(match.match_type)}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Badge className="bg-emerald-600 text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(match.scheduled_time), "MMM d, h:mm a")}
                    </span>
                  </div>
                  
                  {match.status === "accepted" && (
                     <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMatchAction(match.id, "completed");
                        }}
                        className="h-7 px-2"
                      >
                        Mark as Completed
                      </Button>
                  )}
                  {match.status === "completed" && !match.feedbackGiven && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onLeaveFeedback(match);
                        }}
                        className="h-7 px-2 text-emerald-600 hover:bg-emerald-50"
                      >
                          <Edit className="w-3 h-3 mr-1" />
                          Leave Feedback
                      </Button>
                  )}
                  {match.status === "pending" && match.player2_id === currentPlayerId && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMatchAction(match.id, "accepted");
                        }}
                        className="h-7 px-2 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMatchAction(match.id, "declined");
                        }}
                        className="h-7 px-2 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}