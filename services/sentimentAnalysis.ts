import OpenAI from 'openai';
import Constants from 'expo-constants';
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

// ── JSON schema passed to gpt-4o-mini structured outputs ──────────────────────
const ANALYSIS_SCHEMA = {
  name: 'entry_analysis',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      themes: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: '1–5 short topic phrases extracted from the text',
      },
      sentiment: {
        type: 'string' as const,
        enum: [
          'grateful', 'hopeful', 'calm', 'heavy',
          'vulnerable', 'grieving', 'joyful', 'frustrated', 'anxious', 'content',
        ],
        description: 'Dominant emotional tone',
      },
      intensity: {
        type: 'integer' as const,
        description: '1 (barely noticeable) to 5 (overwhelming)',
      },
      reasoning: {
        type: 'string' as const,
        description: 'One sentence on whether sharing publicly in a Hive community would feel right for this entry',
      },
    },
    required: ['themes', 'sentiment', 'intensity', 'reasoning'] as string[],
    additionalProperties: false,
  },
} as const;

const SYSTEM_PROMPT =
  'You are an emotional-intelligence classifier. Analyze the user text and extract themes, sentiment, intensity, and whether sharing publicly would feel right.';

const SIMILARITY_THRESHOLD = 0.55;

// Module-level cache: hive id → embedding vector (lives for the app session)
const hiveEmbeddingCache = new Map<string, number[]>();

function getClient(): OpenAI {
  const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY as string | undefined;
  // dangerouslyAllowBrowser suppresses the SDK's browser-env guard in React Native
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

async function matchHiveByEmbedding(
  client: OpenAI,
  themes: string[],
): Promise<string | null> {
  if (!themes.length) return null;

  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, title')
    .is('user_id', null);

  if (error || !topics?.length) return null;

  // Identify which hive titles aren't cached yet
  const uncached = topics.filter((t) => !hiveEmbeddingCache.has(t.id));
  const themeQuery = themes.join(', ');

  // Batch embed: uncached titles + the theme query in one API call
  const inputs = [...uncached.map((t) => t.title), themeQuery];
  const embedRes = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: inputs,
  });

  // embeddings are returned in the same order as inputs
  const sorted = [...embedRes.data].sort((a, b) => a.index - b.index);

  uncached.forEach((topic, i) => {
    hiveEmbeddingCache.set(topic.id, sorted[i].embedding);
  });

  const themeVec = sorted[sorted.length - 1].embedding;

  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const topic of topics) {
    const vec = hiveEmbeddingCache.get(topic.id);
    if (!vec) continue;
    const score = cosine(vec, themeVec);
    if (score > bestScore) {
      bestScore = score;
      bestId = topic.id;
    }
  }

  return bestScore >= SIMILARITY_THRESHOLD ? bestId : null;
}

/**
 * Extracts themes/sentiment via gpt-4o-mini structured outputs, then
 * cosine-matches to the best Hive via OpenAI embeddings.
 * Throws on API failure — callers should handle the error.
 */
export const analyzeEntry = async (text: string): Promise<AnalysisResult> => {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_schema', json_schema: ANALYSIS_SCHEMA },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    max_tokens: 512,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Omit<AnalysisResult, 'suggestedHiveId'>;

  const suggestedHiveId = await matchHiveByEmbedding(client, parsed.themes ?? []);

  return { ...parsed, suggestedHiveId };
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
