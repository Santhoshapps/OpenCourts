import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, AlertTriangle, Mail } from "lucide-react";
import { MunicipalityAdmin } from "@/api/entities";
import { User } from "@/api/entities";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RedeemAccessCode({ onAccessGranted }) {
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) return;

    setIsRedeeming(true);
    setError(null);

    try {
      const user = await User.me();
      
      // Find the pending admin record with this code and matching email
      const pendingAdmins = await MunicipalityAdmin.filter({ 
        access_code: code.trim().toUpperCase(), 
        status: 'pending_code',
        invited_email: user.email
      });

      if (pendingAdmins.length === 0) {
        setError("Invalid access code or this code was not sent to your email address. Please check the code and ensure you're logged in with the correct account.");
        setIsRedeeming(false);
        return;
      }

      const adminRecord = pendingAdmins[0];
      
      // Check if the code has expired
      if (adminRecord.expires_at && new Date(adminRecord.expires_at) < new Date()) {
        setError("This access code has expired. Please request a new invitation from your site administrator.");
        setIsRedeeming(false);
        return;
      }
      
      // Activate the admin role
      await MunicipalityAdmin.update(adminRecord.id, {
        user_id: user.id,
        status: 'active',
        access_code: null // Invalidate the code after use
      });

      // Notify parent component that access has been granted
      onAccessGranted();

    } catch (err) {
      console.error("Failed to redeem code:", err);
      setError("An error occurred while redeeming the code. Please try again or contact support.");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-emerald-600" />
            Redeem Town Admin Access
        </CardTitle>
        <CardDescription>
            Enter the access code that was sent to your email address to gain administrative privileges for your municipality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Check Your Email</h4>
              <p className="text-sm text-blue-700 mt-1">
                If you were invited to be a Town Administrator, you should have received an email with an 8-character access code. 
                Make sure you're logged in with the same email address that received the invitation.
              </p>
            </div>
          </div>
        </div>

        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Redemption Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="access-code">Access Code</Label>
                <Input 
                    id="access-code" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your 8-character code"
                    className="font-mono tracking-widest text-center text-lg"
                    maxLength={8}
                />
                <p className="text-sm text-gray-600 mt-1">Enter the code exactly as it appears in your email</p>
            </div>
            <Button type="submit" disabled={isRedeeming || !code} className="w-full">
                {isRedeeming ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying Access Code...
                    </>
                ) : (
                    "Gain Admin Access"
                )}
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}