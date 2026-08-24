import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../lib/supabaseConfig';

// Calls the ai-prompt Edge Function with the full conversation history.
// messages: Array<{ role: 'user'|'assistant', content: string }>
// Returns { success: boolean, reply?: string, msg?: string }
export const getAIReply = async (messages) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, msg: err.error || 'AI service unavailable' };
    }

    const data = await response.json();
    return { success: true, reply: data.reply };
  } catch (error) {
    return { success: false, msg: 'Could not reach AI service' };
  }
};
