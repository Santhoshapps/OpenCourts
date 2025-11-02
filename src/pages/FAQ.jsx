
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronRight, MapPin, Users, Play, MessageSquare, Trophy, Shield, Smartphone, HelpCircle } from "lucide-react";

const faqData = [
  {
    category: "Getting Started",
    icon: <Smartphone className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-800",
    questions: [
      {
        question: "How do I create my profile?",
        answer: "After signing up, go to your Profile page and fill in your display name, skill level (NTRP/UTR rating), and playing preferences. This helps other players find and connect with you for matches at your skill level."
      },
      {
        question: "Why can't I see any courts?",
        answer: "OpenCourts needs your location to show nearby courts. Make sure you've allowed location access in your browser/device settings. If you're having trouble, try moving to an area with better GPS signal (outdoors, away from tall buildings) and refresh the app."
      },
      {
        question: "How do I set my skill level?",
        answer: "In your Profile, you can set either your NTRP rating (1.0-7.0 scale) or UTR rating (1-16 scale). If you're unsure, start conservatively - you can always adjust it as you play more matches and get feedback from other players."
      },
      {
        question: "What if I don't know my skill level?",
        answer: "No problem! Start with a conservative estimate: Beginner (2.5-3.0 NTRP), Intermediate (3.5-4.0 NTRP), or Advanced (4.5+ NTRP). As you play matches and receive feedback, the app will help you understand your actual level."
      }
    ]
  },
  {
    category: "Finding & Using Courts",
    icon: <MapPin className="w-5 h-5" />,
    color: "bg-green-100 text-green-800",
    questions: [
      {
        question: "How do I find courts near me?",
        answer: "The main Dashboard shows a live map of tennis and pickleball courts near your current location. You can switch between Tennis and Pickleball views, and see real-time availability based on other players' check-ins."
      },
      {
        question: "What does 'Check In' mean and why should I do it?",
        answer: "Checking in tells other players that the court is currently occupied. This helps the community see which courts are actually available. To check in, you must be within 0.25 miles of the court. Always remember to check out when you're done playing!"
      },
      {
        question: "Why does it say a court is unavailable when it looks empty?",
        answer: "Courts can be unavailable for several reasons: 1) Other players are checked in, 2) The court is officially reserved for lessons/tournaments (managed by town administrators), or 3) The court has been temporarily closed. Check the court details for more information."
      },
      {
        question: "Can I add courts that aren't on the map?",
        answer: "Yes! Use the 'Add Court' feature to suggest new courts. Provide accurate information including exact location, number of courts, surface type, and amenities. New courts are reviewed before being added to ensure accuracy."
      },
      {
        question: "What should I do if court information is wrong?",
        answer: "Use the 'Report Court' feature (flag icon) to let us know about incorrect information, permanently closed courts, or other issues. This helps keep the map accurate for everyone."
      },
      {
        question: "Can I favorite courts?",
        answer: "Yes! Click the heart icon on any court to add it to your favorites. Favorite courts appear first in your court list, making it easy to quickly check your preferred playing locations."
      }
    ]
  },
  {
    category: "Connecting with Players",
    icon: <Users className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-800",
    questions: [
      {
        question: "How do I find other players to play with?",
        answer: "Go to the Players page to see other players near you who are marked as 'available'. You can filter by distance, skill level, and playing preferences to find compatible matches."
      },
      {
        question: "How do I send a match request?",
        answer: "On a player's profile, click 'Request Match'. Choose singles or doubles, suggest a time and date, and optionally include a personal message. The other player can accept or decline your request."
      },
      {
        question: "What happens after someone accepts my match request?",
        answer: "A private chat is created between you and the other player. Use this to coordinate final details like the exact court, time confirmation, and how you'll recognize each other at the court."
      },
      {
        question: "How does the feedback system work?",
        answer: "After playing with someone, you'll be prompted to leave feedback about their skill level, strengths, weaknesses, and playing style. This feedback helps build trust in the community and improves matchmaking for everyone."
      },
      {
        question: "What if someone doesn't show up for our match?",
        answer: "If a player doesn't show up or communicate, you can report this behavior. Repeated no-shows affect a player's reputation score. Always try to message them first in case of emergencies."
      }
    ]
  },
  {
    category: "Teams & Tournaments",
    icon: <Trophy className="w-5 h-5" />,
    color: "bg-yellow-100 text-yellow-800",
    questions: [
      {
        question: "How do I join or create a team?",
        answer: "Go to the Teams page to browse existing teams or create your own. Team captains can invite players using a special invite link. Teams can challenge other teams to matches and track their win/loss record."
      },
      {
        question: "What are ladder tournaments?",
        answer: "Ladder tournaments are ongoing competitions where players challenge others near their position to move up the rankings. Join tournaments that match your skill level and challenge players within the allowed range."
      },
      {
        question: "How do I report match scores?",
        answer: "After completing a tournament match, both players receive a prompt to report the score. If there's a discrepancy, administrators will review and resolve the dispute."
      },
      {
        question: "Can I organize my own tournament?",
        answer: "Yes! Use the tournament creation feature to set up your own ladder tournament. You can set skill level requirements, rules, and manage participants."
      }
    ]
  },
  {
    category: "Technical Support",
    icon: <Shield className="w-5 h-5" />,
    color: "bg-red-100 text-red-800",
    questions: [
      {
        question: "The app says I need to enable location services. How do I do this?",
        answer: "For browsers: Click the location icon in your address bar and select 'Always allow'. For mobile: Go to Settings > Privacy & Security > Location Services, find your browser, and enable location access."
      },
      {
        question: "Why is my location not accurate?",
        answer: "GPS accuracy can be affected by being indoors, tall buildings, or poor weather. For best results, use the app outdoors with a clear view of the sky. The app will automatically try to improve accuracy over time."
      },
      {
        question: "I'm not receiving notifications. What should I do?",
        answer: "Check your browser notification settings and make sure OpenCourts is allowed to send notifications. On mobile, also check your device's notification settings for your browser app."
      },
      {
        question: "How do I report a bug or technical issue?",
        answer: "Use the Support form or Live Support chat to report technical issues. Include details about what you were trying to do, what happened instead, and what device/browser you're using."
      },
      {
        question: "Is my personal information safe?",
        answer: "Yes! We take privacy seriously. Your exact location is never shared with other players - only general proximity. Read our Privacy Policy for complete details on how we protect your data."
      }
    ]
  },
  {
    category: "Community Guidelines",
    icon: <HelpCircle className="w-5 h-5" />,
    color: "bg-indigo-100 text-indigo-800",
    questions: [
      {
        question: "What are the community rules?",
        answer: "Be respectful, honest, and reliable. Show up for scheduled matches, communicate clearly, leave honest feedback, and follow tennis/pickleball etiquette. Repeated violations may result in account restrictions."
      },
      {
        question: "How do I report inappropriate behavior?",
        answer: "Use the report feature on player profiles or contact our support team directly. We take all reports seriously and will investigate promptly while protecting your privacy."
      },
      {
        question: "What happens if I have a dispute with another player?",
        answer: "First, try to resolve issues directly through respectful communication. If that doesn't work, contact our support team who can mediate disputes and take appropriate action if needed."
      },
      {
        question: "Can I block or hide certain players?",
        answer: "Yes, you can block players who you don't want to receive match requests from. You can also hide courts that you're not interested in seeing on your map."
      }
    ]
  }
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(new Set(["Getting Started"])); // Expand first category by default
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // Filter questions based on search term
  const filteredData = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleCategory = (categoryName) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleQuestion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & FAQ</h1>
          <p className="text-gray-600 mb-6">
            Find answers to common questions about using OpenCourts
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Links */}
        {!searchTerm && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Help</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("location")}>
                <MapPin className="w-4 h-4 mr-2" />
                Location Issues
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("check in")}>
                <Play className="w-4 h-4 mr-2" />
                Check In Help
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("match request")}>
                <Users className="w-4 h-4 mr-2" />
                Finding Players
              </Button>
            </div>
          </div>
        )}

        {/* FAQ Categories */}
        <div className="space-y-4">
          {filteredData.map((category, categoryIndex) => {
            const isExpanded = expandedCategories.has(category.category);
            
            return (
              <Card key={category.category}>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCategory(category.category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color}`}>
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.category}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {category.questions.length} {category.questions.length === 1 ? 'question' : 'questions'}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {category.questions.map((question, questionIndex) => {
                        const questionId = `${categoryIndex}-${questionIndex}`;
                        const isQuestionExpanded = expandedQuestions.has(questionId);
                        
                        return (
                          <div key={questionId} className="border border-gray-200 rounded-lg">
                            <button
                              className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                              onClick={() => toggleQuestion(questionId)}
                            >
                              <span className="font-medium text-gray-900 pr-4">
                                {question.question}
                              </span>
                              {isQuestionExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                            
                            {isQuestionExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-100">
                                <p className="text-gray-600 leading-relaxed pt-3">
                                  {question.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {searchTerm && filteredData.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any questions matching "{searchTerm}". Try different keywords or contact support.
            </p>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Clear Search
            </Button>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 text-center p-6 bg-emerald-50 rounded-lg border border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-900 mb-2">
            Still need help?
          </h3>
          <p className="text-emerald-700 mb-4">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => window.location.href = '/AdminChat'}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Live Support Chat
            </Button>
            <Button 
              onClick={() => window.location.href = '/Support'}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              Contact Form
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
