import logoShield from "@/assets/logoescudo.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  clearSupabaseBrowserConfig,
  getSupabaseConfigSnapshot,
  isSupabaseConfigured,
  persistSupabaseBrowserConfig,
  refreshSupabaseClient,
  supabase,
} from "@/integrations/supabase/client";
import type { AdminProfileRow, ExhibitorRegistrationRow } from "@/integrations/supabase/types";
import { calculateTotalAmount, formatCurrencyBRL, getPaymentMethodDisplayLabel } from "@/lib/pricing";
import {
  RegistrationSettingsNotProvisionedError,
  fetchRegistrationSettings,
  upsertRegistrationSettings,
} from "@/lib/registration-settings";
import {
  STAND_SELECTION_DURATION_MINUTES,
  buildStandRange,
  computeStandSelectionStatus,
  openStandSelectionWindow,
  parseStandChoices,
  serializeStandChoices,
  triggerStandSelectionNotification,
  type StandSelectionRegistration,
  type StandSelectionStatus,
} from "@/lib/stand-selection";
import { buildBoletoFilePath } from "@/lib/storage";
import type { PostgrestError } from "@supabase/supabase-js";
import { BellRing, Clock, Download, Edit3, Loader2, Lock, LogOut, RefreshCw, Search, Send, Trash2, Unlock, UploadCloud } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { utils as XLSXUtils, writeFile as writeXlsxFile } from "xlsx";

const MISSING_SUPABASE_MESSAGE =
  "As credenciais do Supabase ainda não foram informadas. Preencha o URL e a chave anon nas variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ou use o formulário abaixo para salvar as credenciais apenas neste navegador.";

const statusOptions = [
  "Pendente",
  "Aguardando pagamento",
  "Escolha seu stand",
  "Participação confirmada",
  "Cancelado",
] as const;

type RegistrationStatus = (typeof statusOptions)[number];

const STATUS_BADGE_VARIANTS: Record<RegistrationStatus, string> = Object.freeze({
  "Pendente": "bg-accent/20 text-accent",
  "Aguardando pagamento": "bg-amber-100 text-amber-700",
  "Escolha seu stand": "bg-indigo-100 text-indigo-700",
  "Participação confirmada": "bg-secondary/20 text-secondary",
  "Cancelado": "bg-destructive/20 text-destructive",
});

const STATUS_NORMALIZATION_MAP: Record<string, RegistrationStatus> = {
  pendente: "Pendente",
  "aguardando pagamento": "Aguardando pagamento",
  "aprovado aguardando pagamento": "Aguardando pagamento",
  "participacao confirmada": "Participação confirmada",
  "stand confirmado": "Participação confirmada",
  aprovado: "Participação confirmada",
  "escolha seu stand": "Escolha seu stand",
  recusado: "Cancelado",
  cancelado: "Cancelado",
};

const normalizeStatusKey = (value: string | null | undefined): string | null => {
  if (!value) return null;

  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const normalizeStatus = (status: string): RegistrationStatus => {
  const key = normalizeStatusKey(status);
  if (!key) {
    return "Pendente";
  }

  return STATUS_NORMALIZATION_MAP[key] ?? "Pendente";
};

const normalizePaymentMethod = (method: string): string => {
  switch (method) {
    case "À vista":
    case "PIX":
      return "R$ 700,00 Lançamento";
    case "Parcelado":
      return "R$ 850,00 Após o lançamento";
    case "Boleto":
      return "R$ 750,00 Dois ou mais stands";
    default:
      return method;
  }
};

const isRegistrationStatus = (value: string): value is RegistrationStatus =>
  (statusOptions as readonly string[]).includes(value);

const sanitizeDigits = (value: string): string => value.replace(/[^0-9]/g, "");

interface Registration {
  id: string;
  cpf_cnpj: string;
  cpf_cnpj_normalized: string | null;
  company_name: string;
  responsible_name: string;
  phone: string;
  company_size: string;
  business_segment: string;
  stands_quantity: number;
  payment_method: string;
  status: RegistrationStatus;
  boleto_path: string | null;
  boleto_uploaded_at: string | null;
  payment_proof_path: string | null;
  payment_proof_uploaded_at: string | null;
  created_at: string;
  updated_at: string | null;
  total_amount: number;
  stand_selection_slot_start: number | null;
  stand_selection_slot_end: number | null;
  stand_selection_window_started_at: string | null;
  stand_selection_window_expires_at: string | null;
  stand_selection_choices: string | null;
  stand_selection_submitted_at: string | null;
  stand_selection_notification_last_sent: string | null;
  stand_selection_notifications_count: number;
}

const mapRowToRegistration = (row: ExhibitorRegistrationRow): Registration => {
  const paymentMethod = normalizePaymentMethod(String(row.payment_method ?? ""));
  const standsQuantity = Number(row.stands_quantity ?? 1) || 1;
  const fallbackTotal = calculateTotalAmount(standsQuantity, paymentMethod);
  const storedTotal = Number(row.total_amount ?? 0);
  const createdAt = row.created_at ?? new Date().toISOString();

  return {
    id: row.id,
    cpf_cnpj: String(row.cpf_cnpj ?? ""),
    cpf_cnpj_normalized: row.cpf_cnpj_normalized ?? null,
    company_name: String(row.company_name ?? ""),
    responsible_name: String(row.responsible_name ?? ""),
    phone: String(row.phone ?? ""),
    company_size: String(row.company_size ?? ""),
    business_segment: String(row.business_segment ?? ""),
    stands_quantity: standsQuantity,
    payment_method: paymentMethod,
    status: normalizeStatus(String(row.status ?? "")),
    boleto_path: row.boleto_path ?? null,
    boleto_uploaded_at: row.boleto_uploaded_at ?? null,
    payment_proof_path: row.payment_proof_path ?? null,
    payment_proof_uploaded_at: row.payment_proof_uploaded_at ?? null,
    created_at: createdAt,
    updated_at: row.updated_at ?? null,
    total_amount: storedTotal > 0 ? storedTotal : fallbackTotal,
    stand_selection_slot_start: row.stand_selection_slot_start ?? null,
    stand_selection_slot_end: row.stand_selection_slot_end ?? null,
    stand_selection_window_started_at: row.stand_selection_window_started_at ?? null,
    stand_selection_window_expires_at: row.stand_selection_window_expires_at ?? null,
    stand_selection_choices: row.stand_selection_choices ?? null,
    stand_selection_submitted_at: row.stand_selection_submitted_at ?? null,
    stand_selection_notification_last_sent: row.stand_selection_notification_last_sent ?? null,
    stand_selection_notifications_count: Number(row.stand_selection_notifications_count ?? 0),
  };
};

const isPostgrestError = (error: unknown): error is PostgrestError =>
  typeof error === "object" && error !== null && "code" in error && "message" in error;

const isNoRowsError = (error: unknown): boolean => isPostgrestError(error) && error.code === "PGRST116";

const isStoragePermissionError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { statusCode?: number; status?: number; message?: string };
  const status =
    typeof candidate.statusCode === "number"
      ? candidate.statusCode
      : typeof candidate.status === "number"
        ? candidate.status
        : null;

  if (status === 403) {
    return true;
  }

  if (typeof candidate.message === "string") {
    return /permission|auth/i.test(candidate.message);
  }

  return false;
};

const PAYMENT_PROOF_PERMISSION_MESSAGE =
  "As permissões do bucket de comprovantes não estão atualizadas. Execute as últimas migrações do Supabase (incluindo 20251003171000_refresh_payment_proof_security.sql) e tente novamente.";

const STAND_SELECTION_STATUS_VARIANTS: Record<StandSelectionStatus, string> = Object.freeze({
  idle: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-destructive/20 text-destructive",
  completed: "bg-secondary/20 text-secondary",
});

const STAND_SELECTION_STATUS_LABELS: Record<StandSelectionStatus, string> = Object.freeze({
  idle: "Aguardando convocação",
  pending: "Aguardando liberação",
  active: "Janela ativa",
  expired: "Janela expirada",
  completed: "Escolha concluída",
});

const fetchAdminProfile = async (userId: string): Promise<AdminProfileRow | null> => {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && !isNoRowsError(error)) {
    throw error;
  }

  return data ?? null;
};

const AdminDashboard = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RegistrationStatus>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingProofId, setViewingProofId] = useState<string | null>(null);
  const [proofDeletingId, setProofDeletingId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const initialConfigSnapshot = useMemo(() => getSupabaseConfigSnapshot(), []);
  const [configValues, setConfigValues] = useState({
    url: initialConfigSnapshot.url,
    anonKey: initialConfigSnapshot.anonKey,
  });
  const [configSource, setConfigSource] = useState(initialConfigSnapshot.source);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [launchPricingEnabled, setLaunchPricingEnabled] = useState(true);
  const [launchPricingLoading, setLaunchPricingLoading] = useState(true);
  const [launchPricingSaving, setLaunchPricingSaving] = useState(false);
  const [launchPricingAvailable, setLaunchPricingAvailable] = useState(true);
  const [salesClosed, setSalesClosed] = useState(false);
  const [salesControlSaving, setSalesControlSaving] = useState(false);
  const [salesControlAvailable, setSalesControlAvailable] = useState(true);
  const [standSelectionTab, setStandSelectionTab] = useState<"queue" | "completed">("queue");
  const [standSelectionSearch, setStandSelectionSearch] = useState("");
  const [standWindowForm, setStandWindowForm] = useState<Record<string, { slotStart: string; slotEnd: string; duration: string }>>({});
  const [standWindowSubmittingId, setStandWindowSubmittingId] = useState<string | null>(null);
  const [standNotificationId, setStandNotificationId] = useState<string | null>(null);
  const [editingSelectionState, setEditingSelectionState] = useState<{
    registration: Registration;
    range: number[];
  } | null>(null);
  const [editingSelectionChoices, setEditingSelectionChoices] = useState<number[]>([]);
  const [editingSelectionSubmitting, setEditingSelectionSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const navigate = useNavigate();

  const handleMissingConfig = useCallback(() => {
    const snapshot = getSupabaseConfigSnapshot();
    setConfigValues({ url: snapshot.url, anonKey: snapshot.anonKey });
    setConfigSource(snapshot.source);
    setConfigError(MISSING_SUPABASE_MESSAGE);
    setLoading(false);
    setIsSavingConfig(false);
  }, []);

  const filteredRegistrations = useMemo(() => {
    if (!registrations.length) {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();
    const numericSearch = normalizedSearch.replace(/[^0-9]/g, "");
    const hasSearch = normalizedSearch.length > 0;

    return registrations.filter((registration) => {
      const registrationDigits = sanitizeDigits(registration.cpf_cnpj);
      const normalizedDigits = registration.cpf_cnpj_normalized ?? "";

      const matchesSearch = !hasSearch
        ? true
        : registration.company_name.toLowerCase().includes(normalizedSearch) ||
          registration.responsible_name.toLowerCase().includes(normalizedSearch) ||
          registration.cpf_cnpj.toLowerCase().includes(normalizedSearch) ||
          (numericSearch
            ? registrationDigits.includes(numericSearch) || normalizedDigits.includes(numericSearch)
            : false);

      const matchesStatus =
        statusFilter === "all" ? true : registration.status === statusFilter;

      const matchesSize =
        sizeFilter === "all" ? true : registration.company_size === sizeFilter;

      return matchesSearch && matchesStatus && matchesSize;
    });
  }, [registrations, search, sizeFilter, statusFilter]);

  const filteredSummary = useMemo(() => {
    const total = filteredRegistrations.reduce((acc, registration) => acc + registration.total_amount, 0);
    const proofs = filteredRegistrations.reduce(
      (acc, registration) => acc + (registration.payment_proof_path ? 1 : 0),
      0
    );

    return {
      count: filteredRegistrations.length,
      total,
      proofs,
    };
  }, [filteredRegistrations]);

  const standSelectionQueue = useMemo(() => {
    return registrations.filter(
      (registration) => registration.status === "Escolha seu stand" && !registration.stand_selection_choices
    );
  }, [registrations]);

  const standSelectionCompleted = useMemo(() => {
    return registrations.filter((registration) => Boolean(registration.stand_selection_choices));
  }, [registrations]);

  const standSelectionStats = useMemo(() => {
    const counts: Record<StandSelectionStatus, number> = {
      idle: 0,
      pending: 0,
      active: 0,
      expired: 0,
      completed: 0,
    };

    for (const registration of registrations) {
      const status = computeStandSelectionStatus(registration as unknown as StandSelectionRegistration);
      counts[status] += 1;
    }

    return counts;
  }, [registrations]);

  const standSelectionSearchFilter = useCallback(
    (registration: Registration, normalizedSearch: string, numericSearch: string, hasSearch: boolean) => {
      if (!hasSearch) {
        return true;
      }

      const registrationDigits = sanitizeDigits(registration.cpf_cnpj);
      const normalizedDigits = registration.cpf_cnpj_normalized ?? "";

      return (
        registration.company_name.toLowerCase().includes(normalizedSearch) ||
        registration.responsible_name.toLowerCase().includes(normalizedSearch) ||
        registration.cpf_cnpj.toLowerCase().includes(normalizedSearch) ||
        (numericSearch
          ? registrationDigits.includes(numericSearch) || normalizedDigits.includes(numericSearch)
          : false)
      );
    },
    []
  );

  const filteredStandSelectionQueue = useMemo(() => {
    if (!standSelectionQueue.length) {
      return [];
    }

    const normalizedSearch = standSelectionSearch.trim().toLowerCase();
    const numericSearch = normalizedSearch.replace(/[^0-9]/g, "");
    const hasSearch = normalizedSearch.length > 0;

    return standSelectionQueue.filter((registration) =>
      standSelectionSearchFilter(registration, normalizedSearch, numericSearch, hasSearch)
    );
  }, [standSelectionQueue, standSelectionSearch, standSelectionSearchFilter]);

  const filteredStandSelectionCompleted = useMemo(() => {
    if (!standSelectionCompleted.length) {
      return [];
    }

    const normalizedSearch = standSelectionSearch.trim().toLowerCase();
    const numericSearch = normalizedSearch.replace(/[^0-9]/g, "");
    const hasSearch = normalizedSearch.length > 0;

    return standSelectionCompleted.filter((registration) =>
      standSelectionSearchFilter(registration, normalizedSearch, numericSearch, hasSearch)
    );
  }, [standSelectionCompleted, standSelectionSearch, standSelectionSearchFilter]);

  const dashboardSummary = useMemo(() => {
    const counts: Record<RegistrationStatus, number> = {
      "Pendente": 0,
      "Aguardando pagamento": 0,
      "Escolha seu stand": 0,
      "Participação confirmada": 0,
      "Cancelado": 0,
    };

    let totalAmount = 0;

    for (const registration of registrations) {
      counts[registration.status] += 1;
      totalAmount += registration.total_amount;
    }

    return {
      total: registrations.length,
      counts,
      totalAmount,
    };
  }, [registrations]);

  const fetchDashboardData = useCallback(async () => {
    try {
      if (!isSupabaseConfigured()) {
        handleMissingConfig();
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("exhibitor_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const mapped = (data ?? []).map(mapRowToRegistration);
      setRegistrations(mapped);
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error);
      toast.error("Erro ao carregar dados do painel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [handleMissingConfig]);

  const loadRegistrationSettings = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLaunchPricingLoading(false);
      setSalesControlAvailable(false);
      setSalesClosed(false);
      return;
    }

    setLaunchPricingLoading(true);

    try {
      const settings = await fetchRegistrationSettings();
      setLaunchPricingEnabled(settings.launchPricingEnabled);
      setLaunchPricingAvailable(true);
      setSalesClosed(settings.salesClosed);
      setSalesControlAvailable(true);
    } catch (error) {
      console.error("Erro ao carregar configuração de preços:", error);
      if (error instanceof RegistrationSettingsNotProvisionedError) {
        setLaunchPricingAvailable(false);
        setSalesControlAvailable(false);
        toast.error(
          "Configuração de preços indisponível. Execute as migrações do Supabase para liberar o controle."
        );
      } else {
        toast.error("Não foi possível carregar a configuração de preços.");
      }
    } finally {
      setLaunchPricingLoading(false);
    }
  }, []);

  const handleLaunchPricingToggle = async (enabled: boolean) => {
    if (!launchPricingAvailable) {
      toast.error(
        "Configuração de preços indisponível. Execute as migrações do Supabase para liberar o controle."
      );
      return;
    }

    if (launchPricingSaving || launchPricingLoading) {
      return;
    }

    setLaunchPricingSaving(true);

    try {
      await upsertRegistrationSettings({ launchPricingEnabled: enabled, salesClosed });
      setLaunchPricingEnabled(enabled);
      await loadRegistrationSettings();
      toast.success(
        enabled
          ? "Promoção Lançamento ativa para novos cadastros."
          : "Promoção Lançamento desativada para novos cadastros."
      );
    } catch (error) {
      console.error("Erro ao atualizar configuração de preços:", error);
      if (error instanceof RegistrationSettingsNotProvisionedError) {
        setLaunchPricingAvailable(false);
        setSalesControlAvailable(false);
        toast.error(
          "Não encontramos a tabela de configuração de preços. Execute as migrações do Supabase e tente novamente."
        );
      } else {
        toast.error("Não foi possível atualizar a configuração de preços.");
      }
    } finally {
      setLaunchPricingSaving(false);
    }
  };

  const handleSalesClosedToggle = async (closed: boolean) => {
    if (!salesControlAvailable) {
      toast.error(
        "Controle de encerramento indisponível. Execute as migrações do Supabase para habilitar o recurso."
      );
      return;
    }

    if (salesControlSaving || launchPricingLoading) {
      return;
    }

    setSalesControlSaving(true);

    try {
      await upsertRegistrationSettings({
        launchPricingEnabled,
        salesClosed: closed,
      });
      setSalesClosed(closed);
      await loadRegistrationSettings();
      toast.success(
        closed
          ? "Novos cadastros e consultas foram ocultados do site."
          : "As páginas públicas foram reativadas."
      );
    } catch (error) {
      console.error("Erro ao atualizar encerramento das vendas:", error);
      if (error instanceof RegistrationSettingsNotProvisionedError) {
        setSalesControlAvailable(false);
        setLaunchPricingAvailable(false);
        toast.error(
          "Não encontramos a tabela de configuração de inscrições. Execute as migrações do Supabase e tente novamente."
        );
      } else {
        toast.error("Não foi possível salvar a alteração. Tente novamente.");
      }
    } finally {
      setSalesControlSaving(false);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    await Promise.allSettled([fetchDashboardData(), loadRegistrationSettings()]);
    toast.success("Dados atualizados.");
  };

  const handleConfigInputChange = useCallback(
    (field: "url" | "anonKey") => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setConfigValues((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const handleConfigSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSavingConfig(true);

      try {
        persistSupabaseBrowserConfig({
          url: configValues.url,
          anonKey: configValues.anonKey,
        });
        refreshSupabaseClient();
        const snapshot = getSupabaseConfigSnapshot();
        setConfigValues({ url: snapshot.url, anonKey: snapshot.anonKey });
        setConfigSource(snapshot.source);
        toast.success("Credenciais salvas com sucesso! Recarregando o painel...");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("Falha ao salvar credenciais do Supabase:", error);
        toast.error("Não foi possível salvar as credenciais. Verifique os valores informados.");
      } finally {
        setIsSavingConfig(false);
      }
    },
    [configValues.anonKey, configValues.url]
  );

  const handleClearConfig = useCallback(() => {
    try {
      clearSupabaseBrowserConfig();
      refreshSupabaseClient();
      const snapshot = getSupabaseConfigSnapshot();
      setConfigValues({ url: snapshot.url, anonKey: snapshot.anonKey });
      setConfigSource(snapshot.source);
      toast.success("Credenciais salvas no navegador foram removidas.");
    } catch (error) {
      console.error("Falha ao limpar credenciais salvas:", error);
      toast.error("Não foi possível limpar as credenciais salvas neste navegador.");
    }
  }, []);

  const configSourceLabel = useMemo(() => {
    switch (configSource) {
      case "env":
        return "Lidas do arquivo .env";
      case "storage":
        return "Salvas neste navegador";
      case "mixed":
        return "Completadas entre .env e navegador";
      default:
        return "Não encontradas";
    }
  }, [configSource]);

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      if (!isSupabaseConfigured()) {
        handleMissingConfig();
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao verificar sessão do administrador:", error);
      }

      const session = data?.session ?? null;

      if (!session) {
        toast.error("Faça login para acessar o painel.");
        navigate("/admin");
        return;
      }

      try {
        const profile = await fetchAdminProfile(session.user.id);

        if (!profile || !profile.is_approved) {
          toast.error("Seu acesso administrativo não está ativo. Solicite aprovação.");
          await supabase.auth.signOut();
          navigate("/admin");
          return;
        }
      } catch (profileError) {
        console.error("Erro ao validar perfil administrativo:", profileError);
        toast.error("Não foi possível validar seu acesso administrativo.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      if (mounted) {
        setAuthChecked(true);
      }
    };

    void verifySession().catch((error) => {
      console.error("Falha ao inicializar o painel administrativo:", error);
      toast.error("Erro ao conectar com o Supabase. Verifique a configuração e tente novamente.");
      handleMissingConfig();
    });

    const authListener = isSupabaseConfigured()
      ? supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) {
            toast.error("Sessão encerrada. Faça login novamente.");
            navigate("/admin");
          }
        })
      : null;

    return () => {
      mounted = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, [handleMissingConfig, navigate]);

  useEffect(() => {
    if (authChecked) {
      void loadRegistrationSettings();
      void fetchDashboardData();
    }
  }, [authChecked, fetchDashboardData, loadRegistrationSettings]);

  useEffect(() => {
    setStandWindowForm((current) => {
      const next: Record<string, { slotStart: string; slotEnd: string; duration: string }> = {};

      for (const registration of standSelectionQueue) {
        const existing = current[registration.id];
        const slotStart = registration.stand_selection_slot_start;
        const slotEnd = registration.stand_selection_slot_end;

        let duration = existing?.duration ?? null;

        if (!duration) {
          const startedAt = registration.stand_selection_window_started_at;
          const expiresAt = registration.stand_selection_window_expires_at;

          if (startedAt && expiresAt) {
            const startTime = new Date(startedAt).getTime();
            const endTime = new Date(expiresAt).getTime();
            if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime) {
              duration = String(Math.max(5, Math.round((endTime - startTime) / 60000)));
            }
          }
        }

        if (!duration) {
          duration = String(STAND_SELECTION_DURATION_MINUTES);
        }

        next[registration.id] = {
          slotStart: existing?.slotStart ?? (slotStart != null ? String(slotStart) : ""),
          slotEnd: existing?.slotEnd ?? (slotEnd != null ? String(slotEnd) : ""),
          duration,
        };
      }

      return next;
    });
  }, [standSelectionQueue]);

  const getStandWindowForm = (registration: Registration) =>
    standWindowForm[registration.id] ?? {
      slotStart: registration.stand_selection_slot_start != null
        ? String(registration.stand_selection_slot_start)
        : "",
      slotEnd: registration.stand_selection_slot_end != null
        ? String(registration.stand_selection_slot_end)
        : "",
      duration: String(STAND_SELECTION_DURATION_MINUTES),
    };

  const formatDateTime = useCallback((value: string | null) => {
    if (!value) {
      return "—";
    }

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch (error) {
      console.warn("Falha ao formatar data:", error);
      return value;
    }
  }, []);

  const closeEditingSelection = useCallback(() => {
    setEditingSelectionState(null);
    setEditingSelectionChoices([]);
    setEditingSelectionSubmitting(false);
  }, []);

  const handleOpenEditingSelection = useCallback(
    (registration: Registration) => {
      const range = buildStandRange(
        registration.stand_selection_slot_start,
        registration.stand_selection_slot_end
      );
      const currentChoices = registration.stand_selection_choices
        ? parseStandChoices(registration.stand_selection_choices)
        : [];

      setEditingSelectionState({ registration, range });
      setEditingSelectionChoices(currentChoices);
      setEditingSelectionSubmitting(false);
    },
    []
  );

  const handleToggleEditingChoice = useCallback(
    (value: number) => {
      setEditingSelectionChoices((current) => {
        if (current.includes(value)) {
          return current.filter((item) => item !== value);
        }

        const sorted = [...current, value].sort((a, b) => a - b);
        const maxSelectable = editingSelectionState?.registration.stands_quantity ?? 0;

        if (maxSelectable > 0 && sorted.length > maxSelectable) {
          return current;
        }

        return sorted;
      });
    },
    [editingSelectionState?.registration.stands_quantity]
  );

  const handleClearEditingChoices = useCallback(() => {
    setEditingSelectionChoices([]);
  }, []);

  const handleSaveEditingSelection = useCallback(async () => {
    if (!editingSelectionState) {
      return;
    }

    const required = editingSelectionState.registration.stands_quantity ?? 0;
    if (required > 0 && editingSelectionChoices.length !== required) {
      toast.error(
        `Selecione exatamente ${required} stand${required > 1 ? "s" : ""} para salvar as alterações.`
      );
      return;
    }

    setEditingSelectionSubmitting(true);
    try {
      const serializedChoices = serializeStandChoices(editingSelectionChoices);
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from("exhibitor_registrations")
        .update({
          stand_selection_choices: serializedChoices || null,
          stand_selection_submitted_at: serializedChoices ? nowIso : null,
          updated_at: nowIso,
        })
        .eq("id", editingSelectionState.registration.id);

      if (error) {
        throw error;
      }

      toast.success("Escolha de stand atualizada com sucesso.");
      await fetchDashboardData();
      closeEditingSelection();
    } catch (error) {
      console.error("Erro ao atualizar escolha de stand:", error);
      if (isPostgrestError(error)) {
        toast.error("Não foi possível atualizar as escolhas.", { description: error.message });
      } else {
        toast.error("Não foi possível atualizar as escolhas. Tente novamente.");
      }
      setEditingSelectionSubmitting(false);
    }
  }, [closeEditingSelection, editingSelectionChoices, editingSelectionState, fetchDashboardData]);

  const handleStandWindowInputChange = useCallback(
    (registrationId: string, field: "slotStart" | "slotEnd" | "duration") =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const digits = event.target.value.replace(/[^0-9]/g, "");
        setStandWindowForm((current) => {
          const existing = current[registrationId] ?? {
            slotStart: "",
            slotEnd: "",
            duration: String(STAND_SELECTION_DURATION_MINUTES),
          };

          return {
            ...current,
            [registrationId]: {
              ...existing,
              [field]: digits,
            },
          };
        });
      },
    []
  );

  const handleOpenStandSelectionWindow = useCallback(
    async (registration: Registration) => {
      const formValues = standWindowForm[registration.id] ?? {
        slotStart: registration.stand_selection_slot_start != null
          ? String(registration.stand_selection_slot_start)
          : "",
        slotEnd: registration.stand_selection_slot_end != null
          ? String(registration.stand_selection_slot_end)
          : "",
        duration: String(STAND_SELECTION_DURATION_MINUTES),
      };
      const slotStart = Number.parseInt(formValues.slotStart, 10);
      const slotEnd = Number.parseInt(formValues.slotEnd, 10);
      const duration = Number.parseInt(formValues.duration, 10) || STAND_SELECTION_DURATION_MINUTES;

      if (!Number.isFinite(slotStart) || !Number.isFinite(slotEnd)) {
        toast.error("Informe o intervalo de stands para liberar a janela.");
        return;
      }

      if (slotEnd < slotStart) {
        toast.error("O número final não pode ser menor que o inicial.");
        return;
      }

      if (duration < 5) {
        toast.error("Defina uma duração mínima de 5 minutos.");
        return;
      }

      try {
        setStandWindowSubmittingId(registration.id);
        await openStandSelectionWindow(registration.id, {
          slotStart,
          slotEnd,
          durationMinutes: duration,
        });
        toast.success(`Janela de seleção liberada para ${registration.company_name}.`);
        await fetchDashboardData();
      } catch (error) {
        console.error("Erro ao abrir janela de seleção:", error);
        toast.error("Não foi possível liberar a janela. Verifique os dados e tente novamente.");
      } finally {
        setStandWindowSubmittingId(null);
      }
    },
    [fetchDashboardData, standWindowForm]
  );

  const handleSendStandNotification = useCallback(
    async (registration: Registration, reminder = false) => {
      if (registration.stand_selection_slot_start == null || registration.stand_selection_slot_end == null) {
        toast.error("Defina o intervalo de stands antes de enviar notificações.");
        return;
      }

      try {
        setStandNotificationId(registration.id);
        await triggerStandSelectionNotification({
          registrationId: registration.id,
          companyName: registration.company_name,
          slotStart: registration.stand_selection_slot_start,
          slotEnd: registration.stand_selection_slot_end,
          windowExpiresAt: registration.stand_selection_window_expires_at,
          standsQuantity: registration.stands_quantity,
          reminder,
        });
        toast.success(reminder ? "Lembrete enviado com sucesso!" : "Notificação enviada.");
        await fetchDashboardData();
      } catch (error) {
        console.error("Erro ao enviar notificação de seleção de stand:", error);
        toast.error("Não foi possível enviar a notificação. Tente novamente.");
      } finally {
        setStandNotificationId(null);
      }
    },
    [fetchDashboardData]
  );

  const updateStatus = async (id: string, status: RegistrationStatus) => {
    try {
      const existingRegistration = registrations.find((item) => item.id === id);
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("exhibitor_registrations")
        .update(
          {
            status,
            updated_at: nowIso,
          } as never
        )
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("Status atualizado com sucesso!");
      setRegistrations((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status, updated_at: nowIso } : item
        )
      );

      const companyName = existingRegistration?.company_name ?? "Cadastro";

      if (status === "Escolha seu stand" && existingRegistration) {
        const expiresAt = existingRegistration.stand_selection_window_expires_at
          ? new Date(existingRegistration.stand_selection_window_expires_at).getTime()
          : null;
        const hasActiveWindow =
          existingRegistration.stand_selection_slot_start != null &&
          existingRegistration.stand_selection_slot_end != null &&
          existingRegistration.stand_selection_window_started_at !== null &&
          existingRegistration.stand_selection_window_expires_at !== null &&
          (expiresAt === null || expiresAt > Date.now());

        const formValues = standWindowForm[existingRegistration.id];
        const hasFormRange = Boolean(formValues?.slotStart && formValues?.slotEnd);

        if (!hasActiveWindow) {
          if (hasFormRange || existingRegistration.stand_selection_slot_start != null) {
            try {
              await handleOpenStandSelectionWindow({
                ...existingRegistration,
                status,
              });
            } catch (windowError) {
              console.error("Falha ao abrir janela automaticamente:", windowError);
            }
          } else {
            toast.warning(
              "Defina o intervalo de stands no formulário de seleção antes de liberar a escolha."
            );
          }
        }
      }

      void supabase.functions
        .invoke("notify-status-change", {
          body: {
            registrationId: id,
            status,
            companyName,
          },
        })
        .catch((invokeError) => {
          console.error("Erro ao acionar notificações push:", invokeError);
        });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Não foi possível atualizar o status. Tente novamente.");
    }
  };

  const triggerFileSelection = (registrationId: string) => {
    fileInputRefs.current[registrationId]?.click();
  };

  const handleBoletoUpload = async (registrationId: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const hasPdfExtension = fileNameLower.endsWith(".pdf");
    const isPdfMime = file.type === "application/pdf";

    if (!hasPdfExtension && !isPdfMime) {
      toast.error("Envie o boleto em formato PDF.");
      return;
    }

    setUploadingId(registrationId);

    try {
      const relativePath = buildBoletoFilePath(registrationId, file.name);
      const storedPath = relativePath;
      const nowIso = new Date().toISOString();

      const { error: uploadError } = await supabase.storage
        .from("boletos")
        .upload(storedPath, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: updateError } = await supabase
        .from("exhibitor_registrations")
        .update(
          {
            boleto_path: storedPath,
            boleto_uploaded_at: nowIso,
            updated_at: nowIso,
          } as never
        )
        .eq("id", registrationId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Boleto anexado com sucesso!");
      setRegistrations((current) =>
        current.map((item) =>
          item.id === registrationId
            ? {
                ...item,
                boleto_path: storedPath,
                boleto_uploaded_at: nowIso,
                updated_at: nowIso,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao anexar boleto:", error);
      toast.error("Não foi possível anexar o boleto. Tente novamente.");
    } finally {
      setUploadingId(null);
      if (fileInputRefs.current[registrationId]) {
        fileInputRefs.current[registrationId]!.value = "";
      }
    }
  };

  const handleViewBoleto = async (registration: Registration) => {
    if (!registration.boleto_path) {
      toast.error("Nenhum boleto disponível para este cadastro.");
      return;
    }

    setViewingId(registration.id);
    try {
      const { data, error } = await supabase.storage
        .from("boletos")
        .createSignedUrl(registration.boleto_path, 60 * 60);

      if (error || !data?.signedUrl) {
        throw error ?? new Error("Não foi possível gerar o link do boleto.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Erro ao gerar link do boleto:", error);
      toast.error("Não foi possível abrir o boleto. Tente novamente.");
    } finally {
      setViewingId(null);
    }
  };

  const handleViewPaymentProof = async (registration: Registration) => {
    if (!registration.payment_proof_path) {
      toast.error("Nenhum comprovante disponível para este cadastro.");
      return;
    }

    setViewingProofId(registration.id);
    try {
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(registration.payment_proof_path, 60 * 60);

      if (error || !data?.signedUrl) {
        throw error ?? new Error("Não foi possível gerar o link do comprovante.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Erro ao gerar link do comprovante:", error);
      if (isStoragePermissionError(error)) {
        toast.error(PAYMENT_PROOF_PERMISSION_MESSAGE);
      } else {
        toast.error("Não foi possível abrir o comprovante. Tente novamente.");
      }
    } finally {
      setViewingProofId(null);
    }
  };

  const handleRemovePaymentProof = async (registration: Registration) => {
    if (!registration.payment_proof_path) {
      toast.error("Nenhum comprovante disponível para remover.");
      return;
    }

    const confirmDeletion = window.confirm(
      "Deseja realmente remover o comprovante? O expositor poderá enviar outro pelo portal."
    );

    if (!confirmDeletion) {
      return;
    }

    setProofDeletingId(registration.id);

    try {
      const targetPath = registration.payment_proof_path;

      const { error: storageError } = await supabase.storage
        .from("payment-proofs")
        .remove([targetPath]);

      if (storageError && !/not found/i.test(storageError.message ?? "")) {
        throw storageError;
      }

      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("exhibitor_registrations")
        .update({
          payment_proof_path: null,
          payment_proof_uploaded_at: null,
          updated_at: nowIso,
        } as never)
        .eq("id", registration.id);

      if (updateError) {
        throw updateError;
      }

      setRegistrations((current) =>
        current.map((item) =>
          item.id === registration.id
            ? {
                ...item,
                payment_proof_path: null,
                payment_proof_uploaded_at: null,
                updated_at: nowIso,
              }
            : item
        )
      );

  toast.success("Comprovante removido. Solicite ao expositor um novo envio pelo portal.");
    } catch (error) {
      console.error("Erro ao remover comprovante:", error);
      if (
        isPostgrestError(error) && (error.code === "42501" || error.code === "42P01")
      ) {
        toast.error(PAYMENT_PROOF_PERMISSION_MESSAGE);
      } else if (isStoragePermissionError(error)) {
        toast.error(PAYMENT_PROOF_PERMISSION_MESSAGE);
      } else {
        toast.error("Não foi possível remover o comprovante. Tente novamente.");
      }
    } finally {
      setProofDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const exportToXLSX = () => {
    const registrationsSheetData = filteredRegistrations.map((reg) => ({
      "Data do cadastro": new Date(reg.created_at).toLocaleString("pt-BR"),
      Empresa: reg.company_name,
      Responsável: reg.responsible_name,
      "CPF/CNPJ": reg.cpf_cnpj,
      Telefone: reg.phone,
      Porte: reg.company_size,
      Segmento: reg.business_segment,
      Stands: reg.stands_quantity,
      "Forma de pagamento": getPaymentMethodDisplayLabel(reg.payment_method),
      "Valor total (R$)": formatCurrencyBRL(reg.total_amount),
      Status: reg.status,
      "Comprovante enviado": reg.payment_proof_path
        ? reg.payment_proof_uploaded_at
          ? new Date(reg.payment_proof_uploaded_at).toLocaleString("pt-BR")
          : "Anexado"
        : "Pendente",
    }));

    const workbook = XLSXUtils.book_new();
    const registrationsSheet = XLSXUtils.json_to_sheet(registrationsSheetData);
    registrationsSheet["!cols"] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 28 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
      { wch: 25 },
      { wch: 8 },
      { wch: 28 },
      { wch: 18 },
      { wch: 22 },
    ];

    const summarySheet = XLSXUtils.aoa_to_sheet([
      ["Indicador", "Valor"],
      ["Cadastros filtrados", filteredSummary.count],
      ["Comprovantes recebidos", filteredSummary.proofs],
      ["Valor previsto na visão", formatCurrencyBRL(filteredSummary.total)],
      ["Exportado em", new Date().toLocaleString("pt-BR")],
    ]);
    summarySheet["!cols"] = [{ wch: 28 }, { wch: 24 }];

    XLSXUtils.book_append_sheet(workbook, registrationsSheet, "Cadastros");
    XLSXUtils.book_append_sheet(workbook, summarySheet, "Resumo");

    writeXlsxFile(workbook, `cadastros_feira_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const isConfigFormValid = configValues.url.trim().length > 0 && configValues.anonKey.trim().length > 0;

  if (configError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-sand p-6 text-center">
  <img src={logoShield} alt="Feira do Empreendedor" className="h-16 w-16 mb-4 rounded-xl" />
        <h1 className="text-2xl font-semibold text-card-foreground mb-2">Painel indisponível</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mb-6">{configError}</p>
        <div className="w-full max-w-2xl bg-card text-left rounded-2xl shadow-elegant border border-border p-6">
          <form className="space-y-4" onSubmit={handleConfigSubmit}>
            <div>
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input
                id="supabase-url"
                placeholder="https://xxxx.supabase.co"
                value={configValues.url}
                onChange={handleConfigInputChange("url")}
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="supabase-anon">Supabase anon key</Label>
              <Input
                id="supabase-anon"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={configValues.anonKey}
                onChange={handleConfigInputChange("anonKey")}
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Origem atual das credenciais: <span className="font-medium text-card-foreground">{configSourceLabel}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={!isConfigFormValid || isSavingConfig} className="flex-1">
                {isSavingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar e recarregar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClearConfig}
                className="flex-1"
                disabled={isSavingConfig}
              >
                Limpar credenciais salvas
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin")}
                className="flex-1"
                disabled={isSavingConfig}
              >
                Voltar ao login
              </Button>
            </div>
          </form>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl mt-4">
          Dica: copie os valores em <strong>Configurações &gt; Projeto &gt; API</strong> no painel do Supabase. Você também pode definir as variáveis
          diretamente no arquivo <code>.env</code> da aplicação para evitar configurar a cada navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sand">
      <header className="bg-primary text-primary-foreground shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={logoShield}
                alt="Feira do Empreendedor"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/90 p-1 object-contain shadow-md"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold font-['Poppins']">Painel Administrativo</h1>
                <p className="text-sm text-primary-foreground/80">8ª Feira do Empreendedor</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center justify-center gap-2 border-primary/30 text-primary w-full sm:w-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
                Atualizar
              </Button>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <LogOut size={16} />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-primary md:col-span-2">
            <div className="text-3xl font-bold text-primary mb-1 font-['Poppins']">
              {dashboardSummary.total}
            </div>
            <div className="text-sm text-muted-foreground">Total de Cadastros</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-secondary md:col-span-2">
            <div className="text-3xl font-bold text-secondary mb-1 font-['Poppins']">
              {dashboardSummary.counts["Participação confirmada"]}
            </div>
            <div className="text-sm text-muted-foreground">Participações confirmadas</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-accent md:col-span-2">
            <div className="text-3xl font-bold text-accent mb-1 font-['Poppins']">
              {dashboardSummary.counts["Pendente"]}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-secondary md:col-span-2">
            <div className="text-3xl font-bold text-amber-600 mb-1 font-['Poppins']">
              {dashboardSummary.counts["Aguardando pagamento"]}
            </div>
            <div className="text-sm text-muted-foreground">Aguardando pagamento</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-elegant md:col-span-2">
            <div className="text-3xl font-bold text-indigo-600 mb-1 font-['Poppins']">
              {dashboardSummary.counts["Escolha seu stand"]}
            </div>
            <div className="text-sm text-muted-foreground">Liberados para escolha</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-primary md:col-span-2">
            <div className="text-3xl font-bold text-destructive mb-1 font-['Poppins']">
              {dashboardSummary.counts["Cancelado"]}
            </div>
            <div className="text-sm text-muted-foreground">Cancelados</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-elegant md:col-span-2">
            <div className="text-3xl font-bold text-primary mb-1 font-['Poppins']">
              {formatCurrencyBRL(dashboardSummary.totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Valor previsto em vendas</div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-elegant p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">Opções de pagamento</h2>
              <p className="text-sm text-muted-foreground">
                Controle a disponibilidade do valor promocional de R$ 700,00 para um stand.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={launchPricingEnabled}
                onCheckedChange={(checked) => {
                  void handleLaunchPricingToggle(checked);
                }}
                disabled={launchPricingLoading || launchPricingSaving || !launchPricingAvailable}
              />
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                {launchPricingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>
                  {launchPricingEnabled ? "Promoção liberada" : "Promoção encerrada"}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {!launchPricingAvailable
              ? "A tabela de configuração de preços ainda não foi provisionada. Execute as migrações do Supabase e recarregue o painel para habilitar o controle."
              : launchPricingEnabled
                ? "Expositores visualizam o valor promocional de R$ 700,00 por stand, inclusive para pedidos com dois ou mais stands; a opção de R$ 850,00 segue disponível apenas para um stand."
                : "Novos cadastros verão apenas R$ 850,00 para um stand, enquanto pedidos com dois ou mais stands permanecem em R$ 750,00."}
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-elegant p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">Encerramento de vendas</h2>
              <p className="text-sm text-muted-foreground">
                Controle a visibilidade das páginas públicas de inscrição, consulta e escolha de stands.
              </p>
            </div>
            <Button
              onClick={() => void handleSalesClosedToggle(!salesClosed)}
              disabled={launchPricingLoading || salesControlSaving || !salesControlAvailable}
              variant={salesClosed ? "outline" : "destructive"}
              className="flex items-center gap-2"
            >
              {salesControlSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : salesClosed ? (
                <Unlock className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {salesClosed ? "Reabrir inscrições" : "Encerrar vendas"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {!salesControlAvailable
              ? "A configuração de encerramento ainda não foi provisionada. Execute as migrações do Supabase e recarregue o painel para habilitar o controle."
              : salesClosed
                ? "Visitantes não visualizarão as abas Cadastro, Consulta e Escolha seu stand no menu principal."
                : "As páginas públicas seguem disponíveis normalmente para novos cadastros e consultas."}
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-elegant p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por empresa, CPF/CNPJ ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value === "all" || isRegistrationStatus(value)) {
                  setStatusFilter(value);
                }
              }}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aguardando pagamento">Aguardando pagamento</SelectItem>
                <SelectItem value="Escolha seu stand">Escolha seu stand</SelectItem>
                <SelectItem value="Participação confirmada">
                  Participação confirmada
                </SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Porte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Portes</SelectItem>
                <SelectItem value="MEI">MEI</SelectItem>
                <SelectItem value="ME">ME</SelectItem>
                <SelectItem value="EPP">EPP</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Grande">Grande</SelectItem>
                <SelectItem value="Autônomo informal">Autônomo informal</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToXLSX} variant="outline" className="flex items-center gap-2">
              <Download size={16} />
              Exportar XLSX
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              {filteredSummary.count === 1
                ? "1 cadastro encontrado"
                : `${filteredSummary.count} cadastros encontrados`}
            </span>
            <span>
              Comprovantes recebidos: {filteredSummary.proofs}
            </span>
            <span className="font-semibold text-primary">
              Valor previsto nesta visão: {formatCurrencyBRL(filteredSummary.total)}
            </span>
          </div>
        </div>

        <Card className="mb-6 shadow-elegant">
          <CardHeader>
            <CardTitle>Seleção de stands</CardTitle>
            <CardDescription>
              Gerencie a fila de convocação, defina janelas de escolha e acompanhe os lembretes enviados aos expositores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <Badge className="bg-amber-100 text-amber-700">Pendentes: {standSelectionStats.pending}</Badge>
                <Badge className="bg-emerald-100 text-emerald-700">Ativos: {standSelectionStats.active}</Badge>
                <Badge className="bg-destructive/20 text-destructive">Expirados: {standSelectionStats.expired}</Badge>
                <Badge className="bg-secondary/20 text-secondary">Concluídos: {standSelectionStats.completed}</Badge>
              </div>
              <div className="w-full max-w-sm">
                <Input
                  value={standSelectionSearch}
                  onChange={(event) => setStandSelectionSearch(event.target.value)}
                  placeholder="Buscar por empresa, CPF/CNPJ ou responsável..."
                />
              </div>
            </div>

            <Tabs
              value={standSelectionTab}
              onValueChange={(value) => setStandSelectionTab(value as "queue" | "completed")}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:inline-flex">
                <TabsTrigger value="queue" className="flex items-center gap-2 px-4 py-2">
                  Fila ativa
                  {standSelectionQueue.length > 0 ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {standSelectionQueue.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2 px-4 py-2">
                  Concluídos
                  {standSelectionCompleted.length > 0 ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {standSelectionCompleted.length}
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="queue" className="space-y-4">
                {filteredStandSelectionQueue.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
                    {standSelectionQueue.length === 0
                      ? "Nenhum cadastro aguardando seleção no momento."
                      : "Nenhum cadastro corresponde ao filtro informado."}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Controle da janela</TableHead>
                          <TableHead>Status da janela</TableHead>
                          <TableHead>Notificações</TableHead>
                          <TableHead className="w-[220px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStandSelectionQueue.map((registration) => {
                          const standStatus = computeStandSelectionStatus(
                            registration as unknown as StandSelectionRegistration
                          );
                          const form = getStandWindowForm(registration);
                          const isSubmitting = standWindowSubmittingId === registration.id;
                          const sendingNotification = standNotificationId === registration.id;
                          const lastNotification = registration.stand_selection_notification_last_sent;

                          return (
                            <TableRow key={registration.id}>
                              <TableCell>
                                <div className="font-semibold text-primary">{registration.company_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Responsável: {registration.responsible_name}
                                </div>
                                <div className="text-xs text-muted-foreground">CPF/CNPJ: {registration.cpf_cnpj}</div>
                                <div className="text-xs text-muted-foreground">
                                  Quantidade de stands: {registration.stands_quantity}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <Input
                                    type="number"
                                    min={1}
                                    value={form.slotStart}
                                    onChange={handleStandWindowInputChange(registration.id, "slotStart")}
                                    placeholder="Início"
                                    className="w-24"
                                  />
                                  <Input
                                    type="number"
                                    min={1}
                                    value={form.slotEnd}
                                    onChange={handleStandWindowInputChange(registration.id, "slotEnd")}
                                    placeholder="Fim"
                                    className="w-24"
                                  />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={5}
                                    value={form.duration}
                                    onChange={handleStandWindowInputChange(registration.id, "duration")}
                                    placeholder="Duração"
                                    className="w-24"
                                  />
                                  <span className="text-xs text-muted-foreground">min</span>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Intervalo atual: {registration.stand_selection_slot_start != null && registration.stand_selection_slot_end != null
                                    ? `${registration.stand_selection_slot_start}-${registration.stand_selection_slot_end}`
                                    : "—"}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${STAND_SELECTION_STATUS_VARIANTS[standStatus]} px-2 py-1 text-xs font-medium`}
                                >
                                  {STAND_SELECTION_STATUS_LABELS[standStatus]}
                                </Badge>
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  <div>Início: {formatDateTime(registration.stand_selection_window_started_at)}</div>
                                  <div>Expira: {formatDateTime(registration.stand_selection_window_expires_at)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>Total de envios: {registration.stand_selection_notifications_count ?? 0}</div>
                                  <div>Última notificação: {formatDateTime(lastNotification)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => void handleOpenStandSelectionWindow(registration)}
                                    disabled={isSubmitting}
                                    className="justify-start gap-2"
                                  >
                                    {isSubmitting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Clock className="h-4 w-4" />
                                    )}
                                    {standStatus === "active" ? "Atualizar janela" : "Liberar janela"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleSendStandNotification(registration, false)}
                                    disabled={sendingNotification}
                                    className="justify-start gap-2"
                                  >
                                    {sendingNotification ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4" />
                                    )}
                                    Enviar notificação
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => void handleSendStandNotification(registration, true)}
                                    disabled={sendingNotification || !lastNotification}
                                    className="justify-start gap-2 text-muted-foreground"
                                  >
                                    {sendingNotification ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <BellRing className="h-4 w-4" />
                                    )}
                                    Reenviar lembrete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {filteredStandSelectionCompleted.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                    {standSelectionCompleted.length === 0
                      ? "Nenhum expositor enviou a escolha de stand ainda."
                      : "Nenhum cadastro corresponde ao filtro informado."}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Escolha enviada</TableHead>
                          <TableHead>Janela registrada</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[200px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStandSelectionCompleted.map((registration) => {
                          const standStatus = computeStandSelectionStatus(
                            registration as unknown as StandSelectionRegistration
                          );
                          const choices = registration.stand_selection_choices
                            ? parseStandChoices(registration.stand_selection_choices).join(", ")
                            : "—";

                          return (
                            <TableRow key={registration.id}>
                              <TableCell>
                                <div className="font-semibold text-primary">{registration.company_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Responsável: {registration.responsible_name}
                                </div>
                                <div className="text-xs text-muted-foreground">CPF/CNPJ: {registration.cpf_cnpj}</div>
                                <div className="text-xs text-muted-foreground">
                                  Quantidade de stands: {registration.stands_quantity}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-primary">{choices}</div>
                                <div className="text-xs text-muted-foreground">
                                  Enviado em: {formatDateTime(
                                    registration.stand_selection_submitted_at ??
                                      registration.stand_selection_window_expires_at
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>
                                    Intervalo liberado: {registration.stand_selection_slot_start != null && registration.stand_selection_slot_end != null
                                      ? `${registration.stand_selection_slot_start}-${registration.stand_selection_slot_end}`
                                      : "—"}
                                  </div>
                                  <div>
                                    Janela aberta: {formatDateTime(registration.stand_selection_window_started_at)}
                                  </div>
                                  <div>
                                    Encerramento: {formatDateTime(registration.stand_selection_window_expires_at)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      STATUS_BADGE_VARIANTS[registration.status] ?? STATUS_BADGE_VARIANTS["Pendente"]
                                    }`}
                                  >
                                    {registration.status}
                                  </span>
                                  <Badge
                                    className={`${STAND_SELECTION_STATUS_VARIANTS[standStatus]} px-2 py-1 text-[11px] font-medium`}
                                  >
                                    {STAND_SELECTION_STATUS_LABELS[standStatus]}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="justify-start gap-2"
                                    onClick={() => handleOpenEditingSelection(registration)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                    Editar escolhas
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="justify-start gap-2 text-muted-foreground"
                                    onClick={() => void handleOpenStandSelectionWindow(registration)}
                                  >
                                    <Clock className="h-4 w-4" />
                                    Reabrir janela
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="bg-card rounded-xl shadow-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Porte</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Stands</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Total previsto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Boleto</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      Nenhum cadastro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.company_name}</TableCell>
                      <TableCell>{registration.cpf_cnpj}</TableCell>
                      <TableCell>{registration.responsible_name}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.company_size}</TableCell>
                      <TableCell>{registration.business_segment}</TableCell>
                      <TableCell>{registration.stands_quantity}</TableCell>
                      <TableCell>{getPaymentMethodDisplayLabel(registration.payment_method)}</TableCell>
                      <TableCell>{formatCurrencyBRL(registration.total_amount)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGE_VARIANTS[registration.status] ?? STATUS_BADGE_VARIANTS["Pendente"]
                          }`}
                        >
                          {registration.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <input
                          ref={(element) => {
                            fileInputRefs.current[registration.id] = element;
                          }}
                          type="file"
                          accept="application/pdf"
                          aria-label="Selecionar boleto em PDF"
                          className="hidden"
                          onChange={(event) => handleBoletoUpload(registration.id, event.target.files)}
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={() => triggerFileSelection(registration.id)}
                            disabled={uploadingId === registration.id}
                          >
                            {uploadingId === registration.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-4 w-4" />
                                {registration.boleto_path ? "Atualizar boleto" : "Anexar boleto"}
                              </>
                            )}
                          </Button>

                          {registration.boleto_path ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2 text-secondary"
                              onClick={() => handleViewBoleto(registration)}
                              disabled={viewingId === registration.id}
                            >
                              {viewingId === registration.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Abrindo...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  Ver boleto
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhum boleto enviado</span>
                          )}
                          {registration.boleto_uploaded_at && (
                            <span className="text-[11px] text-muted-foreground">
                              Atualizado em {new Date(registration.boleto_uploaded_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2 text-primary"
                              onClick={() => handleViewPaymentProof(registration)}
                              disabled={!registration.payment_proof_path || viewingProofId === registration.id}
                            >
                              {viewingProofId === registration.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Abrindo...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  Ver comprovante
                                </>
                              )}
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              className="justify-start gap-2"
                              onClick={() => handleRemovePaymentProof(registration)}
                              disabled={!registration.payment_proof_path || proofDeletingId === registration.id}
                            >
                              {proofDeletingId === registration.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Removendo...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  Remover comprovante
                                </>
                              )}
                            </Button>
                          </div>

                          {registration.payment_proof_path && registration.payment_proof_uploaded_at ? (
                            <span className="text-[11px] text-muted-foreground">
                              Último envio em {new Date(registration.payment_proof_uploaded_at).toLocaleString("pt-BR")}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhum comprovante enviado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(registration.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={registration.status}
                            onValueChange={(value) => {
                              if (isRegistrationStatus(value)) {
                                updateStatus(registration.id, value);
                              }
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Aguardando pagamento">
                                Aguardando pagamento
                              </SelectItem>
                              <SelectItem value="Escolha seu stand">
                                Escolha seu stand
                              </SelectItem>
                              <SelectItem value="Participação confirmada">
                                Participação confirmada
                              </SelectItem>
                              <SelectItem value="Cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>

                          {registration.payment_proof_path && registration.payment_proof_uploaded_at ? (
                            <span className="text-[11px] text-muted-foreground">
                              Último envio em {new Date(registration.payment_proof_uploaded_at).toLocaleString("pt-BR")}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              Nenhum comprovante anexado ainda
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={Boolean(editingSelectionState)} onOpenChange={(open) => {
        if (!open) {
          closeEditingSelection();
        }
      }}>
        <DialogContent className="max-w-3xl space-y-5">
          <DialogHeader>
            <DialogTitle>Editar escolha de stands</DialogTitle>
            <DialogDescription>
              Ajuste manualmente os stands selecionados para este expositor. As alterações são aplicadas imediatamente após salvar.
            </DialogDescription>
          </DialogHeader>

          {editingSelectionState ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <div className="font-semibold text-primary text-base">
                  {editingSelectionState.registration.company_name}
                </div>
                <div>CPF/CNPJ: {editingSelectionState.registration.cpf_cnpj}</div>
                <div>
                  Intervalo liberado: {editingSelectionState.range.length > 0
                    ? `${editingSelectionState.registration.stand_selection_slot_start ?? "?"}-${editingSelectionState.registration.stand_selection_slot_end ?? "?"}`
                    : "—"}
                </div>
                <div>
                  Quantidade esperada: {editingSelectionState.registration.stands_quantity} stand{editingSelectionState.registration.stands_quantity > 1 ? "s" : ""}
                </div>
              </div>

              {editingSelectionState.range.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {editingSelectionState.range.map((value) => {
                      const isSelected = editingSelectionChoices.includes(value);
                      return (
                        <Button
                          key={value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className={`h-12 ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-primary/30"}`}
                          onClick={() => handleToggleEditingChoice(value)}
                          disabled={editingSelectionSubmitting}
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Selecionados: {editingSelectionChoices.length}/{editingSelectionState.registration.stands_quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="sm:w-auto w-full text-muted-foreground"
                      onClick={handleClearEditingChoices}
                      disabled={editingSelectionSubmitting || editingSelectionChoices.length === 0}
                    >
                      Limpar seleção
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  Defina primeiro o intervalo de stands (início e fim) antes de editar as escolhas deste expositor.
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={closeEditingSelection} disabled={editingSelectionSubmitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveEditingSelection()}
              disabled={
                editingSelectionSubmitting ||
                !editingSelectionState ||
                editingSelectionState.range.length === 0 ||
                (editingSelectionState.registration.stands_quantity > 0 &&
                  editingSelectionChoices.length !== editingSelectionState.registration.stands_quantity)
              }
              className="min-w-[180px]"
            >
              {editingSelectionSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;