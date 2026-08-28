import { serve } from 'https://deno.land/std@0.182.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.js';

// Forces Claude to return valid JSON only — no prose, no markdown fences.
const ANALYSIS_SYSTEM_PROMPT = `You are an emotional-intelligence classifier. Read the user text and return ONLY valid JSON — no markdown, no code fences, no explanation — matching this exact schema:
{
  "themes": ["string"],
  "sentiment": "string",
  "intensity": number,
  "reasoning": "string"
}

Rules:
- themes: array of 1–5 short topic phrases (e.g. "loss of a friendship", "work anxiety")
- sentiment: exactly one of: grateful | hopeful | calm | heavy | vulnerable | grieving | joyful | frustrated | anxious | content
- intensity: integer 1–5 (1 = barely noticeable, 5 = overwhelming)
- reasoning: one sentence explaining whether sharing in a public community would feel right for this entry`;

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

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const { text } = await request.json();

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // ── Step 1: Claude extracts themes / sentiment / intensity / reasoning ──
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Anthropic error:', err);
      return new Response(JSON.stringify({ error: 'Analysis service unavailable' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const claudeData = await claudeRes.json();
    const rawJson = claudeData.content?.[0]?.text ?? '{}';

    let parsed: { themes?: string[]; sentiment?: string; intensity?: number; reasoning?: string };
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      parsed = {};
    }

    const themes: string[] = Array.isArray(parsed.themes) ? parsed.themes : [];
    const sentiment: string = parsed.sentiment ?? 'calm';
    const intensity: number = typeof parsed.intensity === 'number'
      ? Math.min(5, Math.max(1, Math.round(parsed.intensity)))
      : 2;
    const reasoning: string = parsed.reasoning ?? '';

    // ── Step 2: Fetch global Hives (topics) from Supabase ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    let topics: { id: string; title: string }[] = [];
    if (supabaseUrl && supabaseKey) {
      const topicsRes = await fetch(
        `${supabaseUrl}/rest/v1/topics?user_id=is.null&select=id,title`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
      );
      if (topicsRes.ok) topics = await topicsRes.json();
    }

    let suggestedHiveId: string | null = null;

    // ── Step 3: Embedding-based Hive matching (only if themes + topics exist) ──
    if (themes.length > 0 && topics.length > 0) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey) {
        const themeQuery = themes.join(', ');
        // Batch: all topic titles first, then the theme query as the last input
        const inputs = [...topics.map((t) => t.title), themeQuery];

        const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs }),
        });

        if (embedRes.ok) {
          const embedData = await embedRes.json();
          // Embeddings are returned in the same order as inputs
          const embeddings: number[][] = embedData.data
            .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
            .map((d: { embedding: number[] }) => d.embedding);

          const themeVec = embeddings[topics.length];
          let bestScore = -Infinity;
          let bestId: string | null = null;

          topics.forEach((topic, i) => {
            const score = cosine(embeddings[i], themeVec);
            if (score > bestScore) {
              bestScore = score;
              bestId = topic.id;
            }
          });

          // Only suggest if similarity clears the threshold
          const SIMILARITY_THRESHOLD = 0.55;
          suggestedHiveId = bestScore >= SIMILARITY_THRESHOLD ? bestId : null;
        }
      }
    }

    return new Response(
      JSON.stringify({ themes, sentiment, intensity, reasoning, suggestedHiveId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    console.error('analyze-entry error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
