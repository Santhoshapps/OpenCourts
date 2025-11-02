import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PaymentCancelled() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600">
              Your payment was cancelled. No charges were made to your account.
            </p>

            <div className="space-y-3">
              <Button 
                onClick={() => window.history.back()} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Need help? Contact support at support@opencourts.app
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}