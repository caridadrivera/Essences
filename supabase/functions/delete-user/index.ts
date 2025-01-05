import { serve } from 'https://deno.land/std@0.182.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Delete user account function");

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const requestBody = await request.json();
      const userId = requestBody.userId;

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: deletion_data, error: deletion_error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deletion_error) {
        console.error('Deletion error:', deletion_error);
        throw new Error('Failed to delete user: ' + deletion_error.message);
      }

      return new Response('User deleted: ' + JSON.stringify(deletion_data, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
