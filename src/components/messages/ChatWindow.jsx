import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function ChatWindow({ 
  match, 
  messages, 
  newMessage, 
  setNewMessage, 
  sendMessage,
  currentPlayer,
  otherPlayer,
  players 
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      {/* Chat Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {otherPlayer?.display_name?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {otherPlayer?.display_name || 'Unknown Player'}
            </h2>
            <p className="text-sm text-gray-600">
              {match.match_type === "singles" ? "Singles Match" : "Doubles Match"}
            </p>
          </div>
          <Badge className={getStatusColor(match.status)}>
            {match.status}
          </Badge>
        </div>

        {/* Match Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(match.scheduled_time), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>Court TBD</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start the conversation!</p>
            <p className="text-sm">Say hi and discuss your match details.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === currentPlayer.id;
            const sender = players[message.sender_id];
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCurrentUser
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p>{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    isCurrentUser ? "text-emerald-100" : "text-gray-500"
                  }`}>
                    {format(new Date(message.created_date), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}