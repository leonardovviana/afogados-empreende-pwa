import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { ExhibitorRegistrationRow } from "@/integrations/supabase/types";
import { buildPaymentProofFilePath } from "@/lib/storage";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  BadgeCheck,
  Bell,
  BellOff,
  BellRing,
  Clock3,
  Download,
  FileWarning,
  Loader2,
  Search,
  Trash2,
  UploadCloud
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  hasActiveSubscription,
  isPushNotificationSupported,
  requestBrowserNotificationPermission,
  subscribeForRegistrationUpdates,
  unsubscribeFromRegistrationUpdates
} from "@/lib/notifications";
import { toast } from "sonner";

type RegistrationStatus =
  | "Pendente"
  | "Aguardando pagamento"
  | "Participação confirmada"
  | "Cancelado";

interface Registration {
  id: string;
  company_name: string;
  status: RegistrationStatus;
  created_at: string;
  boleto_path: string | null;
  payment_proof_path: string | null;
  payment_proof_uploaded_at: string | null;
}

const sanitizeDocument = (value: string) => value.replace(/[^0-9]/g, "").trim();

const formatCpf = (digits: string) =>
  digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

const formatCnpj = (digits: string) =>
  digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

const MAX_PROOF_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const buildDocumentCandidates = (rawValue: string, normalized: string): string[] => {
  const values = new Set<string>();
  const trimmed = rawValue.trim();

  if (trimmed) {
    values.add(trimmed);
  }

  if (normalized) {
    values.add(normalized);

    if (normalized.length === 11) {
      values.add(formatCpf(normalized));
    }

    if (normalized.length === 14) {
      values.add(formatCnpj(normalized));
    }
  }

  return Array.from(values).filter(Boolean);
};

const isPostgrestError = (error: unknown): error is PostgrestError =>
  typeof error === "object" && error !== null && "code" in error && "message" in error;

const isMissingColumnError = (error: unknown): boolean =>
  isPostgrestError(error) && (error.code === "42703" || /column .* does not exist/i.test(error.message));

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
  "Não foi possível acessar o bucket de comprovantes. Execute as últimas migrações do Supabase (como 20251003171000_refresh_payment_proof_security.sql) e tente novamente.";

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

const STATUS_NORMALIZATION_MAP: Record<string, RegistrationStatus> = {
  pendente: "Pendente",
  "aguardando pagamento": "Aguardando pagamento",
  "aguardando_pagamento": "Aguardando pagamento",
  "aprovado aguardando pagamento": "Aguardando pagamento",
  "participacao confirmada": "Participação confirmada",
  "participação confirmada": "Participação confirmada",
  "stand confirmado": "Participação confirmada",
  aprovado: "Participação confirmada",
  recusado: "Cancelado",
  cancelado: "Cancelado",
};

const normalizeStatus = (status: string): RegistrationStatus => {
  const key = normalizeStatusKey(status);
  if (!key) return "Pendente";
  return STATUS_NORMALIZATION_MAP[key] ?? "Pendente";
};

const mapRowToRegistration = (row: ExhibitorRegistrationRow): Registration => ({
  id: row.id,
  company_name: row.company_name,
  status: normalizeStatus(row.status),
  created_at: row.created_at ?? new Date().toISOString(),
  boleto_path: row.boleto_path ?? null,
  payment_proof_path: row.payment_proof_path ?? null,
  payment_proof_uploaded_at: row.payment_proof_uploaded_at ?? null,
});

const Consulta = () => {
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [lastSearched, setLastSearched] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [viewingProof, setViewingProof] = useState(false);
  const [deletingProof, setDeletingProof] = useState(false);
  const [searchedDigits, setSearchedDigits] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscribingNotifications, setSubscribingNotifications] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const openSignedUrl = (url: string, { download }: { download?: boolean } = {}) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.rel = "noopener noreferrer";
    anchor.target = "_blank";
    if (download) {
      anchor.download = "";
    }

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const statusConfig = useMemo(
    () => ({
      "Pendente": {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Em análise",
        message:
          "Seu cadastro está em avaliação pela equipe. Você receberá novidades por e-mail cadastrado.",
        icon: <Clock3 className="h-10 w-10 text-amber-500" />,
      },
      "Aguardando pagamento": {
        color: "bg-secondary/15 text-secondary border-secondary/40",
        label: "Aguardando pagamento",
        message:
          "Seu cadastro foi aprovado! Efetive o pagamento dentro do prazo para garantir a reserva do estande.",
        icon: <BadgeCheck className="h-10 w-10 text-secondary" />,
      },
      "Participação confirmada": {
        color: "bg-emerald-100 text-emerald-700 border-emerald-300",
        label: "Participação confirmada",
        message:
          "Tudo certo! Pagamento identificado e participação confirmada. Em breve enviaremos orientações finais.",
        icon: <BadgeCheck className="h-10 w-10 text-emerald-500" />,
      },
      "Cancelado": {
        color: "bg-destructive/10 text-destructive border-destructive/40",
        label: "Cancelado",
        message:
          "Seu cadastro não foi aprovado nesta edição. Entre em contato com a coordenação para entender os motivos.",
        icon: <FileWarning className="h-10 w-10 text-destructive" />,
      },
    }),
    []
  );

  useEffect(() => {
    setPushSupported(isPushNotificationSupported());
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!registration || !searchedDigits || !pushSupported) {
      setSubscriptionActive(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setCheckingSubscription(true);
        const active = await hasActiveSubscription(registration.id, searchedDigits);
        if (mounted) {
          setSubscriptionActive(active);
        }
      } catch (error) {
        console.error("Erro ao checar assinatura de notificações:", error);
        if (mounted) {
          setSubscriptionActive(false);
        }
      } finally {
        if (mounted) {
          setCheckingSubscription(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [registration, searchedDigits, pushSupported]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDoc = cpfCnpj.trim();

    if (!trimmedDoc) {
      toast.error("Digite um CPF ou CNPJ");
      return;
    }

    setLoading(true);
    setRegistration(null);

    try {
      const digits = sanitizeDocument(trimmedDoc);
      const candidates = buildDocumentCandidates(trimmedDoc, digits);

      let matchedRow: ExhibitorRegistrationRow | null = null;

      if (candidates.length > 0) {
        const { data: directMatches, error: directError } = await supabase
          .from("exhibitor_registrations")
          .select("*")
          .in("cpf_cnpj", candidates)
          .limit(1);

        if (directError) throw directError;
        matchedRow = directMatches?.[0] ?? null;
      }

      if (!matchedRow && digits) {
        const { data: normalizedMatch, error: normalizedError } = await supabase
          .from("exhibitor_registrations")
          .select("*")
          .eq("cpf_cnpj_normalized", digits)
          .maybeSingle();

        if (normalizedError) {
          if (!isMissingColumnError(normalizedError)) {
            throw normalizedError;
          }
        } else {
          matchedRow = normalizedMatch;
        }
      }

      if (!matchedRow && digits) {
        const { data: fallbackMatches, error: fallbackError } = await supabase
          .from("exhibitor_registrations")
          .select("*")
          .ilike("cpf_cnpj", `%${digits}%`)
          .limit(1);

        if (fallbackError && !isMissingColumnError(fallbackError)) {
          throw fallbackError;
        }

        matchedRow = fallbackMatches?.[0] ?? null;
      }

      if (!matchedRow) {
        toast.error("Cadastro não encontrado");
        setLastSearched(trimmedDoc);
        return;
      }

      setRegistration(mapRowToRegistration(matchedRow));
      setLastSearched(trimmedDoc);
      setSearchedDigits(digits);
    } catch (error) {
      console.error("Erro ao buscar cadastro:", error);
      toast.error("Erro ao buscar cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!registration?.boleto_path) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("boletos")
        .createSignedUrl(registration.boleto_path, 60 * 60);

      if (error || !data?.signedUrl) {
        throw error ?? new Error("Não foi possível gerar o link do boleto.");
      }

      openSignedUrl(data.signedUrl, { download: true });
    } catch (error) {
      console.error("Erro ao gerar link do boleto:", error);
      toast.error("Não foi possível abrir o boleto. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  const triggerProofSelection = () => {
    proofInputRef.current?.click();
  };

  const handleProofInputChange = async (files: FileList | null) => {
    if (!registration) {
      toast.error("Busque um cadastro antes de enviar o comprovante.");
      return;
    }

    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem (JPG, PNG, HEIC).");
      return;
    }

    if (file.size > MAX_PROOF_FILE_SIZE) {
      toast.error("Arquivo muito grande. Envie imagens de até 20MB.");
      return;
    }

    setUploadingProof(true);

    try {
      const storedPath = buildPaymentProofFilePath(registration.id, file.name || "comprovante.jpg");

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(storedPath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const nowIso = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("exhibitor_registrations")
        .update({
          payment_proof_path: storedPath,
          payment_proof_uploaded_at: nowIso,
          updated_at: nowIso,
        } as never)
        .eq("id", registration.id);

      if (updateError) {
        throw updateError;
      }

      setRegistration((current) =>
        current
          ? {
              ...current,
              payment_proof_path: storedPath,
              payment_proof_uploaded_at: nowIso,
            }
          : current
      );

      toast.success("Comprovante enviado com sucesso! Vamos validar o pagamento.");
    } catch (error) {
      console.error("Erro ao enviar comprovante:", error);
      if (
        (isPostgrestError(error) &&
          (error.code === "42501" || error.code === "42P01" || isMissingColumnError(error))) ||
        isStoragePermissionError(error)
      ) {
        toast.error(PAYMENT_PROOF_PERMISSION_MESSAGE);
      } else {
        toast.error("Não foi possível enviar o comprovante. Tente novamente.");
      }
    } finally {
      setUploadingProof(false);
      if (proofInputRef.current) {
        proofInputRef.current.value = "";
      }
    }
  };

  const handleViewPaymentProof = async () => {
    if (!registration?.payment_proof_path) {
      toast.error("Nenhum comprovante enviado ainda.");
      return;
    }

    setViewingProof(true);
    try {
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(registration.payment_proof_path, 60 * 60);

      if (error || !data?.signedUrl) {
        throw error ?? new Error("Não foi possível gerar o link do comprovante.");
      }

  openSignedUrl(data.signedUrl);
    } catch (error) {
      console.error("Erro ao abrir comprovante:", error);
      if (isStoragePermissionError(error)) {
        toast.error(PAYMENT_PROOF_PERMISSION_MESSAGE);
      } else {
        toast.error("Não foi possível abrir o comprovante. Tente novamente.");
      }
    } finally {
      setViewingProof(false);
    }
  };

  const handleDeletePaymentProof = async () => {
    if (!registration?.payment_proof_path) {
      toast.error("Nenhum comprovante enviado para remover.");
      return;
    }

    const shouldDelete = window.confirm(
      "Deseja realmente remover o comprovante enviado? Você poderá anexar outro em seguida."
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingProof(true);

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

      setRegistration((current) =>
        current
          ? {
              ...current,
              payment_proof_path: null,
              payment_proof_uploaded_at: null,
            }
          : current
      );

      toast.success("Comprovante removido. Envie um novo arquivo quando estiver pronto.");
    } catch (error) {
      console.error("Erro ao remover comprovante:", error);
      if (
        (isPostgrestError(error) &&
          (error.code === "42501" || error.code === "42P01" || isMissingColumnError(error))) ||
        isStoragePermissionError(error)
      ) {
        toast.error(PAYMENT_PROOF_PERMISSION_MESSAGE);
      } else {
        toast.error("Não foi possível remover o comprovante. Tente novamente.");
      }
    } finally {
      setDeletingProof(false);
      if (proofInputRef.current) {
        proofInputRef.current.value = "";
      }
    }
  };

  const promptNotificationPermission = async (): Promise<NotificationPermission> => {
    try {
      const permission = await requestBrowserNotificationPermission();
      setNotificationPermission(permission);
      if (permission === "denied") {
        setPushError(
          "Permita notificações do navegador para receber alertas de novas atualizações. Você pode ajustar isso nas configurações do dispositivo."
        );
      }
      return permission;
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificação:", error);
      setPushError("Não foi possível solicitar permissão de notificação.");
      return "denied";
    }
  };

  const handleSubscribeNotifications = async () => {
    if (!registration || !searchedDigits) return;

    setPushError(null);

    if (!pushSupported) {
      setPushError("Este dispositivo não suporta notificações push.");
      return;
    }

    const permission = await promptNotificationPermission();
    if (permission !== "granted") {
      toast.error("Notificações bloqueadas. Ajuste as permissões do navegador para ativar.");
      return;
    }

    try {
      setSubscribingNotifications(true);
      await subscribeForRegistrationUpdates({
        registrationId: registration.id,
        cpfDigits: searchedDigits,
        status: registration.status,
        companyName: registration.company_name,
      });
      toast.success("Tudo pronto! Avisaremos quando o status mudar.");
      setSubscriptionActive(true);
    } catch (error) {
      console.error("Erro ao inscrever notificações:", error);
      setPushError("Não foi possível ativar as notificações agora. Tente novamente em instantes.");
    } finally {
      setSubscribingNotifications(false);
    }
  };

  const handleUnsubscribeNotifications = async () => {
    if (!registration || !searchedDigits) return;

    try {
      setSubscribingNotifications(true);
      await unsubscribeFromRegistrationUpdates(registration.id, searchedDigits);
      toast.success("Você não receberá mais alertas para este cadastro.");
      setSubscriptionActive(false);
    } catch (error) {
      console.error("Erro ao cancelar notificações:", error);
      setPushError("Não foi possível cancelar as notificações. Tente novamente.");
    } finally {
      setSubscribingNotifications(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 -z-10"></div>
      
      <Navigation />

      <main className="flex-1 pt-20 md:pt-24 pb-16 bg-gradient-to-b from-background via-secondary/10 to-background/40">
        <section className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl flex-1 gap-8 md:gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:items-start lg:gap-12">
            <div className="rounded-[2.5rem] border border-primary/10 bg-white/90 p-6 shadow-elegant backdrop-blur-md md:p-10 lg:sticky lg:top-28">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Consulta de inscrição
                </span>
                <h1 className="text-3xl font-bold text-primary sm:text-4xl">
                  Acompanhe o status do seu cadastro
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Informe o CPF ou CNPJ utilizado na inscrição para visualizar a situação da sua participação, baixar boletos e acompanhar atualizações.
                </p>
              </div>

              <form onSubmit={handleSearch} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj" className="text-sm font-semibold text-primary">
                    CPF ou CNPJ da empresa
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="cpfCnpj"
                      placeholder="000.000.000-00"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      className="flex-1 rounded-2xl border-primary/20 bg-white/80 text-sm md:text-base"
                    />
                    <Button
                      type="submit"
                      className="rounded-2xl bg-secondary px-6 py-5 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-light"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </form>

              {lastSearched && !registration && (
                <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  Não encontramos nenhum cadastro associado a <span className="font-semibold">{lastSearched}</span>. Verifique se o número está correto ou tente novamente mais tarde.
                </div>
              )}
            </div>

            <div className="flex h-full flex-col">
              <div className="h-full rounded-[2.5rem] border border-primary/10 bg-white/80 p-6 shadow-elegant backdrop-blur md:p-10 lg:min-h-[540px]">
                {registration ? (
                  <div className="flex h-full flex-col gap-8">
                    <div className="space-y-6">
                      <div className="space-y-3 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                          {statusConfig[registration.status]?.icon}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-primary">
                            {registration.company_name}
                          </h2>
                          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                            Cadastro realizado em {new Date(registration.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`mx-auto w-fit rounded-full border px-5 py-2 text-sm font-semibold shadow-sm ${
                          statusConfig[registration.status]?.color ?? "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {statusConfig[registration.status]?.label ?? registration.status}
                      </div>

                      <p className="text-center text-sm leading-relaxed text-muted-foreground">
                        {statusConfig[registration.status]?.message}
                      </p>

                      {registration.status === "Aguardando pagamento" && (
                        <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4 text-center text-sm text-secondary">
                          Finalize o pagamento dentro do prazo informado para garantir seu espaço.
                          Assim que o comprovante for validado, o status mudará automaticamente.
                        </div>
                      )}

                      {registration.status === "Participação confirmada" && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
                          Tudo certo! Aproveite para revisar o manual do expositor e preparar a montagem do estande.
                        </div>
                      )}

                      {registration.status === "Pendente" && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
                          Nossa equipe pode solicitar documentos complementares. Fique atento aos canais oficiais.
                        </div>
                      )}

                      {registration.status === "Aguardando pagamento" && registration.boleto_path ? (
                        <Button
                          type="button"
                          onClick={handleDownload}
                          disabled={downloading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-light"
                        >
                          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          {downloading ? "Gerando link..." : "Baixar boleto atualizado"}
                        </Button>
                      ) : (
                        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center text-xs text-muted-foreground">
                          {registration.status === "Aguardando pagamento"
                            ? "O boleto será disponibilizado aqui assim que a coordenação anexar o documento."
                            : "No momento, não há boleto disponível para este status."}
                        </div>
                      )}

                      <div className="rounded-2xl border border-primary/10 bg-white/70 p-4 text-sm text-muted-foreground">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                              {subscriptionActive ? <BellRing className="h-4 w-4 text-primary" /> : <Bell className="h-4 w-4 text-primary" />}
                              Receba avisos ao mudar de status
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Ative as notificações para ser alertado assim que houver atualizações no cadastro.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button
                              type="button"
                              disabled={
                                subscribingNotifications ||
                                checkingSubscription ||
                                !pushSupported ||
                                notificationPermission === "denied" ||
                                !searchedDigits
                              }
                              onClick={subscriptionActive ? handleUnsubscribeNotifications : handleSubscribeNotifications}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
                            >
                              {subscribingNotifications || checkingSubscription ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : subscriptionActive ? (
                                <BellOff className="h-4 w-4" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                              {checkingSubscription
                                ? "Verificando..."
                                : subscriptionActive
                                  ? "Desativar alertas"
                                  : notificationPermission === "denied"
                                    ? "Notificações bloqueadas"
                                    : "Receber notificações"}
                            </Button>
                            {notificationPermission === "denied" && (
                              <button
                                type="button"
                                className="text-xs text-primary underline decoration-dotted"
                                onClick={() => {
                                  toast.info(
                                    "Ajuste as permissões do site nas configurações do navegador para permitir notificações."
                                  );
                                }}
                              >
                                Como liberar notificações?
                              </button>
                            )}
                          </div>
                        </div>
                        {!pushSupported && (
                          <p className="mt-2 text-xs text-destructive">
                            O seu navegador não suporta notificações push. Use outro dispositivo para receber alertas.
                          </p>
                        )}
                        {pushError && (
                          <p className="mt-2 text-xs text-destructive">{pushError}</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-primary">Envie o comprovante de pagamento</h3>
                            <p className="text-xs text-muted-foreground">
                              Fotografe na hora ou escolha uma imagem da galeria para agilizar a validação.
                            </p>
                            {registration.payment_proof_uploaded_at && (
                              <p className="text-[11px] text-muted-foreground/80">
                                Último envio em {new Date(registration.payment_proof_uploaded_at).toLocaleString("pt-BR")}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 sm:items-stretch sm:gap-3">
                            <input
                              ref={proofInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              aria-label="Selecionar comprovante de pagamento"
                              onChange={(event) => handleProofInputChange(event.target.files)}
                            />
                            {registration.status === "Aguardando pagamento" ? (
                              <>
                                <Button
                                  type="button"
                                  onClick={triggerProofSelection}
                                  disabled={uploadingProof}
                                  className="inline-flex w-full items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-light"
                                >
                                  {uploadingProof ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UploadCloud className="h-4 w-4" />
                                  )}
                                  {uploadingProof ? "Enviando..." : "Enviar comprovante"}
                                </Button>
                                {registration.payment_proof_path ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={viewingProof}
                                      onClick={handleViewPaymentProof}
                                      className="inline-flex w-full items-center gap-2 rounded-2xl border-primary/20 text-primary transition hover:bg-primary/5"
                                    >
                                      {viewingProof ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                      {viewingProof ? "Abrindo..." : "Ver comprovante"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      disabled={deletingProof}
                                      onClick={handleDeletePaymentProof}
                                      className="inline-flex w-full items-center gap-2 rounded-2xl"
                                    >
                                      {deletingProof ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                      {deletingProof ? "Removendo..." : "Remover comprovante"}
                                    </Button>
                                  </>
                                ) : null}
                              </>
                            ) : registration.payment_proof_path ? (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={viewingProof}
                                onClick={handleViewPaymentProof}
                                className="inline-flex w-full items-center gap-2 rounded-2xl border-primary/20 text-primary transition hover:bg-primary/5 sm:w-auto"
                              >
                                {viewingProof ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {viewingProof ? "Abrindo..." : "Ver comprovante"}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Apenas cadastros com status <strong>Aguardando pagamento</strong> podem anexar comprovante.
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] text-muted-foreground">
                          {registration.status === "Aguardando pagamento"
                            ? "Formatos aceitos: JPG, PNG ou HEIC. Tamanho máximo de 20MB."
                            : "Envio de comprovante disponível somente enquanto o status estiver em Aguardando pagamento."}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">Dica:</span> Após qualquer atualização do status, recarregue a página para visualizar a informação mais recente.
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-6 text-center text-muted-foreground">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <Search className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-primary">Consulte seu protocolo</h2>
                      <p className="mx-auto max-w-sm text-sm">
                        Informe o CPF ou CNPJ do responsável pela inscrição. Manter esses dados atualizados ajuda a agilizar a validação.
                      </p>
                    </div>
                    <ul className="space-y-2 text-left text-xs text-muted-foreground">
                      <li>• Use o mesmo formato digitado no formulário.</li>
                      <li>• Em caso de dúvidas, contate a coordenação pelo WhatsApp informado no manual.</li>
                      <li>• Atualizações geralmente ocorrem em até 48 horas úteis.</li>
                    </ul>
                    <Button
                      asChild
                      className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:via-teal-400 hover:to-sky-400"
                    >
                      <a
                        href="https://wa.me/5587999781331?text=Olá%2C%20preciso%20de%20ajuda%20com%20meu%20cadastro%20na%20Feira%20do%20Empreendedor"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 32 32"
                            aria-hidden="true"
                            className="h-4 w-4 text-white transition group-hover:scale-105"
                          >
                            <path
                              fill="currentColor"
                              d="M16 3C9.38 3 4 8.38 4 15c0 2.14.57 4.15 1.57 5.92L4 29l8.27-1.53C13.95 28.43 15 29 16 29c6.62 0 12-5.38 12-12S22.62 3 16 3zm0 2c5.52 0 10 4.48 10 10s-4.48 10-10 10c-.82 0-1.62-.11-2.38-.32l-.5-.14-.5.09-4.37.81.79-4.18.09-.5-.25-.45C7.63 18.53 7 16.8 7 15c0-5.52 4.48-10 10-10zm-2.93 5.02c-.27-.01-.57 0-.88.06-.46.08-.96.33-1.18.79-.31.62-.64 1.21-.73 1.89-.18 1.34.22 2.69.9 3.84.67 1.12 1.63 2.07 2.74 2.75.88.53 1.85 1.01 2.87 1.04.67.02 1.31-.15 1.88-.5.39-.24.63-.7.64-1.15.01-.36-.02-.72-.1-1.07-.06-.27-.34-.44-.61-.52-.24-.07-.49-.15-.74-.1-.3.06-.55.28-.74.5-.23.27-.49.52-.84.59-.24.05-.48-.04-.71-.12-.75-.29-1.42-.8-1.86-1.47-.15-.23-.27-.48-.29-.76-.03-.29.14-.54.32-.76.18-.23.38-.46.42-.75.03-.21-.05-.43-.1-.64-.08-.35-.17-.72-.45-.96-.21-.18-.47-.24-.74-.25z"
                            />
                          </svg>
                          Falar no WhatsApp
                        </span>
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Consulta;
