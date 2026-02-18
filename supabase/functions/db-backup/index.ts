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

    // Verify user is admin
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

    if (action === "restore") {
      const body = await req.json();
      if (!body.tables || typeof body.tables !== "object") {
        return new Response(
          JSON.stringify({ error: "Invalid backup file format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const results: Record<string, { success: boolean; count: number; error?: string }> = {};

      // Restore in dependency order (reverse of delete order)
      const restoreOrder = [
        "products",
        "profiles",
        "user_roles",
        "licenses",
        "orders",
        "order_items",
        "support_tickets",
        "ticket_replies",
      ];

      // Delete in reverse dependency order
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
          console.error(`Error restoring ${table}:`, error.message);
          results[table] = { success: false, count: rows.length, error: error.message };
        } else {
          results[table] = { success: true, count: rows.length };
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Database restored", results }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use ?action=export or ?action=restore" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Backup function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
