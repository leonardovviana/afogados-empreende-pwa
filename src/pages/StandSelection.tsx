import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildStandRange,
  computeStandSelectionStatus,
  fetchRegistrationByDocument,
  parseStandChoices,
  sanitizeDocumentDigits,
  submitStandSelection,
  triggerStandSelectionNotification,
  type FetchRegistrationResult,
  type StandSelectionStatus,
} from "@/lib/stand-selection";
import {
  hasActiveSubscription,
  isPushNotificationSupported,
  requestBrowserNotificationPermission,
  subscribeForRegistrationUpdates,
} from "@/lib/notifications";
import { Bell, BellRing, CheckCircle2, Clock, Loader2, Search, ShieldCheck, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface CountdownState {
  hasWindow: boolean;
  expired: boolean;
  totalSeconds: number;
  display: string;
}

const formatCountdown = (expiresAt: string | null): CountdownState => {
  if (!expiresAt) {
    return {
      hasWindow: false,
      expired: false,
      totalSeconds: 0,
      display: "Janela não iniciada",
    };
  }

  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) {
    return {
      hasWindow: false,
      expired: false,
      totalSeconds: 0,
      display: "Janela inválida",
    };
  }

  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((expires - now) / 1000));
  const expired = diffSeconds === 0;
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;

  return {
    hasWindow: true,
    expired,
    totalSeconds: diffSeconds,
    display: expired
      ? "00:00"
      : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
  };
};

const StandSelection = () => {
  const [documentValue, setDocumentValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [registration, setRegistration] = useState<FetchRegistrationResult | null>(null);
  const [normalizedDocument, setNormalizedDocument] = useState<string | null>(null);
  const [selectionStatus, setSelectionStatus] = useState<StandSelectionStatus>("idle");
  const [countdown, setCountdown] = useState<CountdownState>({
    hasWindow: false,
    expired: false,
    totalSeconds: 0,
    display: "",
  });
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [submittingChoices, setSubmittingChoices] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscribingNotifications, setSubscribingNotifications] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const reminderIntervalRef = useRef<number | null>(null);
  const lastReminderRef = useRef<number>(0);

  const standsQuantity = registration?.registration.stands_quantity ?? 0;
  const slotStart = registration?.registration.stand_selection_slot_start ?? null;
  const slotEnd = registration?.registration.stand_selection_slot_end ?? null;

  const standRange = useMemo(() => buildStandRange(slotStart, slotEnd), [slotStart, slotEnd]);
  const maxSelectable = Math.max(1, standsQuantity || standRange.length || 1);

  useEffect(() => {
    setPushSupported(isPushNotificationSupported());
  }, []);

  const clearReminderInterval = useCallback(() => {
    if (reminderIntervalRef.current) {
      window.clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
  }, []);

  const refreshRegistration = useCallback(async (documentDigits: string) => {
    try {
      const result = await fetchRegistrationByDocument(documentDigits);
      if (!result) {
        setRegistration(null);
        setSelectionStatus("idle");
        setCountdown({ hasWindow: false, expired: false, totalSeconds: 0, display: "" });
        setSelectedChoices([]);
        return;
      }

      setRegistration(result);
      setSelectionStatus(computeStandSelectionStatus(result.registration));
      setCountdown(formatCountdown(result.registration.stand_selection_window_expires_at));
      setSelectedChoices(parseStandChoices(result.registration.stand_selection_choices));
    } catch (error) {
      console.error("Erro ao consultar cadastro:", error);
      toast.error("Não foi possível consultar os dados do cadastro. Tente novamente.");
    }
  }, []);

  const handleSearch = useCallback(async () => {
    const digits = sanitizeDocumentDigits(documentValue);
    if (!digits) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }

    setSearching(true);
    try {
      await refreshRegistration(digits);
      setNormalizedDocument(digits);
    } finally {
      setSearching(false);
    }
  }, [documentValue, refreshRegistration]);

  const sendStandNotification = useCallback(
    async (reminder = false, silent = false) => {
      if (!registration || !normalizedDocument) {
        if (!silent) {
          toast.error("Realize uma consulta antes de enviar notificações.");
        }
        return;
      }

      if (
        registration.registration.stand_selection_slot_start == null ||
        registration.registration.stand_selection_slot_end == null
      ) {
        if (!silent) {
          toast.error("Defina o intervalo de stands antes de enviar notificações.");
        }
        return;
      }

      try {
        if (!silent) {
          setSendingReminder(true);
        }
        await triggerStandSelectionNotification({
          registrationId: registration.registration.id,
          companyName: registration.registration.company_name,
          slotStart: registration.registration.stand_selection_slot_start,
          slotEnd: registration.registration.stand_selection_slot_end,
          windowExpiresAt: registration.registration.stand_selection_window_expires_at,
          standsQuantity: registration.registration.stands_quantity ?? 1,
          reminder,
        });
        lastReminderRef.current = Date.now();
        if (!silent) {
          toast.success(reminder ? "Lembrete enviado com sucesso!" : "Notificação enviada.");
        }
      } catch (error) {
        console.error("Erro ao enviar notificação de stand:", error);
        if (!silent) {
          toast.error("Não foi possível enviar a notificação. Tente novamente.");
        }
      } finally {
        if (!silent) {
          setSendingReminder(false);
        }
      }
    },
    [registration, normalizedDocument]
  );

  useEffect(() => {
    clearReminderInterval();

    if (!registration) {
      setCountdown({ hasWindow: false, expired: false, totalSeconds: 0, display: "" });
      setSelectedChoices([]);
      return () => undefined;
    }

    setSelectionStatus(computeStandSelectionStatus(registration.registration));
    setCountdown(formatCountdown(registration.registration.stand_selection_window_expires_at));
    setSelectedChoices(parseStandChoices(registration.registration.stand_selection_choices));

    const updateCountdown = () => {
      const next = formatCountdown(registration.registration.stand_selection_window_expires_at);
      setCountdown(next);

      if (
        subscriptionActive &&
        normalizedDocument &&
        registration.registration.status === "Escolha seu stand" &&
        next.hasWindow &&
        !next.expired &&
        Date.now() - lastReminderRef.current >= 5 * 60 * 1000
      ) {
        void sendStandNotification(true, true);
      }
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    reminderIntervalRef.current = intervalId;

    return () => {
      window.clearInterval(intervalId);
      clearReminderInterval();
    };
  }, [registration, subscriptionActive, normalizedDocument, sendStandNotification, clearReminderInterval]);

  useEffect(() => () => {
    clearReminderInterval();
  }, [clearReminderInterval]);

  useEffect(() => {
    let active = true;

    if (!registration || !normalizedDocument || !pushSupported) {
      setSubscriptionActive(false);
      return () => {
        active = false;
      };
    }

    setCheckingSubscription(true);
    void hasActiveSubscription(registration.registration.id, normalizedDocument)
      .then((result) => {
        if (active) {
          setSubscriptionActive(result);
        }
      })
      .catch((error) => {
        console.error("Erro ao verificar inscrição de notificações:", error);
      })
      .finally(() => {
        if (active) {
          setCheckingSubscription(false);
        }
      });

    return () => {
      active = false;
    };
  }, [registration, normalizedDocument, pushSupported]);

  const toggleChoice = useCallback(
    (value: number) => {
      setSelectedChoices((current) => {
        if (current.includes(value)) {
          return current.filter((item) => item !== value);
        }

        if (current.length >= maxSelectable) {
          toast.error(`Escolha apenas ${maxSelectable} stand${maxSelectable > 1 ? "s" : ""}.`);
          return current;
        }

        return [...current, value];
      });
    },
    [maxSelectable]
  );

  const handleSubscribeNotifications = useCallback(async () => {
    if (!registration || !normalizedDocument) {
      toast.error("Realize uma consulta antes de ativar as notificações.");
      return;
    }

    if (!pushSupported) {
      toast.error("Este dispositivo ou navegador não suporta notificações push.");
      return;
    }

    try {
      setSubscribingNotifications(true);
      const permission = await requestBrowserNotificationPermission();
      if (permission !== "granted") {
        toast.error("É necessário permitir notificações neste navegador.");
        return;
      }

      await subscribeForRegistrationUpdates({
        registrationId: registration.registration.id,
        cpfDigits: normalizedDocument,
        status: registration.registration.status,
        companyName: registration.registration.company_name,
      });

      setSubscriptionActive(true);
      toast.success("Notificações ativadas com sucesso!");
    } catch (error) {
      console.error("Erro ao ativar notificações:", error);
      toast.error("Não foi possível ativar as notificações. Tente novamente.");
    } finally {
      setSubscribingNotifications(false);
    }
  }, [registration, normalizedDocument, pushSupported]);

  const handleSubmitChoices = useCallback(async () => {
    if (!registration) {
      toast.error("Faça uma consulta antes de selecionar os stands.");
      return;
    }

    if (selectedChoices.length !== maxSelectable) {
      toast.error(`Escolha exatamente ${maxSelectable} stand${maxSelectable > 1 ? "s" : ""}.`);
      return;
    }

    try {
      setSubmittingChoices(true);
      await submitStandSelection(registration.registration.id, selectedChoices, {
        finalizeStatus: "Participação confirmada",
      });
      toast.success("Escolha registrada com sucesso!");
      lastReminderRef.current = Date.now();
      await refreshRegistration(normalizedDocument ?? "");
    } catch (error) {
      console.error("Erro ao enviar escolha de stand:", error);
      toast.error("Não foi possível enviar sua escolha. Tente novamente.");
    } finally {
      setSubmittingChoices(false);
    }
  }, [registration, selectedChoices, maxSelectable, refreshRegistration, normalizedDocument]);

  const renderStatusBanner = useCallback(() => {
    if (!registration) return null;

    switch (selectionStatus) {
      case "completed":
        return (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Seleção concluída</AlertTitle>
            <AlertDescription>
              Você enviou sua escolha. Caso precise ajustar, contate a coordenação da feira.
            </AlertDescription>
          </Alert>
        );
      case "active":
        return (
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertTitle>Janela de escolha ativa</AlertTitle>
            <AlertDescription>
              Escolha seus stands antes que o tempo termine. Você tem {countdown.display.replace(":", " minutos e ")}
              {countdown.display.endsWith(":00") ? "" : " segundos"} restantes.
            </AlertDescription>
          </Alert>
        );
      case "expired":
        return (
          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle>Tempo esgotado</AlertTitle>
            <AlertDescription>
              A janela de escolha expirou. Entre em contato com o suporte para verificar a disponibilidade.
            </AlertDescription>
          </Alert>
        );
      case "pending":
        return (
          <Alert className="border-primary/30 bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle>Aguarde a liberação</AlertTitle>
            <AlertDescription>
              Estamos preparando sua janela de escolha. Você será notificado assim que estiver disponível.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  }, [registration, selectionStatus, countdown.display]);

  const lastNotificationLabel = useMemo(() => {
    const timestamp = registration?.registration.stand_selection_notification_last_sent;
    if (!timestamp) return "—";
    try {
      return new Date(timestamp).toLocaleString("pt-BR");
    } catch (error) {
      console.warn("Não foi possível formatar a data da última notificação:", error);
      return timestamp;
    }
  }, [registration]);

  const recordedChoices = useMemo(() => {
    if (!registration?.registration.stand_selection_choices) {
      return [] as number[];
    }
    return parseStandChoices(registration.registration.stand_selection_choices);
  }, [registration]);

  const selectionEnabled = selectionStatus === "active" && standRange.length > 0 && !countdown.expired;
  const canSendReminder = subscriptionActive && selectionStatus === "active" && !countdown.expired;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-sand">
      <Navigation />
      <main className="flex-1">
        <section className="mt-24 bg-gradient-hero py-16 text-primary">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-3xl border border-primary/10 bg-white/90 p-8 shadow-elegant">
              <div className="mb-8 space-y-2 text-center">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Escolha seu stand
                </Badge>
                <h1 className="text-3xl font-bold">Reserve o seu espaço na feira</h1>
                <p className="text-sm text-muted-foreground">
                  Informe o CPF ou CNPJ utilizado no cadastro para verificar se a sua janela de escolha está ativa.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <Label htmlFor="document">CPF ou CNPJ</Label>
                  <Input
                    id="document"
                    placeholder="000.000.000-00"
                    value={documentValue}
                    onChange={(event) => setDocumentValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleSearch();
                      }
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={() => void handleSearch()} disabled={searching}>
                    {searching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Consultar
                  </Button>
                </div>
              </div>

              {registration ? (
                <div className="mt-8 space-y-6">
                  {renderStatusBanner()}

                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">{registration.registration.company_name}</CardTitle>
                      <CardDescription>
                        Situação atual: <strong>{registration.registration.status}</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex flex-wrap gap-4">
                        <span>
                          <strong>Quantidade de stands:</strong> {registration.registration.stands_quantity}
                        </span>
                        <span>
                          <strong>Intervalo liberado:</strong> {standRange.length > 0 ? `${slotStart}-${slotEnd}` : "não definido"}
                        </span>
                        <span>
                          <strong>Tempo restante:</strong> {countdown.display}
                        </span>
                        <span>
                          <strong>Notificações enviadas:</strong> {registration.registration.stand_selection_notifications_count ?? 0}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground/80">
                        Última notificação: {lastNotificationLabel}
                      </div>
                      {recordedChoices.length > 0 ? (
                        <div className="text-sm text-primary">
                          <strong>Escolha registrada:</strong> {recordedChoices.join(", ")}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  {selectionEnabled ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Selecione os seus stands</CardTitle>
                        <CardDescription>
                          Escolha exatamente {maxSelectable} stand{maxSelectable > 1 ? "s" : ""} dentro do intervalo definido.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {standRange.length === 0 ? (
                          <Alert className="border-amber-200 bg-amber-50">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <AlertTitle>Intervalo não configurado</AlertTitle>
                            <AlertDescription>
                              Aguarde a definição dos stands disponíveis pela equipe administrativa.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {standRange.map((value) => {
                              const isSelected = selectedChoices.includes(value);
                              return (
                                <Button
                                  key={value}
                                  type="button"
                                  variant={isSelected ? "default" : "outline"}
                                  className={`h-12 ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-primary/30"}`}
                                  onClick={() => toggleChoice(value)}
                                >
                                  {value}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                          <span>
                            Selecionados: {selectedChoices.length}/{maxSelectable}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => setSelectedChoices([])}
                            >
                              Limpar seleção
                            </Button>
                            <Button
                              onClick={() => void handleSubmitChoices()}
                              disabled={submittingChoices || selectedChoices.length !== maxSelectable}
                            >
                              {submittingChoices ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              Confirmar escolha
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  <Card>
                    <CardHeader>
                      <CardTitle>Notificações</CardTitle>
                      <CardDescription>
                        Receba alertas push a cada 5 minutos enquanto a janela estiver ativa para não perder o prazo.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!pushSupported ? (
                        <Alert className="border-amber-200 bg-amber-50">
                          <Smartphone className="h-4 w-4 text-amber-600" />
                          <AlertTitle>Recurso indisponível</AlertTitle>
                          <AlertDescription>
                            Este dispositivo ou navegador não suporta notificações push. Recomendamos ativar em outro dispositivo.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <Badge className={subscriptionActive ? "bg-primary" : "bg-muted text-muted-foreground"}>
                              {subscriptionActive ? "Notificações ativas" : "Notificações inativas"}
                            </Badge>
                            {checkingSubscription ? "Verificando inscrição..." : null}
                          </div>
                          {!subscriptionActive ? (
                            <Button
                              onClick={() => void handleSubscribeNotifications()}
                              disabled={subscribingNotifications}
                              className="flex items-center gap-2"
                            >
                              {subscribingNotifications ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                              Ativar notificações
                            </Button>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <Button
                                variant="outline"
                                onClick={() => void sendStandNotification(false)}
                                disabled={sendingReminder}
                                className="flex items-center gap-2"
                              >
                                {sendingReminder ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Bell className="h-4 w-4" />
                                )}
                                Enviar lembrete agora
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => void sendStandNotification(true)}
                                disabled={sendingReminder || !canSendReminder}
                                className="flex items-center gap-2 text-muted-foreground"
                              >
                                {sendingReminder ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <BellRing className="h-4 w-4" />
                                )}
                                Reenviar lembrete manualmente
                              </Button>
                              {!canSendReminder ? (
                                <p className="text-xs text-muted-foreground">
                                  Os lembretes automáticos serão enviados quando a janela estiver ativa e dentro do prazo.
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Um lembrete é disparado automaticamente a cada 5 minutos até que a escolha seja registrada.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
                  Informe o CPF ou CNPJ para verificar se a escolha de stand está liberada para o seu cadastro.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StandSelection;
