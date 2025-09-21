import { useState, useCallback } from 'react';
import { mongoClient, Assessment } from '@/lib/mongodb-client';
import { useMongoAuth } from './useMongoAuth';

export const useAssessments = () => {
  const { isAuthenticated } = useMongoAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadAssessments = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    
    try {
      const response = await mongoClient.getAssessments();
      
      if (response.success && response.data) {
        setAssessments(response.data);
      } else {
        console.error('Failed to load assessments:', response.error);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const saveAssessment = useCallback(async (
    type: 'phq9' | 'gad7' | 'custom',
    responses: Record<string, number>
  ) => {
    setIsSaving(true);
    
    try {
      const response = await mongoClient.createAssessment(type, responses);
      
      if (response.success && response.data) {
        // Add to local state
        setAssessments(prev => [response.data!, ...prev]);
        
        return {
          success: true,
          assessment: response.data,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to save assessment',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save assessment',
      };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const getAssessment = useCallback(async (id: string) => {
    try {
      const response = await mongoClient.getAssessment(id);
      
      if (response.success && response.data) {
        return {
          success: true,
          assessment: response.data,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to load assessment',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load assessment',
      };
    }
  }, []);

  const getLatestAssessment = useCallback((type?: 'phq9' | 'gad7') => {
    if (!assessments.length) return null;
    
    const filtered = type 
      ? assessments.filter(a => a.type === type)
      : assessments;
    
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] || null;
  }, [assessments]);

  return {
    assessments,
    isLoading,
    isSaving,
    loadAssessments,
    saveAssessment,
    getAssessment,
    getLatestAssessment,
  };
};