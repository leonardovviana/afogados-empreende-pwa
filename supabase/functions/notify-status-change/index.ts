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
  Deno.env.get("VAPID_CONTACT_EMAIL") ?? Deno.env.get("PUSH_VAPID_CONTACT") ?? "mailto:contato@afogadosempreende.com";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase credentials are missing for the notify-status-change function.");
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("VAPID keys are missing for the notify-status-change function.");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);

type RegistrationStatus =
  | "Pendente"
  | "Aguardando pagamento"
  | "Participação confirmada"
  | "Cancelado"
  | "Escolha seu stand";

type NotificationPayload = {
  registrationId: string;
  status: RegistrationStatus;
  companyName: string;
  sentAt: string;
};

type NotifyStatusRequest = {
  registrationId?: string;
  status?: RegistrationStatus;
  companyName?: string;
  dryRun?: boolean;
};

const buildNotificationContent = (status: RegistrationStatus, companyName: string) => {
  switch (status) {
    case "Aguardando pagamento":
      return {
        title: "Cadastro aprovado!",
        body: `${companyName} está pré-aprovada. Baixe o boleto e garanta seu estande dentro do prazo.`,
      };
    case "Participação confirmada":
      return {
        title: "Participação confirmada",
        body: `${companyName} teve o pagamento validado. Prepare-se para a feira!`,
      };
    case "Escolha seu stand":
      return {
        title: "Escolha de stand liberada",
        body: `${companyName} já pode acessar o portal e selecionar o stand disponível.`,
      };
    case "Cancelado":
      return {
        title: "Atualização de cadastro",
        body: `${companyName} teve o cadastro atualizado para cancelado. Contate a coordenação em caso de dúvidas.`,
      };
    case "Pendente":
    default:
      return {
        title: "Cadastro em análise",
        body: `${companyName} segue em análise. Avisaremos assim que houver novidades.`,
      };
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const markSubscriptionAsRevoked = async (subscriptionId: string) => {
  await supabase
    .from("web_push_subscriptions")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", subscriptionId);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

  let payload: NotifyStatusRequest;
  try {
    payload = (await req.json()) as NotifyStatusRequest;
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload", details: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const registrationId = payload.registrationId?.trim();
  const status = payload.status;
  const companyName = payload.companyName?.trim() ?? "Seu cadastro";

  if (!registrationId || !status) {
    return new Response(JSON.stringify({ error: "registrationId and status are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: subscriptions, error } = await supabase
    .from("web_push_subscriptions")
    .select("id, endpoint, subscription")
    .eq("registration_id", registrationId)
    .eq("status", "active");

  if (error) {
    console.error("[notify-status-change] Error fetching subscriptions", error);
    return new Response(JSON.stringify({ error: "Failed to load subscriptions" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.info("[notify-status-change] Nenhuma assinatura para", registrationId);
    return new Response(JSON.stringify({ delivered: 0, skipped: 0, message: "No active subscriptions" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const notificationContent = buildNotificationContent(status, companyName);
  const sentAt = new Date().toISOString();
  const notificationPayload: NotificationPayload = {
    registrationId,
    status,
    companyName,
    sentAt,
  };

  let delivered = 0;
  let failed = 0;

  if (payload.dryRun) {
    return new Response(
      JSON.stringify({
        delivered,
        failed,
        dryRun: true,
        preview: {
          ...notificationContent,
          payload: notificationPayload,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription.subscription as webpush.PushSubscription, JSON.stringify({
          notification: {
            title: notificationContent.title,
            body: notificationContent.body,
            data: notificationPayload,
            badge: "/icon-192.png",
            icon: "/icon-192.png",
          },
        }));
        console.info("[notify-status-change] Notification sent", {
          registrationId,
          endpoint: subscription.endpoint,
          status,
        });
        delivered += 1;
      } catch (err) {
        failed += 1;
        const statusCode = err?.statusCode ?? err?.status ?? err?.response?.status;
        console.error("[notify-status-change] Failed to send notification", {
          endpoint: subscription.endpoint,
          statusCode,
          error: err,
        });
        if (statusCode === 404 || statusCode === 410) {
          await markSubscriptionAsRevoked(subscription.id);
        }
      }
    })
  );

  console.info("[notify-status-change] Finished", { delivered, failed, registrationId });

  return new Response(JSON.stringify({ delivered, failed }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
