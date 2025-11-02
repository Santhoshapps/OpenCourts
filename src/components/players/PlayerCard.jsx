
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, MessageSquare, Users, BrainCircuit, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react"; // Added RefreshCw
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Added Tooltip imports

export default function PlayerCard({ player, onMatchRequest, onGetTacticalAdvice, isAnalyzing, isDialogView = false }) {
  const getSkillLevel = () => {
    if (player.ntrp_rating) {
      return `NTRP ${player.ntrp_rating}`;
    }
    if (player.utr_rating) {
      return `UTR ${player.utr_rating}`;
    }
    return "Not rated";
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "playing":
        return "bg-yellow-100 text-yellow-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlayStyleIcon = (style) => {
    switch (style) {
      case "singles":
        return "1v1";
      case "doubles":
        return "2v2";
      case "both":
        return "Both";
      default:
        return "Any";
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${isDialogView ? 'border-none shadow-none' : ''}`}>
      <CardContent className="p-6 flex-grow"> {/* space-y-4 removed, new layout defines spacing */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">
              {player.display_name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-gray-900">{player.display_name}</h3>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Badge className={getAvailabilityColor(player.availability_status)}>
                    {player.availability_status}
                </Badge>
                <Badge variant="outline">
                    <Star className="w-3 h-3 mr-1" />
                    {getSkillLevel()}
                </Badge>
                <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {getPlayStyleIcon(player.preferred_play_style)}
                </Badge>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4 min-h-[40px] text-center sm:text-left">
            {player.bio || "This player hasn't added a bio yet."}
        </p>

        {player.distance !== null && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-4 justify-center sm:justify-start">
                <MapPin className="w-3 h-3" />
                <span>{player.distance.toFixed(1)} miles away</span>
            </div>
        )}

        {player.llm_summary && (
            <div className="border-t pt-4 space-y-4 mt-4"> {/* mt-4 added for spacing from previous elements */}
                <h4 className="font-semibold text-sm flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-emerald-600" /> AI Analysis</h4>
                <div className="space-y-2">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-green-700">STRENGTHS</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {player.llm_strengths?.map(s => <Badge key={s} variant="outline" className="text-green-700 border-green-200 bg-green-50">{s}</Badge>)}
                            </div>
                        </div>
                    </div>
                     <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-red-700">WEAKNESSES</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {player.llm_weaknesses?.map(w => <Badge key={w} variant="outline" className="text-red-700 border-red-200 bg-red-50">{w}</Badge>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {!isDialogView && (
             <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button 
                    onClick={() => onMatchRequest(player)} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={player.availability_status === "offline"}
                >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Match
                </Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                onClick={() => onGetTacticalAdvice(player)}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <BrainCircuit className="w-4 h-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Get AI Tactical Advice</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
