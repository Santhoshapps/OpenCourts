import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import { Team } from '@/api/entities';
import TeamCard from '../components/pickleball/TeamCard';
import CreateTeamForm from '../components/pickleball/CreateTeamForm';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PickleballTeams() {
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        setIsLoading(true);
        try {
            const allTeams = await Team.list('-created_date');
            setTeams(allTeams);
        } catch (error) {
            console.error("Failed to load teams:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeamCreated = (newTeam) => {
        setShowCreateForm(false);
        loadTeams(); // Reload the teams list
        
        // Navigate to the new team's details page
        if (newTeam && newTeam.id) {
            navigate(createPageUrl(`TeamDetails?id=${newTeam.id}`));
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-teal-600" />
                        Pickleball Teams
                    </h1>
                    <p className="mt-1 text-gray-600">Find or create teams to compete with.</p>
                </div>
                <Button onClick={() => setShowCreateForm(true)} className="mt-4 sm:mt-0 bg-teal-600 hover:bg-teal-700">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Create a New Team
                </Button>
            </div>

            {showCreateForm && (
                <div className="mb-8">
                    <CreateTeamForm 
                        onSuccess={handleTeamCreated} 
                        onCancel={() => setShowCreateForm(false)} 
                    />
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    ))}
                </div>
            ) : teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <TeamCard key={team.id} team={team} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
                    <p className="mt-1 text-sm text-gray-500">Be the first one to create a team!</p>
                </div>
            )}
        </div>
    );
}