import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, Check, Twitter, Mail, Share2, Loader2, MapPin, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function ReferralProgram() {
  const [user, setUser] = useState(null);
  const [referralLink, setReferralLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isBlurbCopied, setIsBlurbCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserAndGenerateLink = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        // Generate referral code if user doesn't have one
        let referralCode = currentUser.referral_code;
        if (!referralCode) {
          // Generate a unique 8-character code
          referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          await User.updateMyUserData({ referral_code: referralCode });
        }

        // Create referral link with the user's unique code
        const baseUrl = window.location.origin;
        const referralUrl = `${baseUrl}${createPageUrl('Home')}?ref=${referralCode}`;
        setReferralLink(referralUrl);
        
      } catch (error) {
        console.error("Error loading user or generating referral code:", error);
        setUser(null);
      }
      setIsLoading(false);
    };

    loadUserAndGenerateLink();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = createPageUrl('Home');
    }
  }, [isLoading, user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  // OpenCourts-specific share message
  const shareBlurb = `I've been using OpenCourts to find tennis and pickleball courts near me, connect with other players, and never play alone. It shows real-time court availability, helps me check into courts automatically, and I can join tournaments and teams in my area. The app makes it so much easier to stay active and meet fellow players. Try it: ${referralLink}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareBlurb)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent("Check out this awesome tennis & pickleball app!")}&body=${encodeURIComponent(shareBlurb)}`;

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Invite Friends to Play</h1>
              <p className="text-slate-600">Share OpenCourts and help grow the tennis & pickleball community.</p>
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-md border-emerald-200/50 mb-6">
            <CardHeader>
              <CardTitle>Your Unique Referral Link</CardTitle>
              <CardDescription>
                This link is unique to you. When friends sign up using it, they'll join the OpenCourts community and discover courts and players near them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">Your referral code: <span className="font-mono bg-slate-100 px-2 py-1 rounded text-emerald-700 font-bold">{user.referral_code}</span></p>
              </div>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="bg-slate-50 font-mono text-sm" />
                <Button onClick={copyToClipboard} variant="outline" className="w-28">
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                  <Button asChild variant="outline">
                      <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                          <Twitter className="w-4 h-4 mr-2" />
                          Share on X
                      </a>
                  </Button>
                  <Button asChild variant="outline">
                      <a href={mailUrl} target="_blank" rel="noopener noreferrer">
                          <Mail className="w-4 h-4 mr-2" />
                          Share via Email
                      </a>
                  </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Description Card */}
          <Card className="bg-white/80 backdrop-blur-md border-emerald-200/50 mb-8">
            <CardHeader>
              <CardTitle>Share This Message</CardTitle>
              <CardDescription>
                Copy this text to tell your friends about OpenCourts with your referral link included.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg border relative">
                <p className="text-sm text-slate-700 leading-relaxed">{shareBlurb}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(shareBlurb);
                    setIsBlurbCopied(true);
                    setTimeout(() => setIsBlurbCopied(false), 2000);
                  }}
                >
                  {isBlurbCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">How It Works</h3>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <Share2 className="w-8 h-8 text-emerald-700" />
                    </div>
                    <h4 className="font-semibold text-slate-700">1. Share Your Link</h4>
                    <p className="text-sm text-slate-600">Copy your unique referral link or use the social buttons to share with tennis and pickleball friends.</p>
                </div>
                 <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-emerald-700" />
                    </div>
                    <h4 className="font-semibold text-slate-700">2. They Join</h4>
                    <p className="text-sm text-slate-600">Your friend uses your link to discover OpenCourts and creates their free player profile.</p>
                </div>
                 <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-emerald-700" />
                    </div>
                    <h4 className="font-semibold text-slate-700">3. Find & Play Together</h4>
                    <p className="text-sm text-slate-600">You both get more players to connect with, more courts to discover, and never have to play alone.</p>
                </div>
            </div>
          </div>

          {/* Benefits Section */}
          <Card className="bg-white/80 backdrop-blur-md border-emerald-200/50 mt-8">
            <CardHeader>
              <CardTitle>Why Your Friends Will Love OpenCourts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Find Courts Nearby</h4>
                    <p className="text-sm text-slate-600">Discover tennis and pickleball courts with real-time availability</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Connect with Players</h4>
                    <p className="text-sm text-slate-600">Match with players of similar skill levels in your area</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-emerald-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Join Tournaments</h4>
                    <p className="text-sm text-slate-600">Participate in local ladder tournaments and team competitions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Easy Check-ins</h4>
                    <p className="text-sm text-slate-600">Automatically check into courts and see who's playing</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}