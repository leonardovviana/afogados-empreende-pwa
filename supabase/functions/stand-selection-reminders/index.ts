declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-expect-error -- Remote module types are not available in the local lint environment
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-expect-error -- Remote module types are not available in the local lint environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase credentials are missing for the stand-selection-reminders function.");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const REMINDER_INTERVAL_MINUTES = Number(
  Deno.env.get("STAND_SELECTION_REMINDER_INTERVAL_MINUTES") ?? "5"
);
const MAX_BATCH = Number(Deno.env.get("STAND_SELECTION_REMINDER_BATCH") ?? "25");
const NOTIFY_ENDPOINT = `${SUPABASE_URL}/functions/v1/notify-stand-selection`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const minutesAgo = (minutes: number): string => {
  const now = Date.now();
  return new Date(now - minutes * 60 * 1000).toISOString();
};

type ActiveSubscriptionRow = {
  registration_id: string | null;
};

type ExhibitorRegistrationRow = {
  id: string;
  company_name: string | null;
  stands_quantity: number | null;
  stand_selection_slot_start: number | null;
  stand_selection_slot_end: number | null;
  stand_selection_window_expires_at: string | null;
  stand_selection_window_started_at: string | null;
  stand_selection_notification_last_sent: string | null;
  stand_selection_choices: unknown;
};

type NotificationResult = {
  delivered?: number;
  failed?: number;
};

const fetchActiveSubscriptions = async (): Promise<Set<string>> => {
  const { data, error } = (await supabase
    .from("web_push_subscriptions")
    .select("registration_id")
    .eq("status", "active")
    .not("registration_id", "is", null)) as {
    data: ActiveSubscriptionRow[] | null;
    error: unknown;
  };

  if (error) {
    console.error("[stand-selection-reminders] Failed to load active subscriptions", error);
    throw error;
  }

  return new Set(
    (data ?? [])
      .map((item) => item.registration_id ?? null)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );
};

const fetchEligibleRegistrations = async (activeIds: Set<string>): Promise<ExhibitorRegistrationRow[]> => {
  const nowIso = new Date().toISOString();
  const sinceIso = minutesAgo(REMINDER_INTERVAL_MINUTES);

  const { data, error } = (await supabase
    .from("exhibitor_registrations")
    .select(
      [
        "id",
        "company_name",
        "stands_quantity",
        "stand_selection_slot_start",
        "stand_selection_slot_end",
        "stand_selection_window_expires_at",
        "stand_selection_window_started_at",
        "stand_selection_notification_last_sent",
        "stand_selection_choices",
      ].join(",")
    )
    .eq("status", "Escolha seu stand")
    .is("stand_selection_choices", null)
    .not("stand_selection_slot_start", "is", null)
    .not("stand_selection_slot_end", "is", null)
    .lte("stand_selection_window_started_at", nowIso)
    .gt("stand_selection_window_expires_at", nowIso)
    .or(`stand_selection_notification_last_sent.is.null,stand_selection_notification_last_sent.lt.${sinceIso}`)
    .order("stand_selection_notification_last_sent", { ascending: true, nullsFirst: true })
    .limit(MAX_BATCH)) as {
    data: ExhibitorRegistrationRow[] | null;
    error: unknown;
  };

  if (error) {
    console.error("[stand-selection-reminders] Failed to load registrations", error);
    throw error;
  }

  return (data ?? []).filter((registration) => activeIds.has(registration.id));
};

const triggerNotification = async (
  registration: ExhibitorRegistrationRow
): Promise<NotificationResult> => {
  try {
    const response = await fetch(NOTIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "x-client-info": "stand-selection-reminders",
      },
      body: JSON.stringify({
        registrationId: registration.id,
        companyName: registration.company_name,
        slotStart: registration.stand_selection_slot_start,
        slotEnd: registration.stand_selection_slot_end,
        windowExpiresAt: registration.stand_selection_window_expires_at,
        standsQuantity: registration.stands_quantity,
        reminder: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[stand-selection-reminders] notify-stand-selection failed", {
        status: response.status,
        body,
      });
      return { delivered: 0, failed: 1 };
    }

    const payload = (await response.json().catch(() => ({ delivered: 0, failed: 0 }))) as
      | NotificationResult
      | undefined;
    return payload ?? { delivered: 0, failed: 0 };
  } catch (error) {
    console.error("[stand-selection-reminders] Error invoking notify-stand-selection", error);
    return { delivered: 0, failed: 1 };
  }
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Function not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const activeIds = await fetchActiveSubscriptions();
    if (activeIds.size === 0) {
      return new Response(JSON.stringify({ processed: 0, delivered: 0, failed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  const registrations = await fetchEligibleRegistrations(activeIds);
    let processed = 0;
    let delivered = 0;
    let failed = 0;

    for (const registration of registrations) {
      processed += 1;
      const result = await triggerNotification(registration);
      delivered += Number(result.delivered ?? 0);
      failed += Number(result.failed ?? 0);
    }

    return new Response(
      JSON.stringify({
        processed,
        delivered,
        failed,
        intervalMinutes: REMINDER_INTERVAL_MINUTES,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[stand-selection-reminders] Unexpected error", error);
    return new Response(JSON.stringify({ error: "Internal error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
