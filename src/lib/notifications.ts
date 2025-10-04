import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { RegistrationStatus } from "@/integrations/supabase/types";

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? "").trim();
const HASH_SALT = (import.meta.env.VITE_PUSH_HASH_SALT ?? "afogados-empreende-pwa").trim();

const isBrowser = typeof window !== "undefined";

const base64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const hashDocument = async (value: string): Promise<string> => {
  if (!isBrowser || typeof window.crypto?.subtle === "undefined") {
    throw new Error("O navegador não suporta o recurso de hash criptográfico necessário para as notificações.");
  }

  const encoder = new TextEncoder();
  const normalized = value.trim();
  const data = encoder.encode(`${HASH_SALT}|${normalized}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const isPushNotificationSupported = (): boolean => {
  if (!isBrowser) return false;
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
};

const ensureServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
  if (!isPushNotificationSupported()) {
    throw new Error("Notificações push não são suportadas neste dispositivo ou navegador.");
  }

  return navigator.serviceWorker.ready;
};

export const getActivePushSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushNotificationSupported()) return null;
  const registration = await ensureServiceWorkerRegistration();
  return registration.pushManager.getSubscription();
};

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    return "denied";
  }

  if (typeof Notification === "undefined") {
    return "denied";
  }

  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }

  return Notification.permission;
};

const getApplicationServerKey = (): ArrayBuffer => {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "Configure a variável VITE_WEB_PUSH_PUBLIC_KEY com a chave pública VAPID antes de ativar as notificações."
    );
  }

  return base64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer;
};

export const hasActiveSubscription = async (registrationId: string, documentDigits: string): Promise<boolean> => {
  if (!registrationId || !documentDigits) {
    return false;
  }

  if (!isSupabaseConfigured()) {
    console.warn("Supabase não está configurado: impossível verificar inscrições de notificações.");
    return false;
  }

  const pushSubscription = await getActivePushSubscription();
  if (!pushSubscription) {
    return false;
  }

  const hashedCpf = await hashDocument(documentDigits);
  const { data, error } = await supabase
    .from("web_push_subscriptions")
    .select("id")
    .eq("registration_id", registrationId)
    .eq("endpoint", pushSubscription.endpoint)
    .eq("cpf_hash", hashedCpf)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[Push] Erro ao consultar assinaturas: ", error);
    return false;
  }

  return Boolean(data);
};

interface SubscribeForUpdatesParams {
  registrationId: string;
  cpfDigits: string;
  status: RegistrationStatus;
  companyName: string;
}

export const subscribeForRegistrationUpdates = async ({
  registrationId,
  cpfDigits,
  status,
  companyName,
}: SubscribeForUpdatesParams): Promise<PushSubscription> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não está configurado. Informe a URL e a chave anon nas variáveis VITE_SUPABASE_*.");
  }

  const registration = await ensureServiceWorkerRegistration();
  const applicationServerKey = getApplicationServerKey();

  let pushSubscription = await registration.pushManager.getSubscription();
  if (!pushSubscription) {
    pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  const hashedCpf = await hashDocument(cpfDigits);

  const { error } = await supabase
    .from("web_push_subscriptions")
    .upsert(
      {
        registration_id: registrationId,
        cpf_hash: hashedCpf,
        endpoint: pushSubscription.endpoint,
        subscription: pushSubscription.toJSON(),
        status: "active",
        last_status: status,
        company_name: companyName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "registration_id,endpoint,cpf_hash" }
    );

  if (error) {
    console.error("[Push] Erro ao salvar assinatura: ", error);
    throw new Error("Não foi possível salvar sua inscrição para notificações. Tente novamente em instantes.");
  }

  return pushSubscription;
};

export const unsubscribeFromRegistrationUpdates = async (
  registrationId: string,
  documentDigits: string
): Promise<void> => {
  const pushSubscription = await getActivePushSubscription();
  if (!pushSubscription) {
    return;
  }

  try {
    await pushSubscription.unsubscribe();
  } catch (error) {
    console.warn("[Push] Não foi possível cancelar inscrição localmente:", error);
  }

  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const hashedCpf = await hashDocument(documentDigits);
    const { error } = await supabase
      .from("web_push_subscriptions")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("registration_id", registrationId)
      .eq("endpoint", pushSubscription.endpoint)
      .eq("cpf_hash", hashedCpf);

    if (error) {
      console.error("[Push] Erro ao atualizar inscrição no Supabase:", error);
    }
  } catch (error) {
    console.error("[Push] Falha ao sincronizar cancelamento com banco: ", error);
  }
};
