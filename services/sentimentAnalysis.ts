import { supabase } from '../lib/supabase';

export interface AnalysisResult {
  themes: string[];
  /** One of: grateful | hopeful | calm | heavy | vulnerable | grieving | joyful | frustrated | anxious | content */
  sentiment: string;
  /** 1 (mild) – 5 (overwhelming) */
  intensity: number;
  /** Supabase topic id of the best-matching Hive, or null if no match clears the threshold */
  suggestedHiveId: string | null;
  /** One-sentence explanation of the suggestion */
  reasoning: string;
}

export interface HiveTopic {
  id: string;
  title: string;
}

/**
 * Extracts themes/sentiment and matches the best Hive through a Supabase Edge Function.
 * Provider credentials remain server-side in the Edge Function.
 * Throws on API failure — callers should handle the error.
 */
export const analyzeEntry = async (text: string): Promise<AnalysisResult> => {
  const { data, error } = await supabase.functions.invoke('analyze-entry', {
    body: { text },
  });

  if (error) throw error;
  return data as AnalysisResult;
};

/** Fetches all global Hive topics (no user_id) for display in the destination picker. */
export const fetchHivesForDisplay = async (): Promise<HiveTopic[]> => {
  const { data } = await supabase
    .from('topics')
    .select('id, title')
    .is('user_id', null);
  return (data as HiveTopic[]) ?? [];
};

/**
 * Maps an analysis sentiment to the journal feeling tag set
 * (grateful | hopeful | calm | heavy).
 */
export const sentimentToFeeling = (sentiment: string): string => {
  const map: Record<string, string> = {
    grateful: 'grateful',
    joyful: 'grateful',
    hopeful: 'hopeful',
    content: 'hopeful',
    calm: 'calm',
    heavy: 'heavy',
    vulnerable: 'heavy',
    grieving: 'heavy',
    frustrated: 'heavy',
    anxious: 'heavy',
  };
  return map[sentiment] ?? 'calm';
};
