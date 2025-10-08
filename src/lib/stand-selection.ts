import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type {
  ExhibitorRegistrationRow,
  ExhibitorRegistrationUpdate,
  RegistrationStatus,
} from "@/integrations/supabase/types";

export const STAND_SELECTION_DURATION_MINUTES = 60;

export type StandSelectionStatus =
  | "idle"
  | "pending"
  | "active"
  | "expired"
  | "completed";

export interface StandSelectionWindowState {
  slotStart: number | null;
  slotEnd: number | null;
  startedAt: string | null;
  expiresAt: string | null;
  choices: string | null;
  submittedAt: string | null;
  notificationsCount: number;
  lastNotificationAt: string | null;
}

export interface StandSelectionRegistration extends ExhibitorRegistrationRow {
  stand_selection_slot_start: number | null;
  stand_selection_slot_end: number | null;
  stand_selection_window_started_at: string | null;
  stand_selection_window_expires_at: string | null;
  stand_selection_choices: string | null;
  stand_selection_submitted_at: string | null;
  stand_selection_notification_last_sent: string | null;
  stand_selection_notifications_count: number;
}

export const sanitizeDocumentDigits = (value: string): string => value.replace(/[^0-9]/g, "");

export const parseStandChoices = (value: string | null): number[] => {
  if (!value) return [];
  return value
    .split(/[,\s;/]+/)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item));
};

export const serializeStandChoices = (choices: number[]): string =>
  choices
    .map((choice) => Number(choice))
    .filter((choice) => Number.isFinite(choice))
    .sort((a, b) => a - b)
    .join(",");

export const buildStandRange = (slotStart: number | null, slotEnd: number | null): number[] => {
  if (slotStart == null || slotEnd == null) {
    return [];
  }

  const start = Math.min(slotStart, slotEnd);
  const end = Math.max(slotStart, slotEnd);
  const range: number[] = [];
  for (let value = start; value <= end; value += 1) {
    range.push(value);
  }
  return range;
};

export const computeStandSelectionStatus = (
  registration: StandSelectionRegistration,
  now: Date = new Date()
): StandSelectionStatus => {
  const { stand_selection_window_started_at, stand_selection_window_expires_at, stand_selection_choices, status } =
    registration;

  const hasChoices = Boolean(stand_selection_choices);
  if (hasChoices) {
    return "completed";
  }

  if (status === "Escolha seu stand") {
    if (!stand_selection_window_started_at || !stand_selection_window_expires_at) {
      return "pending";
    }

    const expires = new Date(stand_selection_window_expires_at);
    if (Number.isNaN(expires.getTime())) {
      return "pending";
    }

    return expires.getTime() >= now.getTime() ? "active" : "expired";
  }

  return "idle";
};

export interface FetchRegistrationResult {
  registration: StandSelectionRegistration;
  normalizedDocument: string;
}

const SELECT_COLUMNS = [
  "id",
  "cpf_cnpj",
  "cpf_cnpj_normalized",
  "company_name",
  "responsible_name",
  "phone",
  "company_size",
  "business_segment",
  "stands_quantity",
  "payment_method",
  "status",
  "boleto_path",
  "boleto_uploaded_at",
  "payment_proof_path",
  "payment_proof_uploaded_at",
  "total_amount",
  "created_at",
  "updated_at",
  "stand_selection_slot_start",
  "stand_selection_slot_end",
  "stand_selection_window_started_at",
  "stand_selection_window_expires_at",
  "stand_selection_choices",
  "stand_selection_submitted_at",
  "stand_selection_notification_last_sent",
  "stand_selection_notifications_count",
] as const;

export const fetchRegistrationByDocument = async (documentValue: string): Promise<FetchRegistrationResult | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não está configurado. Informe URL e chave anon nas variáveis VITE_SUPABASE_*.");
  }

  const normalized = sanitizeDocumentDigits(documentValue);
  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from("exhibitor_registrations")
    .select(SELECT_COLUMNS.join(","))
    .or(`cpf_cnpj.eq.${normalized},cpf_cnpj_normalized.eq.${normalized}`)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    registration: data as StandSelectionRegistration,
    normalizedDocument: normalized,
  };
};

export interface StandSelectionWindowInput {
  slotStart: number;
  slotEnd: number;
  durationMinutes?: number;
  status?: RegistrationStatus;
}

export const openStandSelectionWindow = async (
  registrationId: string,
  { slotStart, slotEnd, durationMinutes = STAND_SELECTION_DURATION_MINUTES, status = "Escolha seu stand" }: StandSelectionWindowInput
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const now = new Date();
  const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);

  const payload: ExhibitorRegistrationUpdate = {
    status,
    stand_selection_slot_start: slotStart,
    stand_selection_slot_end: slotEnd,
    stand_selection_window_started_at: now.toISOString(),
    stand_selection_window_expires_at: expires.toISOString(),
    stand_selection_choices: null,
    stand_selection_submitted_at: null,
    stand_selection_notification_last_sent: null,
    stand_selection_notifications_count: 0,
    updated_at: now.toISOString(),
  };

  const { error } = await supabase
    .from("exhibitor_registrations")
    .update(payload as never)
    .eq("id", registrationId);

  if (error) {
    throw error;
  }
};

export const submitStandSelection = async (
  registrationId: string,
  choices: number[],
  options: { finalizeStatus?: RegistrationStatus } = {}
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const nowIso = new Date().toISOString();
  const serializedChoices = serializeStandChoices(choices);

  const updatePayload: ExhibitorRegistrationUpdate = {
    stand_selection_choices: serializedChoices,
    stand_selection_submitted_at: nowIso,
    stand_selection_window_expires_at: nowIso,
    updated_at: nowIso,
  };

  if (options.finalizeStatus) {
    updatePayload.status = options.finalizeStatus;
  }

  const { error } = await supabase
    .from("exhibitor_registrations")
    .update(updatePayload as never)
    .eq("id", registrationId);

  if (error) {
    throw error;
  }
};

export interface NotifyStandSelectionParams {
  registrationId: string;
  companyName: string;
  slotStart: number | null;
  slotEnd: number | null;
  windowExpiresAt: string | null;
  standsQuantity: number;
  reminder?: boolean;
}

export const triggerStandSelectionNotification = async ({
  registrationId,
  companyName,
  slotStart,
  slotEnd,
  windowExpiresAt,
  standsQuantity,
  reminder = false,
}: NotifyStandSelectionParams): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const { error } = await supabase.functions.invoke("notify-stand-selection", {
    body: {
      registrationId,
      companyName,
      slotStart,
      slotEnd,
      windowExpiresAt,
      standsQuantity,
      reminder,
    },
  });

  if (error) {
    throw error;
  }
};
