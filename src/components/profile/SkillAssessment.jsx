import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Target, TrendingUp } from "lucide-react";

export default function SkillAssessment({ ntrpRating, utrRating }) {
  const getNTRPDescription = (rating) => {
    const descriptions = {
      1.0: "New to tennis",
      1.5: "Limited playing experience",
      2.0: "Needs work on consistency",
      2.5: "Learning basic strokes",
      3.0: "Fairly consistent with medium pace",
      3.5: "Good consistency and variety",
      4.0: "Dependable strokes and strategy",
      4.5: "Advanced with good power",
      5.0: "Excellent all-around game",
      5.5: "Outstanding player",
      6.0: "Professional level"
    };
    return descriptions[rating] || "Not assessed";
  };

  const getUTRLevel = (rating) => {
    if (rating >= 12) return "Professional";
    if (rating >= 10) return "College Division I";
    if (rating >= 8) return "High School Varsity";
    if (rating >= 6) return "Advanced Club";
    if (rating >= 4) return "Intermediate Club";
    if (rating >= 2) return "Beginner Club";
    return "Recreational";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Skill Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ntrpRating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">NTRP {ntrpRating}</span>
            </div>
            <p className="text-sm text-gray-600">
              {getNTRPDescription(ntrpRating)}
            </p>
          </div>
        )}

        {utrRating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">UTR {utrRating}</span>
            </div>
            <Badge variant="outline">
              {getUTRLevel(utrRating)}
            </Badge>
          </div>
        )}

        {!ntrpRating && !utrRating && (
          <div className="text-center py-4">
            <p className="text-gray-500">Complete your skill assessment to get better matches</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}