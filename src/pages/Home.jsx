
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Clock, Zap, Shield, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import ImageSlider from '../components/home/ImageSlider';

export default function Home() {
  const handleGuestAccess = () => {
    // Redirect to guest dashboard
    window.location.href = createPageUrl('GuestDashboard');
  };

  const handleSignUp = async () => {
    try {
      await User.loginWithRedirect(window.location.origin + createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Sign up failed:", error);
    }
  };

  const handleSignIn = async () => {
    try {
      await User.loginWithRedirect(window.location.origin + createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: "Real-Time Court Availability",
      description: "See which courts are open right now and check in instantly when you arrive."
    },
    {
      icon: Users,
      title: "Smart Player Matching",
      description: "Connect with players at your skill level who are looking for opponents nearby."
    },
    {
      icon: Clock,
      title: "Weather-Powered Recommendations",
      description: "Get intelligent suggestions on the best times and places to play based on weather conditions."
    },
    {
      icon: Zap,
      title: "Favorite Courts & Parks",
      description: "Favorite your courts and parks while also don't miss out on courts that are open and available for you to scan through and plan your travel."
    },
    {
      icon: Shield,
      title: "Tournament Organization",
      description: "Create and join local tournaments with automated bracket management and scoring."
    },
    {
      icon: Smartphone,
      title: "Play Anywhere, Anytime",
      description: "Whether you're planning at home or finding a court on the go, our app is designed to work seamlessly on any device, ensuring you never miss a chance to play."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686998ee6a717e0ca083f355/204e70cb3_ChatGPTImageSep4202503_13_35AM.png"
            alt="Beautiful community park with tennis and pickleball courts"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-teal-900/40 to-cyan-900/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust3" 
                alt="OpenCourts Logo" 
                className="w-24 h-24 sm:w-32 sm:h-32"
              />
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
              Find Courts
              <span className="block text-emerald-400">Connect & Play</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-100 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Real-time court availability, intelligent player matching, weather insights, and tournament play. 
              <span className="block mt-2 font-semibold text-emerald-300">Never play alone again!</span>
            </p>
            
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleGuestAccess}
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Use as Guest
              </Button>
              
              <Button 
                onClick={handleSignUp}
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Users className="mr-2 h-5 w-5" />
                Sign Up for Free
              </Button>
              
              <Button 
                onClick={handleSignIn}
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-2 border-white/80 hover:border-white bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </div>

            <div className="flex justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">2,500+</div>
                    <div className="text-gray-700">Courts Mapped</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">15,000+</div>
                    <div className="text-gray-700">Active Players</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">50+</div>
                    <div className="text-gray-700">Cities Covered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Slider Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">See OpenCourts in Action</h2>
            <p className="text-xl text-gray-600">Experience the features that make finding and playing tennis effortless</p>
          </div>
          <ImageSlider />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Play More Tennis</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From finding available courts to organizing tournaments, OpenCourts provides all the tools you need for your tennis journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Tennis Experience?
          </h2>
          <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
            Join thousands of players who have discovered the easiest way to find courts, connect with others, and enjoy more tennis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGuestAccess}
              size="lg" 
              className="bg-white text-emerald-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Try as Guest - No Signup Required
            </Button>
            
            <Button 
              onClick={handleSignUp}
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200"
            >
              Sign Up Free Today
            </Button>
          </div>
          
          <p className="text-emerald-200 mt-6 text-sm">
            ✓ No credit card required ✓ Instant access ✓ Works on any device
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust3" 
                  alt="OpenCourts Logo" 
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold">OpenCourts</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The comprehensive platform for tennis and pickleball players to find courts, connect with others, and organize play.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to={createPageUrl('PrivacyPolicy')} className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to={createPageUrl('TermsOfService')} className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to={createPageUrl('Support')} className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to={createPageUrl('FAQ')} className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to={createPageUrl('AdminChat')} className="hover:text-white transition-colors">Live Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 OpenCourts. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

