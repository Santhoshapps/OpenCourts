import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Zap, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";

export default function TacticalAdviceModal({ advice, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Tactical Game Plan
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Key Matchup Dynamic
            </h4>
            <p className="text-sm text-gray-700 italic">{advice.key_matchup}</p>
          </div>

          <div className="space-y-3">
            {advice.recommendations.map((rec, index) => (
              <div key={index} className="border-l-2 pl-3" style={{borderColor: index % 2 === 0 ? '#10B981' : '#F59E0B'}}>
                <h5 className="font-semibold">{rec.title}</h5>
                <p className="text-sm text-gray-600">{rec.details}</p>
              </div>
            ))}
          </div>

          <Button onClick={onClose} className="w-full mt-4">
            Got it, Let's Play!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}