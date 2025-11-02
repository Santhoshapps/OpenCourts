
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { MessageSquare, Mail, Bug, Lightbulb, HelpCircle, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom"; // Import Link for navigation

// A simple placeholder for createPageUrl if it's not globally defined or imported.
// In a real application, this would likely come from a routing utility or context.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "AdminChat":
      return "/admin-chat"; // This should match your actual route for AdminChat
    default:
      return "/";
  }
};

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    // Pre-fill user data if logged in
    const loadUserData = async () => {
      try {
        const user = await User.me();
        setFormData(prev => ({
          ...prev,
          name: user.full_name || "",
          email: user.email || ""
        }));
      } catch (error) {
        // User not logged in, that's fine
        console.log("User not logged in for support form");
      }
    };
    loadUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.category || !formData.subject || !formData.message) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!formData.email) {
      setError("Email address is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user info to include admin details
      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (err) {
        // User might not be logged in, that's ok
      }

      const emailBody = `
Support Request from OpenCourts

From: ${formData.name || "Not provided"} (${formData.email})
Category: ${formData.category}
Subject: ${formData.subject}

User Details:
${currentUser ? `
- User ID: ${currentUser.id}
- Full Name: ${currentUser.full_name}
- Email: ${currentUser.email}
- Role: ${currentUser.role || 'user'}
` : '- User not logged in'}

Message:
${formData.message}

---
Sent from OpenCourts Support Form
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
      `.trim();

      console.log("Attempting to send support email to admin...");
      
      const result = await SendEmail({
        to: "support@opencourts.app", // Make sure this is your actual support email
        subject: `[OpenCourts Support] ${formData.category}: ${formData.subject}`,
        body: emailBody,
        from_name: "OpenCourts Support System"
      });

      console.log("Email send result:", result);
      
      setIsSubmitted(true);
      setError(null);
      
    } catch (error) {
      console.error("Error sending support email:", error);
      
      let errorMessage = `Failed to send message: ${error.message || 'Unknown error'}. You can email us directly at support@opencourts.app`;
      if (error.response?.status === 404) {
          errorMessage = "Could not reach the support service. Please try again later or email us directly at support@opencourts.app.";
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(prev => ({
      name: prev.name, // Keep name and email
      email: prev.email,
      category: "",
      subject: "",
      message: ""
    }));
    setIsSubmitted(false);
    setError(null);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Message Sent Successfully!</CardTitle>
              <CardDescription>
                We've received your message and will get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                In the meantime, you can also try our instant support chat for immediate help.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={resetForm} variant="outline">
                  Send Another Message
                </Button>
                <Button asChild>
                  <Link to={createPageUrl("AdminChat")}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Try Live Chat
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Feedback</h1>
          <p className="text-gray-600">
            Get help through our live chat or send us a detailed message
          </p>
          
          {/* Quick Access to Chat */}
          <div className="mt-6">
            <Link to={createPageUrl("AdminChat")}>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Live Chat Support
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Unable to Send Message</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select onValueChange={value => setFormData({ ...formData, category: value })} value={formData.category}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bug Report">
                          <Bug className="w-4 h-4 mr-2" /> Bug Report
                        </SelectItem>
                        <SelectItem value="Feature Request">
                          <Lightbulb className="w-4 h-4 mr-2" /> Feature Request
                        </SelectItem>
                        <SelectItem value="General Question">
                          <HelpCircle className="w-4 h-4 mr-2" /> General Question
                        </SelectItem>
                        <SelectItem value="Other">
                          <MessageSquare className="w-4 h-4 mr-2" /> Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input 
                      id="subject" 
                      placeholder="e.g., Issue with court check-in"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Please describe your issue or suggestion in detail..."
                      rows={6}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info & FAQ */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-sm text-gray-600">support@opencourts.app</p>
                  <p className="text-xs text-gray-500 mt-1">For urgent issues</p>
                </div>
                <div>
                  <h4 className="font-semibold">Response Time</h4>
                  <p className="text-sm text-gray-600">Usually within 24 hours</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  FAQs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>How do I find courts?</strong><br/>
                  Use the main dashboard to see courts near your current location.
                </p>
                <p>
                  <strong>How does check-in work?</strong><br/>
                  When you're at a court, simply press the "Check In" button. We use your location to verify you're there.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
