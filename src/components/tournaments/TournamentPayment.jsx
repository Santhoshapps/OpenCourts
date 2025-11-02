import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, DollarSign } from "lucide-react";
import CheckoutButton from "../payments/CheckoutButton";

export default function TournamentPayment({ 
  tournament, 
  player, 
  entryFee = 25, // Default $25 entry fee
  onPaymentSuccess 
}) {
  const paymentItems = [
    {
      name: `${tournament.name} - Tournament Entry`,
      description: `Entry fee for ${tournament.name} tournament (NTRP ${tournament.ntrp_level})`,
      amount: entryFee,
      quantity: 1
    }
  ];

  const paymentMetadata = {
    tournament_id: tournament.id,
    player_id: player.id,
    payment_type: 'tournament_entry',
    tournament_name: tournament.name,
    ntrp_level: tournament.ntrp_level.toString()
  };

  const successUrl = `${window.location.origin}/tournaments/${tournament.id}?payment=success`;
  const cancelUrl = `${window.location.origin}/tournaments/${tournament.id}?payment=cancelled`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600" />
          Tournament Entry Fee
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Tournament Entry</span>
            <Badge variant="outline">NTRP {tournament.ntrp_level}</Badge>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {entryFee.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-2">This entry fee covers:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Tournament participation</li>
            <li>Court time allocation</li>
            <li>Prize pool contribution</li>
            <li>Tournament organization</li>
          </ul>
        </div>

        <CheckoutButton
          items={paymentItems}
          metadata={paymentMetadata}
          successUrl={successUrl}
          cancelUrl={cancelUrl}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Pay Entry Fee (${entryFee})
        </CheckoutButton>

        <p className="text-xs text-gray-500 text-center">
          Secure payment powered by Stripe. You'll be redirected to complete your payment.
        </p>
      </CardContent>
    </Card>
  );
}