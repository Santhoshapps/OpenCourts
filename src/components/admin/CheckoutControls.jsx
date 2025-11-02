import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, LogOut, Clock, RefreshCw } from "lucide-react";
import { checkoutEveryone } from "@/api/functions";
import { autoCheckoutStale } from "@/api/functions";

export default function CheckoutControls({ onRefresh }) {
  const [isCheckingOutAll, setIsCheckingOutAll] = useState(false);
  const [isAutoCheckout, setIsAutoCheckout] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleCheckoutEveryone = async () => {
    if (!confirm("Are you sure you want to check out ALL players from ALL courts? This cannot be undone.")) {
      return;
    }

    setIsCheckingOutAll(true);
    setLastResult(null);
    
    try {
      const response = await checkoutEveryone({});
      
      if (response.data.success) {
        setLastResult({
          type: 'success',
          message: response.data.message,
          count: response.data.checkedOutCount
        });
        
        // Refresh the parent component if callback provided
        if (onRefresh) {
          setTimeout(onRefresh, 1000);
        }
      } else {
        setLastResult({
          type: 'error',
          message: response.data.error || 'Failed to check out players'
        });
      }
    } catch (error) {
      console.error("Error checking out everyone:", error);
      setLastResult({
        type: 'error',
        message: 'Network error - please try again'
      });
    } finally {
      setIsCheckingOutAll(false);
    }
  };

  const handleAutoCheckout = async () => {
    setIsAutoCheckout(true);
    setLastResult(null);
    
    try {
      const response = await autoCheckoutStale({});
      
      if (response.data.success) {
        setLastResult({
          type: 'success',
          message: response.data.message,
          count: response.data.checkedOutCount
        });
        
        // Refresh the parent component if callback provided
        if (onRefresh) {
          setTimeout(onRefresh, 1000);
        }
      } else {
        setLastResult({
          type: 'error',
          message: response.data.error || 'Failed to auto-checkout stale sessions'
        });
      }
    } catch (error) {
      console.error("Error in auto-checkout:", error);
      setLastResult({
        type: 'error',
        message: 'Network error - please try again'
      });
    } finally {
      setIsAutoCheckout(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogOut className="w-5 h-5" />
          Court Checkout Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastResult && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            lastResult.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {lastResult.type === 'success' ? (
              <Badge className="bg-green-100 text-green-800">
                {lastResult.count || 0} checked out
              </Badge>
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-sm">{lastResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Manual Checkout</h3>
            <Button 
              onClick={handleCheckoutEveryone}
              disabled={isCheckingOutAll}
              variant="destructive"
              className="w-full"
              size="sm"
            >
              {isCheckingOutAll ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking Out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Checkout Everyone
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500">
              Immediately check out all players from all courts
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Auto Cleanup</h3>
            <Button 
              onClick={handleAutoCheckout}
              disabled={isAutoCheckout}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {isAutoCheckout ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Cleanup Stale Sessions
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500">
              Auto-checkout players who've been playing for over 90 minutes
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800 text-sm">Important Notes</span>
          </div>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• "Checkout Everyone" affects all active players immediately</li>
            <li>• "Cleanup Stale Sessions" only affects sessions over 90 minutes old</li>
            <li>• Both actions are permanent and cannot be undone</li>
            <li>• Use these tools responsibly to maintain accurate court availability</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}