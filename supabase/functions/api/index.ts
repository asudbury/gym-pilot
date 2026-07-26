import { Hono, cors } from "hono";
import { getSupabaseAdminClient } from "@shared";

const app = new Hono();

// Middleware
app.use("*", cors());

const supabase = getSupabaseAdminClient();

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "api"
  });
});

// In a real application, you would want to organize these into separate files
// e.g. /routes/users.ts
// GET users
app.get("/users", async (c) => {
  // For this example, we'll use a placeholder 'users' table.
  // In your application, you should replace this with your actual table name.
  const { data, error } = await supabase
    .from("profiles") // Using "profiles" as a guess for the user table
    .select("*");

  if (error) {
    return c.json(
      { error: error.message },
      500
    );
  }

  return c.json(data);
});

// GET single user
app.get("/users/:id", async (c) => {
  const id = c.req.param("id");

  const { data, error } = await supabase
    .from("profiles") // Using "profiles" as a guess for the user table
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json(
      { error: error.message },
      404
    );
  }

  return c.json(data);
});

// POST create user
// Note: This is a simplified example. In a real application,
// you would likely want to use Supabase Auth to create users.
// app.post("/users", async (c) => {
//   const body = await c.req.json();

//   const { data, error } = await supabase
//     .from("profiles") // Using "profiles" as a guess for the user table
//     .insert(body)
//     .select()
//     .single();

//   if (error) {
//     return c.json(
//       { error: error.message },
//       400
//     );
//   }

//   return c.json(data, 201);
// });

// Error handler
app.onError((err, c) => {
  console.error(err);

  return c.json(
    {
      error: "Internal server error"
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Route not found"
    },
    404
  );
});

Deno.serve(app.fetch);
