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

  const slackNotificationsEnabled = Deno.env.get("SLACK_NOTIFICATIONS_ENABLED") === "true";

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

    // Sending the Slack message asynchronously to avoid blocking the user's login response.
    if (slackNotificationsEnabled) {
        const slackChannel = Deno.env.get("WEB_LOGIN_CHANNEL") || "C0BKX94BJDP";
        const slackMessage = `User *${data.user?.email || 'Unknown'}* successfully logged in.`;

        console.log(slackMessage);

        sendSlackMessage(slackChannel, slackMessage)
          .then((slackResult) => {
            if (!slackResult.success) {
              console.error(`Failed to send Slack login alert to channel ${slackChannel}:`, slackResult.error);
            }
          });
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {

    console.log("Error during login:", err);
    
    if (slackNotificationsEnabled) {
      const slackChannel = Deno.env.get("WEB_ERROR_LOG_CHANNEL") || "C0BLCEF127J";
      const slackMessage = `Error logging in: ${err instanceof Error ? err.message : JSON.stringify(err, null, 2)}`; 
      
      console.log(slackMessage);

      sendSlackMessage(slackChannel, slackMessage)
        .then((slackResult) => {
          if (!slackResult.success) {   
            console.error(`Failed to send Slack login error alert to channel ${slackChannel}:`, slackResult.error);
          }
        });
    }

    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

export default { fetch };
