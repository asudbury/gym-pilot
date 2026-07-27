import { corsHeaders, getSupabaseClient } from "../_shared/supabaseClient.ts";
import { sendSlackMessage } from "../_shared/slackUtils.ts"; // Import the Slack utility

// Manually defined type, as the import from "@supabase/functions-js/edge-runtime.d.ts" was causing issues.
type Fetch = (req: Request) => Promise<Response> | Response;

async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  // getSupabaseClient() will throw if not configured, so client is guaranteed to be available here.
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

    const slackChannel = Deno.env.get("WEB_LOGIN_CHANNEL") || "C0BKX94BJDP";
    const slackMessage = `User *${data.user?.email || 'Unknown'}* successfully logged in.`;
    // Sending the Slack message asynchronously to avoid blocking the user's login response.
    sendSlackMessage(slackChannel, slackMessage)
      .then((slackResult) => {
        if (!slackResult.success) {
          console.error(`Failed to send Slack login alert to channel ${slackChannel}:`, slackResult.error);
        }
      });
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

export default { fetch };
