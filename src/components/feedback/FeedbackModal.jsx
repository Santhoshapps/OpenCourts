import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Mic, Send, BrainCircuit, Star } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { PlayerFeedback } from "@/api/entities";

export default function FeedbackModal({ player, reviewerId, matchId, onClose, onFeedbackSubmit }) {
  const [feedbackText, setFeedbackText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rating, setRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim() || rating === 0) {
        alert("Please provide feedback text and a rating.");
        return;
    }

    setIsProcessing(true);
    try {
      const analysisSchema = {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" }, description: "List of the player's strengths based on the feedback." },
          weaknesses: { type: "array", items: { type: "string" }, description: "List of the player's weaknesses based on the feedback." },
          playing_style: { type: "string", description: "The player's style (e.g., Aggressive Baseliner, Serve and Volleyer, All-Court Player)." },
          summary: { type: "string", description: "A one-sentence summary of the feedback." }
        },
        required: ["strengths", "weaknesses", "playing_style", "summary"]
      };

      const result = await InvokeLLM({
        prompt: `Analyze the following tennis player feedback about '${player.display_name}': \"${feedbackText}\". Extract their strengths, weaknesses, and determine their playing style. Provide a one-sentence summary.`,
        response_json_schema: analysisSchema
      });

      if (result) {
        await PlayerFeedback.create({
          player_id: player.id,
          reviewer_id: reviewerId,
          match_id: matchId,
          raw_feedback_text: feedbackText,
          overall_rating: rating,
          ...result
        });
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" />
              Feedback for {player.display_name}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Match Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star}
                    className={`w-6 h-6 cursor-pointer ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <div>
                <Label htmlFor="feedbackText">Your Feedback</Label>
                <div className="relative">
                    <Textarea
                    id="feedbackText"
                    placeholder={`Describe your match with ${player.display_name}. What were their strengths and weaknesses? (This will be analyzed by an AI)`}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={5}
                    className="pr-10"
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute bottom-2 right-2 h-7 w-7 text-gray-500 hover:text-emerald-600">
                        <Mic className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Click the mic to use speech-to-text (simulation).</p>
            </div>
            <Button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
                <Send className="w-4 h-4 mr-2" />
                {isProcessing ? 'Analyzing & Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}