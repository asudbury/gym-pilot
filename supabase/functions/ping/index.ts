import "@supabase/functions-js/edge-runtime.d.ts";

export default {
  async fetch(req: Request) {
    return Response.json({
      status: "alive",
    });
  },
};