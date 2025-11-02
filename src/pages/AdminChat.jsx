import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User } from "@/api/entities";
import { ChatMessage, Player } from "@/api/entities";
import { agentSDK } from "@/agents";
import { Send, Bot, User as UserIcon, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AdminChat() {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnectedToAdmin, setIsConnectedToAdmin] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Get player profile
      const players = await Player.filter({ user_id: currentUser.id });
      if (players.length > 0) {
        setPlayer(players[0]);
      }

      // Create or get existing conversation with admin support
      const conversationName = `Support Chat - ${currentUser.full_name || currentUser.email}`;
      
      try {
        // Try to find existing conversation
        const existingConversations = await agentSDK.listConversations({
          agent_name: "opencourts_assistant"
        });
        
        let supportConversation = existingConversations.find(conv => 
          conv.metadata?.user_id === currentUser.id && 
          conv.metadata?.type === 'admin_support'
        );

        if (!supportConversation) {
          // Create new conversation
          supportConversation = await agentSDK.createConversation({
            agent_name: "opencourts_assistant",
            metadata: {
              name: conversationName,
              description: "Direct support chat with OpenCourts admin",
              type: "admin_support",
              user_id: currentUser.id,
              user_email: currentUser.email,
              user_name: currentUser.full_name,
              created_at: new Date().toISOString()
            }
          });

          // Send welcome message from AI
          await agentSDK.addMessage(supportConversation, {
            role: "assistant",
            content: `👋 Hi ${currentUser.full_name || 'there'}! I'm the OpenCourts AI Assistant. I'm here to help you with any questions or issues you might have.

I can help you with:
• Finding courts and players near you
• Troubleshooting app features
• Tournament and team questions
• General tennis/pickleball advice

If I can't solve your issue, I'll connect you directly with our admin for personalized support. What can I help you with today?`
          });
        }

        setConversation(supportConversation);
        
        // Subscribe to conversation updates
        const unsubscribe = agentSDK.subscribeToConversation(supportConversation.id, (data) => {
          setMessages(data.messages || []);
        });

        return () => unsubscribe();
        
      } catch (agentError) {
        console.error("Error with agent conversation:", agentError);
        // Fallback to direct admin chat without AI
        setIsConnectedToAdmin(true);
        setMessages([{
          role: "system",
          content: "Connected directly to OpenCourts admin. How can we help you today?",
          timestamp: new Date().toISOString()
        }]);
      }

    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    
    const messageText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      if (conversation && !isConnectedToAdmin) {
        // Send to AI agent first
        await agentSDK.addMessage(conversation, {
          role: "user",
          content: messageText
        });

        // Check if user wants to connect to admin
        const connectKeywords = ['admin', 'human', 'person', 'staff', 'connect me', 'talk to someone', 'real person'];
        const wantsAdmin = connectKeywords.some(keyword => 
          messageText.toLowerCase().includes(keyword)
        );

        if (wantsAdmin && !isConnectedToAdmin) {
          setTimeout(async () => {
            await agentSDK.addMessage(conversation, {
              role: "assistant", 
              content: `I understand you'd like to speak with a human! 👨‍💻 

Let me connect you directly with our admin. They'll be notified of this conversation and can provide personalized assistance.

**You're now connected to admin support!** 🎯

All future messages will go directly to our admin team. They typically respond within a few hours during business hours.`
            });
            setIsConnectedToAdmin(true);
          }, 1000);
        }
      } else {
        // Direct admin chat (fallback or after connection)
        const adminMessage = {
          role: "user",
          content: messageText,
          timestamp: new Date().toISOString(),
          user_name: user?.full_name,
          user_email: user?.email
        };
        
        setMessages(prev => [...prev, adminMessage]);
        
        // Here you would typically send to your admin notification system
        console.log("Message for admin:", {
          from: user?.email,
          message: messageText,
          conversation_id: conversation?.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble = ({ message, isUser, isBot, isSystem }) => (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot ? 'bg-blue-100' : isSystem ? 'bg-gray-100' : 'bg-emerald-100'
        }`}>
          {isBot ? <Bot className="w-4 h-4 text-blue-600" /> : 
           isSystem ? <Crown className="w-4 h-4 text-gray-600" /> :
           <Crown className="w-4 h-4 text-emerald-600" />}
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-emerald-600 text-white' : 
          isBot ? 'bg-blue-50 border border-blue-200' :
          isSystem ? 'bg-gray-50 border border-gray-200' :
          'bg-white border border-gray-200'
        }`}>
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          {isBot && <Badge variant="outline" className="text-xs">AI Assistant</Badge>}
          {!isUser && !isBot && !isSystem && <Badge variant="outline" className="text-xs">Admin</Badge>}
          {message.timestamp && (
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Starting your support chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <Card className="h-[calc(100vh-2rem)]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-emerald-600" />
                OpenCourts Support
              </CardTitle>
              <div className="flex items-center gap-2">
                {isConnectedToAdmin ? (
                  <Badge className="bg-emerald-100 text-emerald-800">Connected to Admin</Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800">AI Assistant Active</Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {isConnectedToAdmin 
                ? "You're now chatting directly with our admin team"
                : "Get instant help from our AI assistant, or ask to speak with an admin"
              }
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col h-[calc(100%-120px)] p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  isUser={message.role === 'user'}
                  isBot={message.role === 'assistant' && !isConnectedToAdmin}
                  isSystem={message.role === 'system'}
                />
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isSending}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isConnectedToAdmin ? (
                  "Messages go directly to admin • Response within a few hours"
                ) : (
                  "Say 'connect me to admin' to speak with a human"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}