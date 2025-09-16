import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Help System Hook
export const useHelpSystem = () => {
  const { profile } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchArticles = useCallback(async (filters: {
    category?: string;
    subcategory?: string;
    featured?: boolean;
    search?: string;
  } = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('help_articles')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_published', true)
        .order('view_count', { ascending: false });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }

      if (filters.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setArticles(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(article => article.category) || [])];
      setCategories(uniqueCategories);

      return { success: true, articles: data };

    } catch (error: any) {
      console.error('Failed to fetch help articles:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  const getArticle = useCallback(async (slug: string) => {
    try {
      const { data: article, error } = await supabase
        .from('help_articles')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('help_articles')
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq('id', article.id);

      return { success: true, article: { ...article, view_count: (article.view_count || 0) + 1 } };

    } catch (error: any) {
      console.error('Failed to fetch article:', error);
      return { success: false, error: error.message };
    }
  }, [profile?.tenant_id]);

  const searchArticles = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return { success: true, results: [] };
    }

    setLoading(true);
    try {
      // Search in title, content, and tags
      const { data, error } = await supabase
        .from('help_articles')
        .select('id, title, excerpt, category, slug, view_count, tags')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_published', true)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`)
        .order('view_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Enhanced search scoring
      const scoredResults = (data || []).map(article => {
        let score = 0;
        const term = searchTerm.toLowerCase();
        
        // Title match (highest weight)
        if (article.title.toLowerCase().includes(term)) {
          score += 10;
        }
        
        // Exact title match
        if (article.title.toLowerCase() === term) {
          score += 20;
        }
        
        // Tags match
        if (article.tags?.some((tag: string) => tag.toLowerCase().includes(term))) {
          score += 5;
        }
        
        // Excerpt match
        if (article.excerpt?.toLowerCase().includes(term)) {
          score += 3;
        }
        
        // Popular articles get slight boost
        score += Math.min(article.view_count / 100, 2);
        
        return { ...article, searchScore: score };
      }).sort((a, b) => b.searchScore - a.searchScore);

      setSearchResults(scoredResults);
      return { success: true, results: scoredResults };

    } catch (error: any) {
      console.error('Search failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  const voteArticle = useCallback(async (articleId: string, helpful: boolean) => {
    try {
      const field = helpful ? 'helpful_votes' : 'not_helpful_votes';
      
      const { data: article, error: fetchError } = await supabase
        .from('help_articles')
        .select(field)
        .eq('id', articleId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('help_articles')
        .update({ [field]: (article[field] || 0) + 1 })
        .eq('id', articleId);

      if (updateError) throw updateError;

      // Update local state
      setArticles(prev => 
        prev.map(art => 
          art.id === articleId 
            ? { ...art, [field]: (art[field] || 0) + 1 }
            : art
        )
      );

      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded.",
      });

      return { success: true };

    } catch (error: any) {
      console.error('Vote failed:', error);
      toast({
        title: "Vote Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, []);

  const getRecommendedArticles = useCallback(async (currentArticleId?: string) => {
    try {
      let query = supabase
        .from('help_articles')
        .select('id, title, excerpt, category, slug, view_count, tags')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5);

      if (currentArticleId) {
        query = query.neq('id', currentArticleId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, articles: data || [] };

    } catch (error: any) {
      console.error('Failed to fetch recommended articles:', error);
      return { success: false, error: error.message };
    }
  }, [profile?.tenant_id]);

  return {
    articles,
    categories,
    loading,
    searchResults,
    fetchArticles,
    getArticle,
    searchArticles,
    voteArticle,
    getRecommendedArticles,
  };
};

// Error Recovery Guide Hook
export const useErrorRecovery = () => {
  const [recoveryGuides, setRecoveryGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getRecoveryGuide = useCallback(async (errorType: string, errorCode?: string) => {
    setLoading(true);
    try {
      // Built-in recovery guides for common errors
      const guides = getBuiltInRecoveryGuides();
      
      const matchingGuides = guides.filter(guide => 
        guide.errorTypes.includes(errorType) || 
        (errorCode && guide.errorCodes?.includes(errorCode))
      );

      if (matchingGuides.length === 0) {
        // Generic recovery guide
        return {
          success: true,
          guide: {
            title: "General Error Recovery",
            steps: [
              "Refresh the page and try again",
              "Check your internet connection",
              "Clear your browser cache and cookies",
              "Try logging out and logging back in",
              "Contact support if the issue persists"
            ],
            additionalResources: [
              { title: "Troubleshooting Guide", url: "/help/troubleshooting" },
              { title: "Contact Support", url: "/support" }
            ]
          }
        };
      }

      setRecoveryGuides(matchingGuides);
      return { success: true, guide: matchingGuides[0] };

    } catch (error: any) {
      console.error('Failed to get recovery guide:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reportError = useCallback(async (errorData: {
    error_type: string;
    error_message: string;
    error_stack?: string;
    user_action?: string;
    recovery_attempted?: string[];
    additional_context?: any;
  }) => {
    try {
      // Log error for analysis and improvement
      await supabase.from('error_logs').insert({
        error_type: errorData.error_type,
        error_message: errorData.error_message,
        error_stack: errorData.error_stack,
        context: {
          user_action: errorData.user_action,
          recovery_attempted: errorData.recovery_attempted || [],
          additional_context: errorData.additional_context || {}
        },
        url: window.location.href,
        user_agent: navigator.userAgent
      });

      toast({
        title: "Error Reported",
        description: "Thank you for reporting this issue. Our team will investigate.",
      });

      return { success: true };

    } catch (error: any) {
      console.error('Failed to report error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    recoveryGuides,
    loading,
    getRecoveryGuide,
    reportError,
  };
};

// Interactive Help Assistant Hook
export const useHelpAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const startConversation = useCallback(() => {
    setIsOpen(true);
    if (conversation.length === 0) {
      setConversation([{
        id: 'welcome',
        type: 'assistant',
        message: "Hi! I'm here to help you navigate the platform. What can I assist you with today?",
        timestamp: new Date().toISOString(),
        suggestions: [
          "How do I create a support ticket?",
          "How do I upload files?",
          "How do I schedule a service?",
          "How do I export my data?",
          "Account and security settings"
        ]
      }]);
    }
  }, [conversation.length]);

  const sendMessage = useCallback(async (message: string) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      message,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Simulate AI response based on keywords
      const response = await generateHelpResponse(message);
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        message: response.message,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions,
        relatedArticles: response.relatedArticles
      };

      setConversation(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Help assistant error:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        message: "I'm sorry, I'm having trouble right now. Please try asking again or browse our help articles.",
        timestamp: new Date().toISOString(),
        suggestions: ["Browse help articles", "Contact support"]
      };

      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearConversation = useCallback(() => {
    setConversation([]);
    startConversation();
  }, [startConversation]);

  return {
    isOpen,
    conversation,
    loading,
    setIsOpen,
    startConversation,
    sendMessage,
    clearConversation,
  };
};

// Utility functions
const getBuiltInRecoveryGuides = () => [
  {
    id: 'auth-error',
    title: "Authentication Issues",
    errorTypes: ['SIGN_IN_ERROR', 'SESSION_EXPIRED', 'LOCKOUT'],
    errorCodes: ['INVALID_CREDENTIALS', 'ACCOUNT_LOCKED'],
    steps: [
      "Check that your email and password are correct",
      "Try resetting your password if you can't remember it",
      "Clear your browser cache and cookies",
      "Make sure your account isn't locked (check email for notifications)",
      "Contact support if your account is locked"
    ],
    estimatedTime: "2-5 minutes",
    additionalResources: [
      { title: "Password Reset Guide", url: "/help/password-reset" },
      { title: "Account Security", url: "/help/account-security" }
    ]
  },
  {
    id: 'upload-error',
    title: "File Upload Problems",
    errorTypes: ['UPLOAD_ERROR', 'FILE_TOO_LARGE', 'SCAN_FAILED'],
    steps: [
      "Check that your file is under 10MB in size",
      "Ensure the file type is supported (images, PDFs, documents)",
      "Try a different file if virus scan fails",
      "Check your internet connection",
      "Try uploading again after a few minutes"
    ],
    estimatedTime: "1-3 minutes",
    additionalResources: [
      { title: "Supported File Types", url: "/help/file-types" },
      { title: "File Size Limits", url: "/help/file-limits" }
    ]
  },
  {
    id: 'booking-conflict',
    title: "Booking Conflicts",
    errorTypes: ['BOOKING_CONFLICT', 'TIME_UNAVAILABLE'],
    steps: [
      "Choose a different time slot",
      "Check if the technician is available",
      "Try booking for a different day",
      "Contact us to discuss urgent scheduling needs"
    ],
    estimatedTime: "2-5 minutes",
    additionalResources: [
      { title: "Booking Guide", url: "/help/booking" },
      { title: "Contact Support", url: "/support" }
    ]
  }
];

const generateHelpResponse = async (message: string): Promise<{
  message: string;
  suggestions?: string[];
  relatedArticles?: any[];
}> => {
  const lowerMessage = message.toLowerCase();
  
  // Keyword-based responses
  if (lowerMessage.includes('ticket') || lowerMessage.includes('support')) {
    return {
      message: "To create a support ticket:\n\n1. Click on 'Create Ticket' in the main menu\n2. Fill in the required fields (title, description, category)\n3. Set the priority level\n4. Attach any relevant files\n5. Submit your ticket\n\nYou'll receive a confirmation email with your ticket number.",
      suggestions: [
        "How do I check ticket status?",
        "How do I upload files to a ticket?",
        "What are the different priority levels?"
      ],
      relatedArticles: [
        { title: "Ticket Management Guide", slug: "ticket-management" },
        { title: "Priority Levels Explained", slug: "priority-levels" }
      ]
    };
  }
  
  if (lowerMessage.includes('upload') || lowerMessage.includes('file')) {
    return {
      message: "To upload files:\n\n1. Click the 'Upload' button or drag and drop files\n2. Select files from your computer (max 10MB each)\n3. Wait for virus scanning to complete\n4. Files will be automatically associated with your ticket or request\n\nSupported formats: Images, PDFs, Word documents, text files.",
      suggestions: [
        "What file types are supported?",
        "Why did my file fail virus scan?",
        "How do I upload multiple files?"
      ],
      relatedArticles: [
        { title: "File Upload Guide", slug: "file-upload" },
        { title: "Security Scanning", slug: "virus-scanning" }
      ]
    };
  }
  
  if (lowerMessage.includes('book') || lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
    return {
      message: "To schedule a service:\n\n1. Browse the service catalog\n2. Select the service you need\n3. Choose an available time slot\n4. Provide location details if needed\n5. Confirm your booking\n\nYou'll receive confirmation and reminder emails.",
      suggestions: [
        "How do I reschedule a booking?",
        "What if there are no available slots?",
        "How do I cancel a booking?"
      ],
      relatedArticles: [
        { title: "Booking Services", slug: "booking-guide" },
        { title: "Service Catalog", slug: "service-catalog" }
      ]
    };
  }
  
  if (lowerMessage.includes('export') || lowerMessage.includes('download') || lowerMessage.includes('data')) {
    return {
      message: "To export your data:\n\n1. Go to Settings > Data Export\n2. Choose what data to export (tickets, reports, etc.)\n3. Select format (CSV, JSON, PDF)\n4. Set date range if needed\n5. Submit request\n\nYou'll be notified when your export is ready for download.",
      suggestions: [
        "What data can I export?",
        "How long do exports take?",
        "How do I download my export?"
      ],
      relatedArticles: [
        { title: "Data Export Guide", slug: "data-export" },
        { title: "Privacy and Data", slug: "data-privacy" }
      ]
    };
  }
  
  if (lowerMessage.includes('account') || lowerMessage.includes('security') || lowerMessage.includes('password')) {
    return {
      message: "Account and security options:\n\n• Change password in Account Settings\n• Enable two-factor authentication for extra security\n• Review login history and active sessions\n• Set notification preferences\n• Manage API access tokens\n\nRegularly review your security settings to keep your account safe.",
      suggestions: [
        "How do I enable 2FA?",
        "How do I reset my password?",
        "How do I review login history?"
      ],
      relatedArticles: [
        { title: "Account Security", slug: "account-security" },
        { title: "Two-Factor Authentication", slug: "two-factor-auth" }
      ]
    };
  }
  
  // Default response
  return {
    message: "I can help you with:\n\n• Creating and managing support tickets\n• Uploading and managing files\n• Scheduling services and appointments\n• Exporting your data\n• Account and security settings\n• General platform navigation\n\nWhat would you like to learn more about?",
    suggestions: [
      "How do I create a support ticket?",
      "How do I upload files?",
      "How do I schedule a service?",
      "Account security settings"
    ]
  };
};