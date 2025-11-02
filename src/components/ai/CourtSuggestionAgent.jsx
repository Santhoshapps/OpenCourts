import React, { useState, useEffect } from "react";
import { Court, CourtSession } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";

// This would typically be a background service, but for demonstration,
// we're creating a component that handles the AI court suggestion logic
export default function CourtSuggestionAgent({ match, onSuggestionsReady }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateCourtSuggestions = async (match) => {
    setIsProcessing(true);
    
    try {
      // Get all courts
      const allCourts = await Court.list();
      
      // Get current sessions to check availability
      const currentSessions = await CourtSession.filter({ 
        status: "active" 
      });

      // Calculate match time and suggestion window
      const matchTime = new Date(match.scheduled_time);
      const suggestionTime = new Date(matchTime.getTime() - 30 * 60 * 1000);
      
      // Filter courts by availability and distance (this would use player locations)
      const availableCourts = allCourts.filter(court => {
        const courtSessions = currentSessions.filter(session => 
          session.court_id === court.id &&
          new Date(session.estimated_end_time) > suggestionTime
        );
        
        // Court is available if not all courts are occupied
        return courtSessions.length < court.total_courts;
      });

      // Use AI to rank and suggest the best courts
      const courtSuggestionSchema = {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                court_id: { type: "string" },
                court_name: { type: "string" },
                reasoning: { type: "string", description: "Why this court is recommended" },
                confidence: { type: "number", description: "Confidence score 1-10" },
                estimated_travel_time: { type: "number", description: "Minutes to reach court" }
              }
            },
            description: "Top 3 court recommendations"
          }
        }
      };

      const courtDetails = availableCourts.slice(0, 10).map(court => 
        `ID: ${court.id}, Name: ${court.name}, Type: ${court.court_type}, Courts: ${court.total_courts}, Address: ${court.address}`
      ).join('\n');

      const aiSuggestions = await InvokeLLM({
        prompt: `You are an AI tennis court booking assistant. A tennis match is scheduled for ${matchTime.toLocaleString()}.

Available courts:
${courtDetails}

Match details:
- Type: ${match.match_type}
- Players: 2 (skill compatibility: ${match.skill_compatibility}/10)

Recommend the top 3 courts considering:
1. Court availability and type
2. Likely distance/accessibility 
3. Match type suitability
4. Court quality and amenities

Provide reasoning for each recommendation.`,
        response_json_schema: courtSuggestionSchema
      });

      if (aiSuggestions?.suggestions) {
        const enrichedSuggestions = aiSuggestions.suggestions.map(suggestion => {
          const court = availableCourts.find(c => c.id === suggestion.court_id);
          return {
            ...suggestion,
            court_data: court,
            suggested_at: new Date().toISOString()
          };
        });

        onSuggestionsReady(enrichedSuggestions);
      }
      
    } catch (error) {
      console.error("Error generating court suggestions:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return null; // This is a service component, no UI
}

// Utility function to be called by the scheduling system
export const generateCourtSuggestionsForMatch = async (match) => {
  try {
    const allCourts = await Court.list();
    const currentSessions = await CourtSession.filter({ status: "active" });
    
    const matchTime = new Date(match.scheduled_time);
    const suggestionTime = new Date(matchTime.getTime() - 30 * 60 * 1000);
    
    // Filter available courts
    const availableCourts = allCourts.filter(court => {
      const courtSessions = currentSessions.filter(session => 
        session.court_id === court.id &&
        new Date(session.estimated_end_time) > suggestionTime
      );
      return courtSessions.length < court.total_courts;
    });

    // AI analysis
    const courtSuggestionSchema = {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              court_id: { type: "string" },
              court_name: { type: "string" },
              reasoning: { type: "string" },
              confidence: { type: "number" },
              booking_urgency: { type: "string", enum: ["low", "medium", "high"] }
            }
          },
          maxItems: 3
        },
        overall_recommendation: { type: "string" }
      }
    };

    const courtDetails = availableCourts.slice(0, 15).map(court => 
      `ID: ${court.id}, Name: ${court.name}, Type: ${court.court_type}, Courts: ${court.total_courts}, Public: ${court.is_public}`
    ).join('\n');

    const aiResponse = await InvokeLLM({
      prompt: `Tennis match scheduled for ${matchTime.toLocaleString()}. Match type: ${match.match_type}.

Available courts:
${courtDetails}

Provide top 3 court recommendations with reasoning. Consider:
- Availability likelihood at match time
- Court type suitability for ${match.match_type}
- Public vs private access
- Booking urgency (how quickly they should reserve)`,
      response_json_schema: courtSuggestionSchema
    });

    return aiResponse;
    
  } catch (error) {
    console.error("Error in court suggestion generation:", error);
    throw error;
  }
};