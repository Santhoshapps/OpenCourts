import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Trophy, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TeamCard({ team }) {
    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={team.logo_url} alt={team.name} />
                        <AvatarFallback className="text-xl bg-gray-200">{team.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {team.city}, {team.state}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 min-h-[40px] mb-4 line-clamp-2">
                    {team.description || 'A competitive pickleball team.'}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Members: TBD</span>
                    <span className="flex items-center gap-1"><Trophy className="w-4 h-4"/> {team.wins || 0}-{team.losses || 0}</span>
                </div>
                
                <Link to={createPageUrl(`TeamDetails?id=${team.id}`)}>
                    <Button variant="outline" className="w-full">
                        View Team Page
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}