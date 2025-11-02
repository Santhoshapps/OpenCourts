import React, { useState, useEffect } from "react";
import { PlayerMatch, ChatMessage, Player, PlayerFeedback } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Clock, CheckCircle, Users } from "lucide-react";
import { format } from "date-fns";

import MatchList from "../components/messages/MatchList";
import ChatWindow from "../components/messages/ChatWindow";
import FeedbackModal from "../components/feedback/FeedbackModal";

export default function Messages() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForPlayer, setFeedbackForPlayer] = useState(null);

  useEffect(() => {
    loadCurrentPlayer();
    loadPlayers();
  }, []);

  useEffect(() => {
    if (currentPlayer) {
      loadMatches();
    }
  }, [currentPlayer]);

  useEffect(() => {
    if (selectedMatch) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000); // Poll for new messages
      return () => clearInterval(interval);
    }
  }, [selectedMatch]);

  const loadCurrentPlayer = async () => {
    try {
      const user = await User.me();
      const playerData = await Player.filter({ user_id: user.id });
      if (playerData.length > 0) {
        setCurrentPlayer(playerData[0]);
      }
    } catch (error) {
      console.error("Error loading current player:", error);
    }
  };

  const loadPlayers = async () => {
    try {
      const playersData = await Player.list();
      const playersMap = {};
      playersData.forEach(player => {
        playersMap[player.id] = player;
      });
      setPlayers(playersMap);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  };

  const loadMatches = async () => {
    try {
      const [matchesData, feedbacksData] = await Promise.all([
        PlayerMatch.list("-created_date"),
        PlayerFeedback.list()
      ]);

      const userMatches = matchesData.filter(match => 
        match.player1_id === currentPlayer.id || match.player2_id === currentPlayer.id
      );
      
      const matchesWithFeedbackStatus = userMatches.map(match => {
        const feedbackGiven = feedbacksData.some(fb => 
          fb.match_id === match.id && fb.reviewer_id === currentPlayer.id
        );
        return { ...match, feedbackGiven };
      });
      
      setMatches(matchesWithFeedbackStatus);
    } catch (error) {
      console.error("Error loading matches:", error);
    }
    setIsLoading(false);
  };

  const loadMessages = async () => {
    try {
      const messagesData = await ChatMessage.filter(
        { match_id: selectedMatch.id },
        "created_date"
      );
      setMessages(messagesData);
      
      // Mark messages as read
      const unreadMessages = messagesData.filter(
        msg => msg.sender_id !== currentPlayer.id && !msg.is_read
      );
      for (const msg of unreadMessages) {
        await ChatMessage.update(msg.id, { is_read: true });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch) return;

    try {
      await ChatMessage.create({
        match_id: selectedMatch.id,
        sender_id: currentPlayer.id,
        message: newMessage,
        message_type: "text"
      });
      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleMatchAction = async (matchId, action) => {
    try {
      await PlayerMatch.update(matchId, { status: action });
      if (action === "completed") {
        const completedMatch = matches.find(m => m.id === matchId);
        if (completedMatch) {
            const otherPlayerId = completedMatch.player1_id === currentPlayer.id ? completedMatch.player2_id : completedMatch.player1_id;
            setFeedbackForPlayer(players[otherPlayerId]);
            setShowFeedbackModal(true);
        }
      }
      loadMatches();
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  const getOtherPlayer = (match) => {
    const otherPlayerId = match.player1_id === currentPlayer.id 
      ? match.player2_id 
      : match.player1_id;
    return players[otherPlayerId];
  };

  const getUnreadCount = (match) => {
    // This would normally be calculated from the messages
    // For now, return 0 as a placeholder
    return 0;
  };

  const handleFeedbackSubmit = () => {
      setShowFeedbackModal(false);
      setFeedbackForPlayer(null);
      loadMatches(); // a feedback was submitted, so we reload to update the button state
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Matches Sidebar */}
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-600 mt-1">
            {matches.length} conversations
          </p>
        </div>
        
        <MatchList
          matches={matches}
          selectedMatch={selectedMatch}
          onSelectMatch={setSelectedMatch}
          getOtherPlayer={getOtherPlayer}
          getUnreadCount={getUnreadCount}
          handleMatchAction={handleMatchAction}
          isLoading={isLoading}
          currentPlayerId={currentPlayer?.id}
          onLeaveFeedback={(match) => {
            const otherPlayer = getOtherPlayer(match);
            setFeedbackForPlayer(otherPlayer);
            setSelectedMatch(match); // Optionally select the match when giving feedback
            setShowFeedbackModal(true);
          }}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedMatch ? (
          <ChatWindow
            match={selectedMatch}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            currentPlayer={currentPlayer}
            otherPlayer={getOtherPlayer(selectedMatch)}
            players={players}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a match from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackForPlayer && currentPlayer && (
        <FeedbackModal
          player={feedbackForPlayer}
          reviewerId={currentPlayer.id}
          matchId={matches.find(m => 
            (m.player1_id === feedbackForPlayer.id && m.player2_id === currentPlayer.id) ||
            (m.player2_id === feedbackForPlayer.id && m.player1_id === currentPlayer.id)
          )?.id}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackForPlayer(null);
          }}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}