import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Bot, User, Database } from 'lucide-react';
import { useAssessments } from '@/hooks/useAssessments';
import { useMongoAuthContext } from './MongoAuthProvider';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  isQuestion?: boolean;
  answers?: Array<{ text: string; value: number }>;
}

interface IntegratedChatbotScreeningProps {
  onComplete: (scores: { phq9: number; gad7: number }) => void;
  onBack: () => void;
  backend: 'supabase' | 'mongodb' | 'both';
}

// Same question data as original
const PHQ9_QUESTIONS = [
  "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
  "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
  "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
  "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
  "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
  "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself or that you are a failure or have let yourself or your family down?",
  "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?",
  "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite being so fidgety or restless that you have been moving around a lot more than usual?",
  "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?",
];

const GAD7_QUESTIONS = [
  "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
  "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
  "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?",
  "Over the last 2 weeks, how often have you been bothered by trouble relaxing?",
  "Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?",
  "Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?",
  "Over the last 2 weeks, how often have you been bothered by feeling afraid, as if something awful might happen?",
];

const ANSWER_OPTIONS = [
  { text: "Not at all", value: 0 },
  { text: "Several days", value: 1 },
  { text: "More than half the days", value: 2 },
  { text: "Nearly every day", value: 3 },
];

export const IntegratedChatbotScreening: React.FC<IntegratedChatbotScreeningProps> = ({
  onComplete,
  onBack,
  backend
}) => {
  const { isAuthenticated: isMongoAuth } = useMongoAuthContext();
  const { saveAssessment, isSaving } = useAssessments();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phq9Scores, setPhq9Scores] = useState<number[]>([]);
  const [gad7Scores, setGad7Scores] = useState<number[]>([]);
  const [isPhq9Phase, setIsPhq9Phase] = useState(true);

  const totalQuestions = PHQ9_QUESTIONS.length + GAD7_QUESTIONS.length;
  const progress = ((phq9Scores.length + gad7Scores.length) / totalQuestions) * 100;

  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome',
      type: 'bot' as const,
      content: `Hello! I'm here to help you complete a wellness assessment. This will include questions about your mood and anxiety levels over the past two weeks. Your responses will be ${backend === 'mongodb' ? 'saved to MongoDB' : backend === 'supabase' ? 'saved to Supabase' : 'saved to both MongoDB and Supabase'} for future reference.`,
    };
    setMessages([welcomeMessage]);
    
    // Add first question after a short delay
    setTimeout(() => {
      addQuestion();
    }, 1500);
  }, [backend]);

  const addQuestion = () => {
    const questions = isPhq9Phase ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
    const questionIndex = isPhq9Phase ? phq9Scores.length : gad7Scores.length;
    
    if (questionIndex < questions.length) {
      const questionMessage: Message = {
        id: `question-${Date.now()}`,
        type: 'bot',
        content: questions[questionIndex],
        isQuestion: true,
        answers: ANSWER_OPTIONS,
      };
      
      setMessages(prev => [...prev, questionMessage]);
    }
  };

  const handleAnswer = async (value: number, text: string) => {
    // Add user's answer to messages
    const userMessage: Message = {
      id: `answer-${Date.now()}`,
      type: 'user',
      content: text,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Store the score
    if (isPhq9Phase) {
      const newPhq9Scores = [...phq9Scores, value];
      setPhq9Scores(newPhq9Scores);
      
      if (newPhq9Scores.length === PHQ9_QUESTIONS.length) {
        // Transition to GAD-7
        setIsPhq9Phase(false);
        
        const transitionMessage: Message = {
          id: 'transition',
          type: 'bot',
          content: "Great! Now I'll ask you some questions about anxiety and worry.",
        };
        
        setMessages(prev => [...prev, transitionMessage]);
        
        setTimeout(() => {
          addQuestion();
        }, 1500);
      } else {
        setTimeout(() => {
          addQuestion();
        }, 1000);
      }
    } else {
      const newGad7Scores = [...gad7Scores, value];
      setGad7Scores(newGad7Scores);
      
      if (newGad7Scores.length === GAD7_QUESTIONS.length) {
        // Assessment complete
        const phq9Total = phq9Scores.reduce((sum, score) => sum + score, 0) + value;
        const gad7Total = newGad7Scores.reduce((sum, score) => sum + score, 0);
        
        // Save to appropriate backend(s)
        await saveAssessments(phq9Total, gad7Total);
        
        const completionMessage: Message = {
          id: 'complete',
          type: 'bot',
          content: `Thank you for completing the assessment! Your responses have been ${backend === 'mongodb' ? 'saved to MongoDB' : backend === 'supabase' ? 'saved to Supabase' : 'saved to both backends'}.`,
        };
        
        setMessages(prev => [...prev, completionMessage]);
        
        setTimeout(() => {
          onComplete({ phq9: phq9Total, gad7: gad7Total });
        }, 2000);
      } else {
        setTimeout(() => {
          addQuestion();
        }, 1000);
      }
    }
    
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const saveAssessments = async (phq9Score: number, gad7Score: number) => {
    const responses = {
      phq9: phq9Scores.reduce((acc, score, index) => {
        acc[`q${index + 1}`] = score;
        return acc;
      }, {} as Record<string, number>),
      gad7: gad7Scores.reduce((acc, score, index) => {
        acc[`q${index + 1}`] = score;
        return acc;
      }, {} as Record<string, number>)
    };

    // Save to MongoDB if available and requested
    if ((backend === 'mongodb' || backend === 'both') && isMongoAuth) {
      try {
        await saveAssessment('phq9', responses.phq9);
        await saveAssessment('gad7', responses.gad7);
        console.log('Assessments saved to MongoDB');
      } catch (error) {
        console.error('Failed to save to MongoDB:', error);
      }
    }

    // TODO: Add Supabase saving logic when needed
    if (backend === 'supabase' || backend === 'both') {
      console.log('Would save to Supabase:', { phq9Score, gad7Score, responses });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>Backend: {backend}</span>
                {isSaving && <span className="text-yellow-600">Saving...</span>}
              </div>
            </div>
            
            <CardTitle className="text-center">Mental Wellness Assessment</CardTitle>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted mr-4'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'bot' ? (
                        <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                      ) : (
                        <User className="h-4 w-4 mt-1 flex-shrink-0" />
                      )}
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        
                        {message.isQuestion && message.answers && (
                          <div className="space-y-2 mt-4">
                            {message.answers.map((answer) => (
                              <Button
                                key={answer.value}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAnswer(answer.value, answer.text)}
                                className="w-full justify-start text-left h-auto py-2 px-3"
                                disabled={isSaving}
                              >
                                {answer.text}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};