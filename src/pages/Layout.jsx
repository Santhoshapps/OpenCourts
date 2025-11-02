

import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Users, MessageSquare, User, LogOut, Home, Shield, Gift, FileText, Scale, Mail, HelpCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User as UserEntity } from "@/api/entities";
import "leaflet/dist/leaflet.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MunicipalityAdmin } from "@/api/entities";
import ErrorBoundary from "./components/ErrorBoundary";

const navigationItems = [
  {
    title: "Courts",
    url: createPageUrl("Dashboard"),
    icon: MapPin,
    shortTitle: "Courts"
  },
  {
    title: "Teams",
    url: createPageUrl("Teams"),
    icon: Shield,
    shortTitle: "Teams"
  },
  {
    title: "Tournaments",
    url: createPageUrl("PickleballTournaments"),
    icon: Trophy,
    shortTitle: "Tournaments"
  },
  {
    title: "Players",
    url: createPageUrl("Players"),
    icon: Users,
    shortTitle: "Players"
  },
  {
    title: "Messages",
    url: createPageUrl("Messages"),
    icon: MessageSquare,
    shortTitle: "Messages"
  },
  {
    title: "Referral",
    url: createPageUrl("Referral"),
    icon: Gift,
    shortTitle: "Invite"
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: User,
    shortTitle: "Profile"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasValidConsent, setHasValidConsent] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Enhanced global error handlers
    const onErr = (e) => {
      console.error("Global runtime error:", e.error || e.message);
      
      // Handle specific error types
      if (e.error?.message?.includes('Network Error') || 
          e.error?.message?.includes('ERR_NETWORK')) {
        console.log("Network error caught globally");
        setNetworkError("Connection lost. Please check your internet and try again.");
      }
    };
    
    const onRej = (e) => {
      console.error("Unhandled promise rejection:", e.reason);
      
      // Handle common network errors globally
      if (e.reason?.message?.includes('Network Error') || 
          e.reason?.message?.includes('ERR_NETWORK') ||
          e.reason?.code === 'NETWORK_ERROR' ||
          e.reason?.name === 'AxiosError') {
        console.log("Network error detected globally - user may be offline");
        setNetworkError("Network connection lost. Please check your internet connection.");
        
        // Check online status
        if (!navigator.onLine) {
          console.log("User is offline");
          setNetworkError("You appear to be offline. Please check your internet connection.");
        }
      }
      
      // Prevent the error from crashing the app
      e.preventDefault();
    };
    
    // Network status change handlers
    const onOnline = () => {
      console.log("User came back online");
      setNetworkError(null);
      // Try to reload user data when coming back online if a network error was present
      if (networkError) {
        window.location.reload();
      }
    };
    
    const onOffline = () => {
      console.log("User went offline");
      setNetworkError("You are currently offline. Some features may not work properly.");
    };
    
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [networkError]);

  // Enhanced meta tags setup
  useEffect(() => {
    // Set page title
    document.title = "OpenCourts - Find Tennis & Pickleball Courts Near You";
    
    const updateOrCreateMetaTag = (property, content, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Open Graph tags
    updateOrCreateMetaTag('og:title', 'OpenCourts - Find Tennis & Pickleball Courts Near You');
    updateOrCreateMetaTag('og:description', 'Real-time court availability, intelligent player matching, weather insights, and tournament play. Never play alone again!');
    updateOrCreateMetaTag('og:image', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust3');
    updateOrCreateMetaTag('og:url', window.location.href);
    updateOrCreateMetaTag('og:type', 'website');
    updateOrCreateMetaTag('og:site_name', 'OpenCourts');
    
    // Twitter Card tags
    updateOrCreateMetaTag('twitter:card', 'summary_large_image', false);
    updateOrCreateMetaTag('twitter:title', 'OpenCourts - Find Tennis & Pickleball Courts Near You', false);
    updateOrCreateMetaTag('twitter:description', 'Real-time court availability, intelligent player matching, weather insights, and tournament play. Never play alone again!', false);
    updateOrCreateMetaTag('twitter:image', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust3', false);
    
    // Standard meta tags
    updateOrCreateMetaTag('description', 'Find tennis and pickleball courts near you with real-time availability. Connect with players, join tournaments, and never play alone. The complete tennis and pickleball companion app.', false);
    updateOrCreateMetaTag('keywords', 'tennis courts, pickleball courts, tennis players, court availability, tennis app, pickleball app', false);
    
  }, [location.pathname]);

  // Memoize checkUserConsent to avoid dependency issues
  const checkUserConsent = useCallback(async (userData) => {
    try {
      // Check if user has consented and when
      const consentDate = userData.consent_date;
      const consentVersion = userData.consent_version;
      
      // Current version of terms
      const CURRENT_CONSENT_VERSION = "1.0";
      
      if (consentDate && consentVersion === CURRENT_CONSENT_VERSION) {
        // Check if consent is still valid (within 1 year)
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const consentDateObj = new Date(consentDate);
        
        if (consentDateObj > oneYearAgo) {
          setHasValidConsent(true);
          return;
        }
      }
      
      // No valid consent found
      setHasValidConsent(false);
    } catch (error) {
      console.error("Error checking consent:", error);
      setHasValidConsent(false);
    }
  }, []); // Dependencies: empty as setHasValidConsent is stable

  // Enhanced loadUser with comprehensive error handling and retry logic
  const loadUser = useCallback(async () => {
    try {
      const userData = await UserEntity.me();
      setUser(userData);
      
      if (userData) {
        await checkUserConsent(userData);
      } else {
        setHasValidConsent(false);
      }
      
      // Clear network error on successful load
      setNetworkError(null);
      setRetryCount(0);
    } catch (error) {
      console.log("User authentication error:", error);
      
      // Enhanced error handling for network issues
      if (error.message?.includes('Network Error') || 
          error.code === 'NETWORK_ERROR' ||
          error.name === 'AxiosError' ||
          !navigator.onLine) {
        setNetworkError("Unable to connect to OpenCourts servers. Please check your internet connection.");
        setUser(null);
        setHasValidConsent(false);
      } else {
        setUser(null);
        setHasValidConsent(false);
      }
    } finally {
      setIsCheckingAuth(false);
      setIsCheckingConsent(false);
    }
  }, [checkUserConsent]);

  useEffect(() => {
    // Wrap loadUser call in try-catch to prevent unhandled rejections
    const initializeAuth = async () => {
      try {
        await loadUser();
      } catch (error) {
        console.error("Failed to initialize authentication:", error);
        setNetworkError("Failed to initialize the app. Please refresh the page.");
        setIsCheckingAuth(false);
        setIsCheckingConsent(false);
      }
    };
    
    initializeAuth();
  }, [loadUser]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setNetworkError(null);
    setIsCheckingAuth(true);
    setIsCheckingConsent(true);
    loadUser();
  };
  
  const handleLogin = async () => {
    try {
      // Use window.location.origin to ensure the correct domain is always used for the redirect.
      await UserEntity.loginWithRedirect(window.location.origin + createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Login failed:", error);
      if (error.message?.includes('Network Error') || !navigator.onLine) {
        setNetworkError("Unable to login. Please check your internet connection and try again.");
      }
    }
  };
  
  const handleLogout = async () => {
    try {
      await UserEntity.logout();
      window.location.href = createPageUrl("Home");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect even if logout fails
      window.location.href = createPageUrl("Home");
    }
  };

  // Always show the Home page without layout wrapper
  if (currentPageName === "Home") {
    return children;
  }

  // Show legal pages and consent without layout wrapper and login requirement
  const publicPages = ["GuestDashboard", "Town", "PrivacyPolicy", "TermsOfService", "Consent", "JoinTeam", "Support", "AdminChat", "FAQ"]; // Added AdminChat and FAQ to public pages
  if (publicPages.includes(currentPageName)) {
    return children;
  }

  // Show network error screen if there's a persistent network issue and user is not authenticated
  if (networkError && !user && !isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Problem</h1>
            <p className="text-gray-600 mb-6 text-sm">{networkError}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                Try Again {retryCount > 0 && `(${retryCount + 1})`}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Troubleshooting:</strong> Check your internet connection, try a different network, or contact your network administrator if the problem persists.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication and consent
  if (isCheckingAuth || isCheckingConsent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {networkError && (
            <p className="text-red-600 text-sm mt-2">{networkError}</p>
          )}
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
          <div className="text-center">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust2" alt="OpenCourts Logo" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">OpenCourts</h1>
            <p className="text-gray-600 mb-6 text-sm">Find courts, connect with players, and never play alone.</p>
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2 rounded-xl font-semibold transition-all duration-200"
              disabled={!!networkError}
            >
              {networkError ? 'Connection Problem' : 'Sign In / Sign Up'}
            </Button>
            {networkError && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-800">{networkError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="mt-2 w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
            <div className="mt-4">
              <Link to={createPageUrl("Home")}>
                <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 text-sm">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated but doesn't have valid consent, redirect to consent page
  if (user && !hasValidConsent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full">
          <div className="text-center mb-6">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust2" alt="OpenCourts Logo" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms Update Required</h1>
            <p className="text-gray-600">Before continuing, please review and accept our updated terms and privacy policy.</p>
          </div>
          <div className="text-center">
            <Link to={createPageUrl("Consent")}>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                Review Terms & Continue
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isActiveRoute = (item) => {
    // Handle TeamDetails page highlighting the Teams nav item
    if (item.title === 'Teams' && currentPageName === "TeamDetails") {
        return true;
    }
    // Highlight "Courts" if on Dashboard, regardless of query params
    if (item.title === 'Courts' && location.pathname === createPageUrl("Dashboard")) {
        return true;
    }
    return location.pathname === item.url;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
        {/* Mobile Header - this is hidden on large screens (lg) and up */}
        <header className="bg-white border-b border-gray-200 lg:hidden sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust2" alt="OpenCourts Logo" className="w-8 h-8" />
              <h1 className="text-lg font-bold text-gray-900">OpenCourts</h1>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" side="bottom" align="end">
                <div className="px-2 py-1.5">
                  <p className="font-medium text-sm">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">Ready to play</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Messages")} className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </Link>
                </DropdownMenuItem>
                {/* Admin link now visible to all */}
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Admin")} className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Help & Legal Section */}
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("FAQ")} className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & FAQ</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("PrivacyPolicy")} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Privacy Policy</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("TermsOfService")} className="cursor-pointer">
                    <Scale className="mr-2 h-4 w-4" />
                    <span>Terms of Service</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex">
          {/* Desktop Sidebar - this is hidden by default and shown on large screens (lg) and up */}
          <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
            <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust2" alt="OpenCourts Logo" className="w-12 h-12" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">OpenCourts</h1>
                  <p className="text-sm text-gray-500">Find & Play</p>
                </div>
              </Link>
              
              <nav className="flex-1 px-4 py-6">
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isActiveRoute(item)
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </nav>
              <div className="px-4 py-4 border-t border-gray-200">
                 {/* Help & FAQ link */}
                  <Link
                      to={createPageUrl("FAQ")}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mt-2 ${
                        location.pathname === createPageUrl("FAQ")
                          ? "bg-blue-100 text-blue-800"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <HelpCircle className="w-5 h-5" />
                      <span className="font-medium">Help & FAQ</span>
                    </Link>
                    
                 {/* Admin link now visible to all */}
                  <Link
                      to={createPageUrl("Admin")}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mt-2 ${
                        location.pathname === createPageUrl("Admin")
                          ? "bg-blue-100 text-blue-800"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Admin Panel</span>
                    </Link>
                    
                  {/* Support Chat link */}
                  <Link
                      to={createPageUrl("AdminChat")}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mt-2 ${
                        location.pathname === createPageUrl("AdminChat")
                          ? "bg-emerald-100 text-emerald-800"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-medium">Live Support</span>
                    </Link>
                    
                  {/* Support link */}
                  <Link
                      to={createPageUrl("Support")}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mt-2 ${
                        location.pathname === createPageUrl("Support")
                          ? "bg-emerald-100 text-emerald-800"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">Contact Form</span>
                    </Link>
              </div>

              <div className="px-6 py-4 border-t border-gray-200">
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full text-left rounded-lg p-2 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user?.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {user?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">Ready to play</p>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                      <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Profile")} className="cursor-pointer">
                              <User className="mr-2 h-4 w-4" />
                              <span>Profile</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {/* Help & Legal Documents Section */}
                      <DropdownMenuItem asChild>
                          <Link to={createPageUrl("FAQ")} className="cursor-pointer">
                              <HelpCircle className="mr-2 h-4 w-4" />
                              <span>Help & FAQ</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                          <Link to={createPageUrl("PrivacyPolicy")} className="cursor-pointer">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Privacy Policy</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                          <Link to={createPageUrl("TermsOfService")} className="cursor-pointer">
                              <Scale className="mr-2 h-4 w-4" />
                              <span>Terms of Service</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </aside>

          {/* Main Content - the lg:ml-64 class adds a left margin on desktop to avoid being covered by the sidebar */}
          <main className="flex-1 lg:ml-64 min-h-screen">
            {/* GLOBAL NETWORK ERROR BANNER */}
            {networkError && user && (
              <div className="bg-red-600 text-white p-3 text-center text-sm sticky top-0 z-50 lg:relative">
                <span>{networkError}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.reload()} 
                  className="ml-4 hover:bg-red-700 focus:bg-red-700"
                >
                  Reload
                </Button>
              </div>
            )}
            <div className="max-w-full overflow-x-hidden">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation - this is hidden on large screens (lg) and up */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-5 h-16">
            {navigationItems.slice(0, 5).map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActiveRoute(item)
                    ? "text-emerald-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActiveRoute(item) ? 'text-emerald-600' : ''}`} />
                <span className={`text-xs font-medium ${isActiveRoute(item) ? 'text-emerald-600' : ''}`}>
                  {item.shortTitle}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </ErrorBoundary>
  );
}

