import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Book, MessageCircle, Mail, Search, ChevronDown, ThumbsUp, ThumbsDown, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useHelpSystem } from '@/hooks/useHelpSystem';
import { useOnboarding } from '@/components/Help/OnboardingTour';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  views: number;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create a new support ticket?',
    answer: 'To create a support ticket, navigate to the Tickets section from the main menu, click "Create Ticket", fill in the required details including title, description, priority level, and assign it to a technician. You can also attach files if needed.',
    category: 'tickets',
    helpful: 45,
    views: 123,
  },
  {
    id: '2',
    question: 'How do I add a new client?',
    answer: 'Go to the Clients section, click "Add Client", and fill in the client information including company name, contact details, industry, and company size. You can also add multiple contacts for each client.',
    category: 'clients',
    helpful: 38,
    views: 98,
  },
  {
    id: '3',
    question: 'How do I generate reports?',
    answer: 'Visit the Reports section to access various report types including financial reports, client assessments, and BI reports. You can schedule automated reports and export them in multiple formats.',
    category: 'reports',
    helpful: 29,
    views: 67,
  },
];

export const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const { articles, loading, searchArticles, voteArticle } = useHelpSystem();
  const { startTour } = useOnboarding();

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(faqData.map(faq => faq.category))];

  useEffect(() => {
    if (searchTerm) {
      searchArticles(searchTerm);
    }
  }, [searchTerm, searchArticles]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
              <p className="text-muted-foreground">
                Find answers, documentation, and get support for the MSP platform.
              </p>
            </div>
            <Button onClick={startTour} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Take Tour
            </Button>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search help articles and FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Book className="w-4 h-4 mr-2" />
                    View Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Live Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={startTour}>
                    <Play className="w-4 h-4 mr-2" />
                    Platform Tour
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    FAQ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredFAQs.map((faq) => (
                      <Collapsible
                        key={faq.id}
                        open={openFAQ === faq.id}
                        onOpenChange={(open) => setOpenFAQ(open ? faq.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-4 h-auto text-left"
                          >
                            <span className="font-medium">{faq.question}</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};