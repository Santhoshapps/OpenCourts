import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Players from "./Players";

import Messages from "./Messages";

import Profile from "./Profile";

import AddCourt from "./AddCourt";

import Tournaments from "./Tournaments";

import Home from "./Home";

import CourtManagement from "./CourtManagement";

import Admin from "./Admin";

import Town from "./Town";

import TownAnalytics from "./TownAnalytics";

import OAuthCallback  from "./oauth-callback";

import PaymentSuccess from "./PaymentSuccess";

import PaymentCancelled from "./PaymentCancelled";

import PrivacyPolicy from "./PrivacyPolicy";

import TermsOfService from "./TermsOfService";

import Consent from "./Consent";

import PickleballTeams from "./PickleballTeams";

import TeamDetails from "./TeamDetails";

import JoinTeam from "./JoinTeam";

import Teams from "./Teams";

import Support from "./Support";

import Referral from "./Referral";

import AdminChat from "./AdminChat";

import FAQ from "./FAQ";

import NewsletterManagement from "./NewsletterManagement";

import Unsubscribe from "./Unsubscribe";

import PickleballTournaments from "./PickleballTournaments";

import Architecture from "./Architecture";

import GuestDashboard from "./GuestDashboard";

import PickleballTournamentDetails from "./PickleballTournamentDetails";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Players: Players,
    
    Messages: Messages,
    
    Profile: Profile,
    
    AddCourt: AddCourt,
    
    Tournaments: Tournaments,
    
    Home: Home,
    
    CourtManagement: CourtManagement,
    
    Admin: Admin,
    
    Town: Town,
    
    TownAnalytics: TownAnalytics,
    
    OAuthCallback: oauth-callback,
    
    PaymentSuccess: PaymentSuccess,
    
    PaymentCancelled: PaymentCancelled,
    
    PrivacyPolicy: PrivacyPolicy,
    
    TermsOfService: TermsOfService,
    
    Consent: Consent,
    
    PickleballTeams: PickleballTeams,
    
    TeamDetails: TeamDetails,
    
    JoinTeam: JoinTeam,
    
    Teams: Teams,
    
    Support: Support,
    
    Referral: Referral,
    
    AdminChat: AdminChat,
    
    FAQ: FAQ,
    
    NewsletterManagement: NewsletterManagement,
    
    Unsubscribe: Unsubscribe,
    
    PickleballTournaments: PickleballTournaments,
    
    Architecture: Architecture,
    
    GuestDashboard: GuestDashboard,
    
    PickleballTournamentDetails: PickleballTournamentDetails,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Players" element={<Players />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/AddCourt" element={<AddCourt />} />
                
                <Route path="/Tournaments" element={<Tournaments />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/CourtManagement" element={<CourtManagement />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Town" element={<Town />} />
                
                <Route path="/TownAnalytics" element={<TownAnalytics />} />
                
                <Route path="/oauth-callback" element={<OAuthCallback />} />
                
                <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
                
                <Route path="/PaymentCancelled" element={<PaymentCancelled />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/Consent" element={<Consent />} />
                
                <Route path="/PickleballTeams" element={<PickleballTeams />} />
                
                <Route path="/TeamDetails" element={<TeamDetails />} />
                
                <Route path="/JoinTeam" element={<JoinTeam />} />
                
                <Route path="/Teams" element={<Teams />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/Referral" element={<Referral />} />
                
                <Route path="/AdminChat" element={<AdminChat />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/NewsletterManagement" element={<NewsletterManagement />} />
                
                <Route path="/Unsubscribe" element={<Unsubscribe />} />
                
                <Route path="/PickleballTournaments" element={<PickleballTournaments />} />
                
                <Route path="/Architecture" element={<Architecture />} />
                
                <Route path="/GuestDashboard" element={<GuestDashboard />} />
                
                <Route path="/PickleballTournamentDetails" element={<PickleballTournamentDetails />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}