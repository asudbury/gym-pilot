import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/supabaseClient.ts";
import { sendSlackMessage } from "../_shared/slackUtils.ts";

interface Workout {
  id: string; // or number
  display_name: string;
  energy: number;
  energy_unit: string;
  start_date: string;
  duration: number; // in seconds
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const slackNotificationsEnabled = Deno.env.get("SLACK_NOTIFICATIONS_ENABLED") === "true";

    let user: { id: string; email?: string | null } | null = null;

    try {
      const authHeader = req.headers.get("Authorization")!;

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      );

      const {
        data: { user: authUser },
      } = await supabaseClient.auth.getUser();

      user = authUser;

      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 401,
        });
      }

      const { workouts } = (await req.json()) as {
        workouts: Workout[];
      };

      const importedWorkouts = workouts.map((workout) => ({
        user_id: user!.id,
        display_name: workout.display_name,
        start_date: workout.start_date,
        duration: Math.round(workout.duration),
        energy: workout.energy,
        energy_unit: workout.energy_unit,
        original_id: workout.id,
      }));

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data, error } = await supabaseAdmin
        .from("gym_pilot_imported_workout")
        .upsert(importedWorkouts, {
          onConflict: "user_id,original_id",
        })
        .select();

      if (error) {
        console.log("Error inserting workouts:", error);
        throw error;
      }

      if (slackNotificationsEnabled) {
        const slackChannel = Deno.env.get("WEB_IMPORTED_DATA_CHANNEL") || "C0BLQ65MCCU";

        const slackMessage = `User *${
          user.email || "Unknown"
        }* successfully imported workouts.`;

        sendSlackMessage(slackChannel, slackMessage).then((slackResult) => {
        
        if (!slackResult.success) {
            console.error(
              `Failed to send Slack import alert to channel ${slackChannel}:`,
              slackResult.error
            );
          }
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : JSON.stringify(err, null, 2);

      console.error("Error importing workouts:", errorMessage);

      if (slackNotificationsEnabled) {
        const slackChannel = Deno.env.get("WEB_ERROR_LOG_CHANNEL") || "C0BLCEF127J";

        const slackMessage = `User *${
          user?.email || "Unknown"
        }* encountered an error importing workouts: ${errorMessage}`;

        console.log(slackMessage);

        sendSlackMessage(slackChannel, slackMessage).then((slackResult) => {
          if (!slackResult.success) {
            console.error(
              `Failed to send Slack import error alert to channel ${slackChannel}:`,
              slackResult.error
            );
          }
        });
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 500,
        }
      );
    }
  },
};