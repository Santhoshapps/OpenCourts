import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { AlertTriangle, CheckCircle, FileText, Shield, MapPin } from 'lucide-react';

export default function ConsentPage() {
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedLocation, setAgreedLocation] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const canContinue = agreedTerms && agreedPrivacy && agreedLocation;

    const handleContinue = async () => {
        if (!canContinue) return;
        
        setIsProcessing(true);
        setError(null);
        
        try {
            // Update user's consent information
            const CURRENT_CONSENT_VERSION = "1.0";
            await User.updateMyUserData({ 
                consent_date: new Date().toISOString(),
                consent_version: CURRENT_CONSENT_VERSION,
                has_consented: true
            });
            
            console.log("User consent recorded successfully");
            
            // Redirect to dashboard
            window.location.href = createPageUrl('Dashboard');
        } catch (error) {
            console.error("Failed to save consent:", error);
            setError("Could not process your consent at this time. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleDecline = async () => {
        try {
            // Log the user out if they decline
            await User.logout();
            window.location.href = createPageUrl('Home');
        } catch (error) {
            console.error("Error during logout:", error);
            window.location.href = createPageUrl('Home');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
                <div className="text-center mb-8">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust2" alt="OpenCourts Logo" className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to OpenCourts!</h1>
                    <p className="text-gray-600">Before you start, please review and agree to our terms and policies.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                <div className="space-y-6 mb-8">
                    {/* Terms of Service */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="terms" 
                                checked={agreedTerms} 
                                onCheckedChange={setAgreedTerms} 
                                className="mt-1" 
                            />
                            <div className="flex-1">
                                <Label htmlFor="terms" className="text-sm font-semibold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                    Terms of Service Agreement
                                </Label>
                                <p className="text-xs text-gray-600 mt-1 mb-3">
                                    I have read and agree to be bound by the OpenCourts Terms of Service, including dispute resolution, limitation of liability, and user conduct requirements.
                                </p>
                                <Link 
                                    to={createPageUrl('TermsOfService')} 
                                    target="_blank" 
                                    className="text-emerald-600 hover:underline text-sm font-medium"
                                >
                                    → Read Full Terms of Service
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    {/* Privacy Policy */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="privacy" 
                                checked={agreedPrivacy} 
                                onCheckedChange={setAgreedPrivacy} 
                                className="mt-1" 
                            />
                            <div className="flex-1">
                                <Label htmlFor="privacy" className="text-sm font-semibold flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    Privacy Policy Acknowledgment
                                </Label>
                                <p className="text-xs text-gray-600 mt-1 mb-3">
                                    I acknowledge and understand how OpenCourts collects, uses, and protects my personal information, including profile data and usage analytics.
                                </p>
                                <Link 
                                    to={createPageUrl('PrivacyPolicy')} 
                                    target="_blank" 
                                    className="text-emerald-600 hover:underline text-sm font-medium"
                                >
                                    → Read Full Privacy Policy
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Location Data Consent */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="location" 
                                checked={agreedLocation} 
                                onCheckedChange={setAgreedLocation} 
                                className="mt-1" 
                            />
                            <div className="flex-1">
                                <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-orange-600" />
                                    Location Data Consent (Required)
                                </Label>
                                <p className="text-xs text-gray-700 mt-1">
                                    <strong>Essential Feature:</strong> I consent to OpenCourts using my device's location data to provide core functionality including finding nearby courts, connecting with local players, and automatic court check-ins. Location data is essential for the app to function properly.
                                </p>
                                <div className="mt-2 text-xs text-gray-600">
                                    <p>✓ Your exact location is never shared with other users</p>
                                    <p>✓ Only proximity information is shown (e.g., "5 miles away")</p>
                                    <p>✓ You can disable location services anytime in device settings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button 
                        onClick={handleContinue} 
                        disabled={!canContinue || isProcessing}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white disabled:opacity-50 py-3"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                I Agree - Start Using OpenCourts
                            </>
                        )}
                    </Button>
                    
                    <Button 
                        onClick={handleDecline} 
                        variant="ghost" 
                        className="w-full text-gray-600 hover:bg-gray-100"
                        disabled={isProcessing}
                    >
                        I Do Not Agree - Exit App
                    </Button>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        <strong>Note:</strong> You can manage your data preferences, review these terms, or delete your account at any time in Profile Settings. We will notify you of any material changes to these terms.
                    </p>
                </div>
            </div>
        </div>
    );
}