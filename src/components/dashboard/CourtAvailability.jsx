import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, PlayCircle } from 'lucide-react';

export default function CourtAvailability({ court, activeSessions, blockedCourtNumbers = [] }) {
  const occupiedByPlayer = new Set(
    activeSessions
      .filter(session => session.court_id === court.id)
      .map(session => session.court_number)
  );

  const allCourtNumbers = Array.from({ length: court.total_courts }, (_, i) => i + 1);

  const getCourtStatus = (number) => {
    if (blockedCourtNumbers.includes(number)) {
      return { status: 'Reserved', color: 'bg-orange-100 text-orange-800', icon: <Lock className="w-4 h-4 text-orange-600" /> };
    }
    if (occupiedByPlayer.has(number)) {
      return { status: 'In Use', color: 'bg-red-100 text-red-800', icon: <PlayCircle className="w-4 h-4 text-red-600" /> };
    }
    return { status: 'Available', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4 text-green-600" /> };
  };

  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <h4 className="text-md font-semibold mb-3 text-center text-gray-800">Court Status</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {allCourtNumbers.map(number => {
            const { status, color, icon } = getCourtStatus(number);
            return (
              <div key={number} className={`p-3 rounded-lg flex flex-col items-center justify-center text-center ${color}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {icon}
                  <span className="font-bold text-sm">Court {number}</span>
                </div>
                <Badge variant="outline" className="text-xs bg-white">{status}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}