import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Database, Cloud, Users, Cpu, ArrowRightLeft, MapPin, MessageSquare } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
};

export default function ArchitecturePage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">OpenCourts Application Architecture</h1>
                    <p className="text-lg text-gray-600">A technical overview of the system's components, data flows, and interfaces.</p>
                </header>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Core Architectural Components</h2>
                    <p className="mb-6 text-gray-700">The application is built on the base44 platform, which provides a serverless, integrated environment.</p>
                    <div className="space-y-4">
                        <FeatureCard 
                            icon={Layers}
                            title="Frontend (Presentation Layer)"
                            description="A modern web application built with React. Handles user interface and interactions via the base44 SDK."
                        />
                         <FeatureCard 
                            icon={Cloud}
                            title="Backend (Logic & Data Layer)"
                            description="Provided by base44 platform. Includes database, serverless functions, and integrations."
                        />
                         <FeatureCard 
                            icon={Database}
                            title="Database (Data Store)"
                            description="Managed database integrated into base44. Stores all application data as structured 'Entities'."
                        />
                         <FeatureCard 
                            icon={ArrowRightLeft}
                            title="External Services & Integrations"
                            description="External APIs for geocoding, weather, and AI recommendations via secure backend functions."
                        />
                    </div>
                </section>
                
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Data Model (Entities)</h2>
                    <p className="mb-6 text-gray-700">The foundation of the app is its data model, defined by interconnected entities:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">Court</h3>
                            <p className="text-sm text-gray-600">Physical court location with address, coordinates, number of courts, and amenities.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">Player</h3>
                            <p className="text-sm text-gray-600">User's in-app profile with skill ratings (NTRP/UTR), preferences, and location data.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">CourtSession</h3>
                            <p className="text-sm text-gray-600">Active playing sessions tracking when players check in/out of courts.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">CourtBlock</h3>
                            <p className="text-sm text-gray-600">Scheduled events that reserve courts (tournaments, lessons, maintenance).</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">PlayerMatch</h3>
                            <p className="text-sm text-gray-600">Match requests between players with AI-suggested courts and times.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">Team</h3>
                            <p className="text-sm text-gray-600">Pickleball teams that can propose matches against other teams.</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Key Features & Data Flow</h2>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Court Discovery & Check-In
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-3">Users find nearby courts and check in to play:</p>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    <li>GPS location determines nearby courts within 15-25 miles</li>
                                    <li>Real-time availability calculated from active sessions and court blocks</li>
                                    <li>Check-in requires GPS verification (within 0.25 miles of court)</li>
                                    <li>Automatic checkout after 90 minutes via scheduled function</li>
                                </ol>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Player Matching & Messaging
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-3">AI-powered player matching system:</p>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    <li>Players browse others by distance and skill level compatibility</li>
                                    <li>Match requests include proposed times and optional messages</li>
                                    <li>AI suggests optimal courts based on both players' locations</li>
                                    <li>Built-in chat system for coordination</li>
                                </ol>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="w-5 h-5" />
                                    AI & Weather Integration
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-3">Smart recommendations powered by AI:</p>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    <li>Weather data fetched via InvokeLLM integration</li>
                                    <li>Playing conditions analyzed for temperature, wind, rain</li>
                                    <li>Personalized recommendations for best playing times</li>
                                    <li>Court suggestions based on availability and weather</li>
                                </ol>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Technology Stack</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Frontend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li><strong>React:</strong> Component-based UI framework</li>
                                    <li><strong>Tailwind CSS:</strong> Utility-first styling</li>
                                    <li><strong>Shadcn/UI:</strong> Component library</li>
                                    <li><strong>Lucide React:</strong> Icon library</li>
                                    <li><strong>React Router:</strong> Client-side routing</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Backend & Platform</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li><strong>Base44:</strong> Serverless app platform</li>
                                    <li><strong>Deno:</strong> JavaScript runtime for functions</li>
                                    <li><strong>Entity SDK:</strong> Database operations</li>
                                    <li><strong>Integrations:</strong> External API management</li>
                                    <li><strong>Google APIs:</strong> Maps, Calendar, Places</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Security & Performance</h2>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <ul className="space-y-3 text-gray-700">
                            <li><strong>Authentication:</strong> Built-in user management via base44 platform</li>
                            <li><strong>Data Privacy:</strong> Location data stays on device, only general area shared</li>
                            <li><strong>Caching:</strong> 5-minute cache for court/player data to reduce API calls</li>
                            <li><strong>Error Handling:</strong> Global error boundary prevents app crashes</li>
                            <li><strong>Responsive Design:</strong> Mobile-first approach with desktop enhancements</li>
                            <li><strong>Real-time Updates:</strong> Dynamic session tracking and availability</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}