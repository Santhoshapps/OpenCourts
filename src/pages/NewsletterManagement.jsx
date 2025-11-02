
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewsletterTemplate, NewsletterSubscription } from "@/api/entities";
import { User } from "@/api/entities";
import { sendNewsletterEmails } from "@/api/functions";
import { scheduleNewsletters } from "@/api/functions";
import { Mail, Send, Calendar, Users, Plus, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

export default function NewsletterManagement() {
  const [newsletters, setNewsletters] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content_sections: [
      {
        section_type: "feature_update",
        title: "",
        content: "",
        cta_text: "",
        cta_link: ""
      }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.role === 'admin') {
        const [newslettersData, subscribersData] = await Promise.all([
          NewsletterTemplate.list('-issue_date'),
          NewsletterSubscription.filter({ status: 'active' })
        ]);
        
        setNewsletters(newslettersData);
        setSubscribers(subscribersData);
      }
    } catch (error) {
      console.error("Error loading newsletter data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNewsletter = async (newsletterId) => {
    if (!confirm("Are you sure you want to send this newsletter to all subscribers?")) {
      return;
    }

    setIsSending(newsletterId);
    try {
      const response = await sendNewsletterEmails({ newsletter_id: newsletterId });
      
      // Handle the response properly
      if (response.status === 200) {
        const result = await response.json();
        if (result.success) {
          alert(`Newsletter sent successfully to ${result.sent_successfully} subscribers!`);
          loadData();
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error sending newsletter:", error);
      alert(`Failed to send newsletter: ${error.message}`);
    } finally {
      setIsSending(null);
    }
  };

  const handleScheduleNewsletter = async () => {
    try {
      const response = await scheduleNewsletters({});
      
      // Handle the response properly
      if (response.status === 200) {
        const result = await response.json();
        if (result.success) {
          alert(`Biweekly newsletter scheduled for ${new Date(result.scheduled_date).toLocaleDateString()}`);
          loadData();
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error scheduling newsletter:", error);
      alert(`Failed to schedule newsletter: ${error.message}`);
    }
  };

  const addSection = () => {
    setFormData({
      ...formData,
      content_sections: [
        ...formData.content_sections,
        {
          section_type: "feature_update",
          title: "",
          content: "",
          cta_text: "",
          cta_link: ""
        }
      ]
    });
  };

  const updateSection = (index, field, value) => {
    const updatedSections = [...formData.content_sections];
    updatedSections[index][field] = value;
    setFormData({ ...formData, content_sections: updatedSections });
  };

  const removeSection = (index) => {
    if (formData.content_sections.length > 1) {
      const updatedSections = formData.content_sections.filter((_, i) => i !== index);
      setFormData({ ...formData, content_sections: updatedSections });
    }
  };

  const handleSaveNewsletter = async () => {
    try {
      const newsletterData = {
        ...formData,
        issue_date: new Date().toISOString().split('T')[0],
        created_by: currentUser.id,
        status: "draft"
      };

      if (editingNewsletter) {
        await NewsletterTemplate.update(editingNewsletter.id, newsletterData);
      } else {
        await NewsletterTemplate.create(newsletterData);
      }

      setShowCreateForm(false);
      setEditingNewsletter(null);
      setFormData({
        title: "",
        content_sections: [
          {
            section_type: "feature_update",
            title: "",
            content: "",
            cta_text: "",
            cta_link: ""
          }
        ]
      });
      loadData();
    } catch (error) {
      console.error("Error saving newsletter:", error);
      alert("Failed to save newsletter. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can access newsletter management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter Management</h1>
            <p className="text-gray-600 mt-1">Manage biweekly updates and communications</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleScheduleNewsletter} variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Next Biweekly
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Newsletter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">{subscribers.length}</p>
                  <p className="text-sm text-gray-600">Active Subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{newsletters.length}</p>
                  <p className="text-sm text-gray-600">Total Newsletters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Send className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {newsletters.filter(n => n.status === 'sent').length}
                  </p>
                  <p className="text-sm text-gray-600">Newsletters Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Newsletter List */}
        <Card>
          <CardHeader>
            <CardTitle>Newsletter History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newsletters.map((newsletter) => (
                <div key={newsletter.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{newsletter.title}</h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(newsletter.issue_date), 'MMMM d, yyyy')}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={newsletter.status === 'sent' ? 'default' : 'secondary'}>
                        {newsletter.status}
                      </Badge>
                      {newsletter.sent_count > 0 && (
                        <Badge variant="outline">
                          {newsletter.sent_count} sent
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {newsletter.status !== 'sent' && (
                      <Button
                        onClick={() => handleSendNewsletter(newsletter.id)}
                        disabled={isSending === newsletter.id}
                        size="sm"
                      >
                        {isSending === newsletter.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Now
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingNewsletter(newsletter);
                        setFormData({
                          title: newsletter.title,
                          content_sections: newsletter.content_sections
                        });
                        setShowCreateForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {newsletters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No newsletters created yet</p>
                  <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                    Create Your First Newsletter
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Newsletter Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {editingNewsletter ? 'Edit Newsletter' : 'Create New Newsletter'}
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Newsletter Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="OpenCourts Update - March 2024"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium">Content Sections</label>
                      <Button onClick={addSection} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                    
                    {formData.content_sections.map((section, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <Select
                            value={section.section_type}
                            onValueChange={(value) => updateSection(index, 'section_type', value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="feature_update">Feature Update</SelectItem>
                              <SelectItem value="community_highlight">Community Highlight</SelectItem>
                              <SelectItem value="tip">Pro Tip</SelectItem>
                              <SelectItem value="court_addition">New Courts</SelectItem>
                              <SelectItem value="tournament_announcement">Tournament</SelectItem>
                            </SelectContent>
                          </Select>
                          {formData.content_sections.length > 1 && (
                            <Button
                              onClick={() => removeSection(index)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Section Title</label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(index, 'title', e.target.value)}
                              placeholder="🎾 What's New in OpenCourts"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Content</label>
                            <Textarea
                              value={section.content}
                              onChange={(e) => updateSection(index, 'content', e.target.value)}
                              placeholder="Write your newsletter content here..."
                              rows={4}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Call-to-Action Text</label>
                              <Input
                                value={section.cta_text}
                                onChange={(e) => updateSection(index, 'cta_text', e.target.value)}
                                placeholder="Learn More"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Call-to-Action Link</label>
                              <Input
                                value={section.cta_link}
                                onChange={(e) => updateSection(index, 'cta_link', e.target.value)}
                                placeholder="https://opencourts.app/feature"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingNewsletter(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNewsletter}>
                    {editingNewsletter ? 'Update Newsletter' : 'Save as Draft'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
