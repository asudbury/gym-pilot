import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/supabaseClient.ts";

type HealthkitPayload = {
  device?: string | null;
  recorded_at?: string | null;
  steps?: string | number | null;
  heart_rate?: string | number | null;
  active_energy?: string | number | null;
  user_id?: string | null;
};

function normalizeTimestamp(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const payload = (await req.json()) as HealthkitPayload;
      const recordedAt = normalizeTimestamp(payload.recorded_at);

      if (!recordedAt) {
        return new Response(
          JSON.stringify({
            error: "A valid recorded_at timestamp is required.",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 400,
          },
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data, error } = await supabaseAdmin
        .from("healthkit_data")
        .insert({
          user_id: payload.user_id ?? null,
          device: payload.device ?? null,
          recorded_at: recordedAt,
          steps: payload.steps ?? null,
          heart_rate: payload.heart_rate ?? null,
          active_energy: payload.active_energy ?? null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ ok: true, data }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err, null, 2);

      console.error("Error ingesting HealthKit data:", errorMessage);

      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      });
    }
  },
};
