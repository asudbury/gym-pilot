import { getSupabaseClient, corsHeaders } from "@shared";

// Manually defined type, as the import from "@supabase/functions-js/edge-runtime.d.ts" was causing issues.
type Fetch = (req: Request) => Promise<Response> | Response;

async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error("Supabase client is not available") };
  }
  return client.auth.signInWithPassword({ email, password });
}

const fetch: Fetch = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data, error } = await signInWithPassword(email, password);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.status || 500,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

export default { fetch };
