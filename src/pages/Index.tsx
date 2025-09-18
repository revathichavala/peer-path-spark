import { useState, useEffect } from "react";
import { WelcomeHero } from "@/components/WelcomeHero";
import { ChatbotScreening } from "@/components/ChatbotScreening";
import { RiskAssessmentResults } from "@/components/RiskAssessmentResults";
import { ResourceHub } from "@/components/ResourceHub";
import PeerSupportCommunity from "@/components/PeerSupportCommunity";

type AppState = 'welcome' | 'screening' | 'results' | 'resources' | 'peer-support' | 'counselor-booking';

interface AssessmentScores {
  phq9: number;
  gad7: number;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('welcome');
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScores | null>(null);

  // SEO: Set document title based on current state
  useEffect(() => {
    const titles = {
      welcome: 'MindSpace - Your AI Mental Health Companion',
      screening: 'Wellness Assessment - MindSpace',
      results: 'Your Results - MindSpace', 
      resources: 'Resource Hub - MindSpace',
      'peer-support': 'Peer Support Community - MindSpace',
      'counselor-booking': 'Book Counselor - MindSpace'
    };
    document.title = titles[currentState];
  }, [currentState]);

  const handleStartScreening = () => {
    setCurrentState('screening');
  };

  const handleScreeningComplete = (scores: AssessmentScores) => {
    setAssessmentScores(scores);
    setCurrentState('results');
  };

  const handleResourceSelect = (resource: string) => {
    switch (resource) {
      case 'mindfulness-videos':
      case 'self-care-articles':
        setCurrentState('resources');
        break;
      case 'peer-support':
      case 'peer-chat':
        setCurrentState('peer-support');
        break;
      case 'counselor-booking':
        setCurrentState('counselor-booking');
        break;
      case 'crisis-support':
        // In a real app, this would redirect to crisis resources
        window.open('tel:988', '_self');
        break;
      default:
        setCurrentState('resources');
    }
  };

  const handleBackToWelcome = () => {
    setCurrentState('welcome');
    setAssessmentScores(null);
  };

  const handleBackToResults = () => {
    setCurrentState('results');
  };

  // Render current state
  switch (currentState) {
    case 'welcome':
      return <WelcomeHero onStartScreening={handleStartScreening} />;
    
    case 'screening':
      return (
        <ChatbotScreening 
          onComplete={handleScreeningComplete}
          onBack={handleBackToWelcome}
        />
      );
    
    case 'results':
      return assessmentScores ? (
        <RiskAssessmentResults 
          scores={assessmentScores}
          onResourceSelect={handleResourceSelect}
        />
      ) : (
        <WelcomeHero onStartScreening={handleStartScreening} />
      );
    
    case 'resources':
      return (
        <ResourceHub 
          onBack={handleBackToResults}
          initialFilter="all"
        />
      );
    
    case 'peer-support':
      return (
        <PeerSupportCommunity 
          onBack={handleBackToResults}
        />
      );
    
    case 'counselor-booking':
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Counselor Booking</h1>
            <p className="text-muted-foreground mb-6">
              For a complete counselor booking system with calendar integration and professional profiles, 
              we'd need to connect this platform to a backend database.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This would include features like appointment scheduling, counselor availability management, 
              secure messaging, and insurance verification.
            </p>
            <button 
              onClick={handleBackToResults}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-4 font-medium shadow-gentle hover:shadow-comfort transition-all duration-300"
            >
              Back to Results
            </button>
          </div>
        </div>
      );
    
    default:
      return <WelcomeHero onStartScreening={handleStartScreening} />;
  }
};

export default Index;
