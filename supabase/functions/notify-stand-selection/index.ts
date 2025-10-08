// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0?target=deno";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? Deno.env.get("PUSH_VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY =
  Deno.env.get("VAPID_PRIVATE_KEY") ?? Deno.env.get("PUSH_VAPID_PRIVATE_KEY");
const VAPID_CONTACT =
  Deno.env.get("VAPID_CONTACT_EMAIL") ??
  Deno.env.get("PUSH_VAPID_CONTACT") ??
  "mailto:contato@afogadosempreende.com";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase credentials are missing for the notify-stand-selection function.");
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("VAPID keys are missing for the notify-stand-selection function.");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);

const DISPLAY_TIMEZONE =
  Deno.env.get("STAND_SELECTION_TIMEZONE") ?? Deno.env.get("TIMEZONE") ?? "America/Recife";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

type NotifyStandSelectionRequest = {
  registrationId?: string;
  companyName?: string;
  slotStart?: number;
  slotEnd?: number;
  windowExpiresAt?: string;
  standsQuantity?: number;
  reminder?: boolean;
};

const formatDeadline = (deadlineIso: string | null | undefined) => {
  if (!deadlineIso) return null;
  try {
    const deadline = new Date(deadlineIso);
    if (Number.isNaN(deadline.getTime())) {
      return null;
    }

    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: DISPLAY_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return formatter.format(deadline);
  } catch (error) {
    console.warn("Failed to format deadline", error);
    return null;
  }
};

const buildNotificationContent = (
  companyName: string,
  slotStart: number | null,
  slotEnd: number | null,
  deadline: string | null,
  standsQuantity: number | null,
  reminder: boolean
) => {
  const title = reminder ? "Lembrete: escolha seu stand" : "Escolha seu stand liberada";
  const range = slotStart !== null && slotEnd !== null ? `${slotStart}-${slotEnd}` : null;
  const quantity = standsQuantity && standsQuantity > 0 ? standsQuantity : null;

  const deadlineText = deadline ? ` até ${deadline}` : "";
  const rangeText = range ? ` Intervalo disponível: ${range}.` : "";
  const quantityText = quantity ? ` Selecione ${quantity} ${quantity > 1 ? "stands" : "stand"}.` : "";

  return {
    title,
    body: `${companyName} já pode escolher o stand${deadlineText}.${rangeText}${quantityText}`.trim(),
  };
};

const markSubscriptionAsRevoked = async (subscriptionId: string) => {
  await supabase
    .from("web_push_subscriptions")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", subscriptionId);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: "Function not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: NotifyStandSelectionRequest;
  try {
    payload = (await req.json()) as NotifyStandSelectionRequest;
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload", details: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const registrationId = payload.registrationId?.trim();
  const companyName = payload.companyName?.trim() ?? "Seu cadastro";
  const slotStart = typeof payload.slotStart === "number" ? payload.slotStart : null;
  const slotEnd = typeof payload.slotEnd === "number" ? payload.slotEnd : null;
  const reminder = Boolean(payload.reminder);

  if (!registrationId) {
    return new Response(JSON.stringify({ error: "registrationId is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const formattedDeadline = formatDeadline(payload.windowExpiresAt ?? null);
  const standsQuantity = typeof payload.standsQuantity === "number" ? payload.standsQuantity : null;

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("web_push_subscriptions")
    .select("id, endpoint, subscription")
    .eq("registration_id", registrationId)
    .eq("status", "active");

  if (subscriptionsError) {
    console.error("[notify-stand-selection] Error fetching subscriptions", subscriptionsError);
    return new Response(JSON.stringify({ error: "Failed to load subscriptions" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.info("[notify-stand-selection] Nenhuma assinatura para", registrationId);
    return new Response(
      JSON.stringify({ delivered: 0, failed: 0, message: "No active subscriptions" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const notificationContent = buildNotificationContent(
    companyName,
    slotStart,
    slotEnd,
    formattedDeadline,
    standsQuantity,
    reminder
  );

  const payloadData = {
    registrationId,
    companyName,
    slotStart,
    slotEnd,
    windowExpiresAt: payload.windowExpiresAt ?? null,
    standsQuantity,
    reminder,
    sentAt: new Date().toISOString(),
  };

  let delivered = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          subscription.subscription as webpush.PushSubscription,
          JSON.stringify({
            notification: {
              title: notificationContent.title,
              body: notificationContent.body,
              data: payloadData,
              badge: "/icon-192.png",
              icon: "/icon-192.png",
            },
          })
        );
        delivered += 1;
      } catch (error) {
        failed += 1;
        const statusCode = error?.statusCode ?? error?.status ?? error?.response?.status;
        console.error("[notify-stand-selection] Failed to send notification", {
          endpoint: subscription.endpoint,
          statusCode,
          error,
        });
        if (statusCode === 404 || statusCode === 410) {
          await markSubscriptionAsRevoked(subscription.id);
        }
      }
    })
  );

  if (delivered > 0) {
    const { data: registration, error: registrationError } = await supabase
      .from("exhibitor_registrations")
      .select("stand_selection_notifications_count")
      .eq("id", registrationId)
      .maybeSingle();

    if (registrationError) {
      console.error("[notify-stand-selection] Failed to fetch registration for counter", registrationError);
    } else {
      const currentCount = registration?.stand_selection_notifications_count ?? 0;
      const update = await supabase
        .from("exhibitor_registrations")
        .update({
          stand_selection_notification_last_sent: new Date().toISOString(),
          stand_selection_notifications_count: currentCount + delivered,
        })
        .eq("id", registrationId);

      if (update.error) {
        console.error("[notify-stand-selection] Failed to update notification metadata", update.error);
      }
    }
  }

  console.info("[notify-stand-selection] Finished", { delivered, failed, registrationId });

  return new Response(JSON.stringify({ delivered, failed }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
