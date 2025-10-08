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
  type FetchRegistrationResult,
  type StandSelectionStatus,
} from "@/lib/stand-selection";
import {
  hasActiveSubscription,
  isPushNotificationSupported,
} from "@/lib/notifications";
import { Bell, CheckCircle2, Clock, Loader2, Lock, Search, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  const countdownIntervalRef = useRef<number | null>(null);

  const standsQuantity = registration?.registration.stands_quantity ?? 0;
  const slotStart = registration?.registration.stand_selection_slot_start ?? null;
  const slotEnd = registration?.registration.stand_selection_slot_end ?? null;

  const standRange = useMemo(() => buildStandRange(slotStart, slotEnd), [slotStart, slotEnd]);
  const maxSelectable = Math.max(1, standsQuantity || standRange.length || 1);

  useEffect(() => {
    setPushSupported(isPushNotificationSupported());
  }, []);

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
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

  useEffect(() => {
    clearCountdownInterval();

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
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    countdownIntervalRef.current = intervalId;

    return () => {
      window.clearInterval(intervalId);
      clearCountdownInterval();
    };
  }, [registration, clearCountdownInterval]);

  useEffect(() => () => {
    clearCountdownInterval();
  }, [clearCountdownInterval]);

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
                      {selectionStatus === "idle" ? (
                        <Alert className="border-primary/20 bg-primary/5">
                          <Lock className="h-4 w-4 text-primary" />
                          <AlertTitle>Janela não liberada</AlertTitle>
                          <AlertDescription>
                            O cadastro ainda não foi liberado para escolher o stand. Aguarde a equipe alterar o status
                            para <strong>Escolha seu stand</strong> e retorne com este mesmo CPF/CNPJ.
                          </AlertDescription>
                        </Alert>
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                          <span className="text-center sm:text-left">
                            Selecionados: {selectedChoices.length}/{maxSelectable}
                          </span>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full text-muted-foreground sm:w-auto"
                              onClick={() => setSelectedChoices([])}
                            >
                              Limpar seleção
                            </Button>
                            <Button
                              className="w-full sm:w-auto"
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
                      <CardTitle>Notificações automáticas</CardTitle>
                      <CardDescription>
                        Lembretes push são enviados de 5 em 5 minutos enquanto a janela estiver ativa e o cadastro ainda não tiver escolhido o stand.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!pushSupported ? (
                        <Alert className="border-amber-200 bg-amber-50">
                          <Bell className="h-4 w-4 text-amber-600" />
                          <AlertTitle>Ative em outro dispositivo</AlertTitle>
                          <AlertDescription>
                            Este navegador não suporta notificações push. Consulte o cadastro em um aparelho compatível para receber os alertas automáticos.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-3 text-sm text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className={subscriptionActive ? "bg-primary" : "bg-muted text-muted-foreground"}>
                              {subscriptionActive ? "Este dispositivo receberá lembretes" : "Nenhum lembrete neste dispositivo"}
                            </Badge>
                            {checkingSubscription ? (
                              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Verificando inscrição...
                              </span>
                            ) : null}
                          </div>
                          {subscriptionActive ? (
                            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                              <Bell className="h-5 w-5 text-primary" />
                              <p>
                                Você já ativou as notificações deste CPF/CNPJ. Os alertas continuam automáticos e serão reenviados enquanto a janela estiver
                                aberta.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
                              <p>
                                Para receber os lembretes automáticos, acesse a página de <Link to="/consulta" className="underline underline-offset-2 text-primary">consulta</Link> com este CPF/CNPJ, ative as notificações uma vez e mantenha-as habilitadas.
                              </p>
                              <p className="text-xs">
                                Depois de ativadas, o sistema continua enviando lembretes automáticos em todos os dispositivos autorizados.
                              </p>
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
