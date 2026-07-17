import { serve } from 'https://deno.land/std@0.182.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.js';

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const requestBody = await request.json();
      const { text } = requestBody;

      if (!text) {
        return new Response(
          JSON.stringify({ error: 'Text is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key not configured' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      // Call OpenAI Moderation API
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-moderation-latest',
          input: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to moderate content' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status,
          }
        );
      }

      const data = await response.json();
      const result = data.results[0];

      return new Response(
        JSON.stringify({
          flagged: result.flagged,
          categories: result.categories,
          category_scores: result.category_scores,
          severity: calculateSeverity(result.category_scores),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error('Error in moderation function:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

/**
 * Calculate severity level based on category scores
 * @param {Object} scores - Category scores from OpenAI
 * @returns {string} 'high' | 'medium' | 'low'
 */
function calculateSeverity(scores) {
  const dangerousCategories = [
    scores.violence,
    scores.harassment,
    scores.hate,
    scores.self_harm,
  ];

  const maxScore = Math.max(...dangerousCategories);

  if (maxScore > 0.7) return 'high';
  if (maxScore > 0.4) return 'medium';
  return 'low';
}
