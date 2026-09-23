// Supabase Edge Function: create-user
// Bypasses email confirmation entirely by using the service role key
// Deploy: supabase functions deploy create-user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name, phone, college, gender } = await req.json();

    // Use SERVICE ROLE key — only safe inside an Edge Function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create user with email_confirm = true immediately (skips confirmation email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // ← this is the key — confirms instantly, no email sent
      user_metadata: { name, phone, college, gender },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert profile row
    await supabaseAdmin.from('profiles').upsert({
      id:                  data.user.id,
      name,
      email,
      phone,
      college,
      gender,
      is_verified:         false,
      verification_status: 'unsubmitted',
      rating:              0,
      total_rides:         0,
    });

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
