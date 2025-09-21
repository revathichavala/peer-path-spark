import { useState, useEffect } from "react";
import { WelcomeHero } from "@/components/WelcomeHero";
import { ChatbotScreening } from "@/components/ChatbotScreening";
import { RiskAssessmentResults } from "@/components/RiskAssessmentResults";
import { ResourceHub } from "@/components/ResourceHub";
import PeerSupportCommunity from "@/components/PeerSupportCommunity";
import CounselorBooking from "@/components/CounselorBooking";
import { BackendSelector } from "@/components/BackendSelector";
import { IntegratedChatbotScreening } from "@/components/IntegratedChatbotScreening";

type AppState = 'welcome' | 'backend-selection' | 'screening' | 'results' | 'resources' | 'peer-support' | 'counselor-booking';
type BackendChoice = 'supabase' | 'mongodb' | 'both';

interface AssessmentScores {
  phq9: number;
  gad7: number;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('welcome');
  const [selectedBackend, setSelectedBackend] = useState<BackendChoice>('supabase');
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScores | null>(null);

  // SEO: Set document title based on current state
  useEffect(() => {
    const titles = {
      welcome: 'MindSpace - Your AI Mental Health Companion',
      'backend-selection': 'Choose Backend - MindSpace',
      screening: 'Wellness Assessment - MindSpace',
      results: 'Your Results - MindSpace', 
      resources: 'Resource Hub - MindSpace',
      'peer-support': 'Peer Support Community - MindSpace',
      'counselor-booking': 'Book Counselor - MindSpace'
    };
    document.title = titles[currentState];
  }, [currentState]);

  const handleStartScreening = () => {
    setCurrentState('backend-selection');
  };

  const handleBackendSelected = (backend: BackendChoice) => {
    setSelectedBackend(backend);
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

  const handleBookCounselor = () => {
    setCurrentState('counselor-booking');
  };

  // Render current state
  switch (currentState) {
    case 'welcome':
      return <WelcomeHero onStartScreening={handleStartScreening} />;
    
      case 'backend-selection':
        return (
          <BackendSelector 
            onSelect={handleBackendSelected}
            currentBackend={selectedBackend}
          />
        );

      case 'screening':
        return (
          <IntegratedChatbotScreening
            onComplete={handleScreeningComplete}
            onBack={() => setCurrentState('backend-selection')}
            backend={selectedBackend}
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
          onBookCounselor={handleBookCounselor}
        />
      );
    
    case 'counselor-booking':
      return (
        <CounselorBooking 
          onBack={handleBackToResults}
        />
      );
    
    default:
      return <WelcomeHero onStartScreening={handleStartScreening} />;
  }
};

export default Index;
