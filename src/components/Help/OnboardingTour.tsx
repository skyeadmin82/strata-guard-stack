import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSettings } from '@/hooks/useSettings';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MSP Platform!',
    content: 'Let\'s take a quick tour to get you started with managing your clients and services effectively.',
  },
  {
    id: 'navigation',
    title: 'Navigation Sidebar',
    content: 'Use this sidebar to navigate between different sections like Clients, Tickets, Contracts, and Reports.',
    target: '[data-tour="sidebar"]',
    position: 'right',
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    content: 'Your dashboard provides a quick overview of key metrics, recent activities, and important alerts.',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
  },
  {
    id: 'clients',
    title: 'Client Management',
    content: 'Manage all your client relationships, contact information, and service agreements from the Clients section.',
    action: () => window.location.hash = '#/clients',
  },
  {
    id: 'tickets',
    title: 'Support Tickets',
    content: 'Track and resolve customer issues efficiently with our ticketing system. Create, assign, and monitor tickets.',
    action: () => window.location.hash = '#/tickets',
  },
  {
    id: 'notifications',
    title: 'Notification Center',
    content: 'Stay updated with important alerts and notifications. Click the bell icon to view your notifications.',
    target: '[data-tour="notifications"]',
    position: 'bottom',
  },
  {
    id: 'help',
    title: 'Help & Support',
    content: 'Need assistance? Access our help system, documentation, and support resources anytime.',
    target: '[data-tour="help"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    content: 'Great! You\'ve completed the tour. Start by adding your first client or exploring the features at your own pace.',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { saveUserSettings } = useSettings();

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  useEffect(() => {
    if (!isOpen || !step.target) return;

    const updatePosition = () => {
      const target = document.querySelector(step.target!);
      if (target) {
        const rect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        let x = rect.left + scrollLeft;
        let y = rect.top + scrollTop;

        // Adjust position based on desired placement
        switch (step.position) {
          case 'right':
            x = rect.right + scrollLeft + 20;
            y = rect.top + scrollTop + rect.height / 2 - 100;
            break;
          case 'left':
            x = rect.left + scrollLeft - 320;
            y = rect.top + scrollTop + rect.height / 2 - 100;
            break;
          case 'bottom':
            x = rect.left + scrollLeft + rect.width / 2 - 150;
            y = rect.bottom + scrollTop + 20;
            break;
          case 'top':
            x = rect.left + scrollLeft + rect.width / 2 - 150;
            y = rect.top + scrollTop - 220;
            break;
        }

        // Ensure the tour card stays within viewport
        const cardWidth = 300;
        const cardHeight = 200;
        x = Math.max(10, Math.min(x, window.innerWidth - cardWidth - 10));
        y = Math.max(10, Math.min(y, window.innerHeight - cardHeight - 10));

        setPosition({ x, y });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    // Highlight target element
    const target = document.querySelector(step.target);
    if (target) {
      target.classList.add('tour-highlight');
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      if (target) {
        target.classList.remove('tour-highlight');
      }
    };
  }, [currentStep, isOpen, step.target, step.position]);

  const handleNext = () => {
    if (step.action) {
      step.action();
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    // Mark onboarding as completed
    await saveUserSettings('preferences', {
      theme: 'system' as const,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      date_format: 'MM/dd/yyyy',
      time_format: '12h' as const,
      dashboard_layout: 'comfortable' as const,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Tour Card */}
      <Card 
        className="fixed z-[51] w-80 shadow-lg border-2 border-primary"
        style={{ 
          left: step.target ? position.x : '50%',
          top: step.target ? position.y : '50%',
          transform: step.target ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Progress value={((currentStep + 1) / tourSteps.length) * 100} className="mb-4" />

          <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{step.content}</p>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip Tour
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
              >
                {isLastStep ? 'Complete' : 'Next'}
                {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom styles injected via className */}
      <style>{`
        .tour-highlight {
          position: relative !important;
          z-index: 51 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2) !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }
        
        .tour-highlight::before {
          content: '' !important;
          position: absolute !important;
          inset: -4px !important;
          background: transparent !important;
          border: 2px solid rgb(59, 130, 246) !important;
          border-radius: 8px !important;
          animation: pulse 2s infinite !important;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [showTour, setShowTour] = useState(false);
  const { userSettings } = useSettings();

  useEffect(() => {
    // Show tour for new users who haven't completed onboarding
    if (userSettings?.preferences && !(userSettings.preferences as any).onboarding_completed) {
      // Delay showing tour to allow page to load
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [userSettings?.preferences]);

  const startTour = () => {
    setShowTour(true);
  };

  const closeTour = () => {
    setShowTour(false);
  };

  return {
    showTour,
    startTour,
    closeTour,
  };
};