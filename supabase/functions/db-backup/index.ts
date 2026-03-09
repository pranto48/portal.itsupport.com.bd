import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const tables = [
      "products",
      "profiles",
      "user_roles",
      "licenses",
      "orders",
      "order_items",
      "support_tickets",
      "ticket_replies",
    ];

    // Export all tables
    if (action === "export") {
      const backup: Record<string, unknown[]> = {};
      for (const table of tables) {
        const { data, error } = await adminClient.from(table).select("*");
        if (error) {
          console.error(`Error exporting ${table}:`, error.message);
          backup[table] = [];
        } else {
          backup[table] = data || [];
        }
      }

      const result = {
        version: 1,
        created_at: new Date().toISOString(),
        created_by: user.email,
        tables: backup,
      };

      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="portal_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json"`,
        },
      });
    }

    // Per-table restore (new endpoint for progress tracking)
    if (action === "restore-table") {
      const tableName = url.searchParams.get("table");
      const phase = url.searchParams.get("phase"); // "delete" or "restore"

      if (!tableName || !tables.includes(tableName)) {
        return new Response(
          JSON.stringify({ error: `Invalid table: ${tableName}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (phase === "delete") {
        const { error } = await adminClient
          .from(tableName)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) {
          console.error(`Error deleting ${tableName}:`, error.message);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, table: tableName, phase: "delete" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (phase === "restore") {
        const body = await req.json();
        const rows = body.rows;

        if (!rows || !Array.isArray(rows)) {
          return new Response(
            JSON.stringify({ error: "Invalid rows data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (rows.length === 0) {
          return new Response(
            JSON.stringify({ success: true, table: tableName, count: 0 }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await adminClient.from(tableName).upsert(rows, { onConflict: "id" });
        if (error) {
          console.error(`Error restoring ${tableName}:`, error.message);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, table: tableName, count: rows.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid phase. Use phase=delete or phase=restore" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Legacy full restore (kept for compatibility)
    if (action === "restore") {
      const body = await req.json();
      if (!body.tables || typeof body.tables !== "object") {
        return new Response(
          JSON.stringify({ error: "Invalid backup file format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results: Record<string, { success: boolean; count: number; error?: string }> = {};
      const restoreOrder = [...tables];
      const deleteOrder = [...restoreOrder].reverse();

      for (const table of deleteOrder) {
        if (body.tables[table]) {
          await adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        }
      }

      for (const table of restoreOrder) {
        const rows = body.tables[table];
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          results[table] = { success: true, count: 0 };
          continue;
        }
        const { error } = await adminClient.from(table).upsert(rows, { onConflict: "id" });
        if (error) {
          results[table] = { success: false, count: rows.length, error: error.message };
        } else {
          results[table] = { success: true, count: rows.length };
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Database restored", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Backup function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
