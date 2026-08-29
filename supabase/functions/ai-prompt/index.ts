import { serve } from 'https://deno.land/std@0.182.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.js';

// System persona — keeps the AI in the role of a gentle journaling companion,
// never a general assistant or chatbot.
const SYSTEM_PROMPT = `You are a warm, thoughtful journaling companion for the Essences app.
Your role is to help users reflect on their thoughts and feelings through gentle, open-ended prompts.
- Ask one question at a time. Keep responses short (1–3 sentences max).
- Start with an evocative prompt like "What feels alive today?" or "What's been on your mind lately?"
- Follow the user's thread — don't change topics unless they do.
- After 2–4 exchanges, gently offer: "Would you like to share this with others in a Hive, or keep it just for yourself?"
- Never give advice or diagnose feelings. Just reflect and ask.
- Tone: calm, unhurried, like a quiet conversation over coffee.`;

const fetchGlobalHives = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/topics?select=id,title&user_id=is.null&order=title.asc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      },
    );
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Hive lookup error:', error);
    return [];
  }
};

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
    const { messages, writingMode = false } = await request.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const hives = await fetchGlobalHives();
    const hiveContext = hives.length
      ? `\n\nCurrent global Hives (use these exact titles when discussing where a conversation might fit):\n${hives.map((hive) => `- ${hive.title}`).join('\n')}\n- Recommend an existing Hive only when it genuinely fits. Never invent a title when one of these fits.`
      : '';
    const writingContext = writingMode
      ? '\n\nThe user asked for help writing about a topic. Write one polished, authentic first-person draft they could post or paste elsewhere. Return only the draft text, with no preface, analysis, Hive recommendation, or quotation marks. Keep it concise and preserve the user\'s emotional meaning.'
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + hiveContext + writingContext },
          ...messages,
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('ai-prompt error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
