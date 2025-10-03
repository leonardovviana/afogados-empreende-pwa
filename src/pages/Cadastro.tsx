import logoFeira from "@/assets/logofeira.png";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { ExhibitorRegistrationInsert } from "@/integrations/supabase/types";
import {
    FORMATTED_PAYMENT_METHODS,
    STAND_OPTIONS,
    calculateTotalAmount,
    formatCurrencyBRL,
    type FormattedPaymentMethod,
} from "@/lib/pricing";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const sanitizeDocument = (value: string): string => value.replace(/[^0-9]/g, "").slice(0, 14);

const formatCpf = (digits: string): string => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatCnpj = (digits: string): string => {
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

const formatCpfCnpj = (value: string): string => {
  const digits = sanitizeDocument(value);
  if (digits.length <= 11) {
    return formatCpf(digits);
  }
  return formatCnpj(digits);
};

const isRepeatedSequence = (digits: string): boolean => /^([0-9])\1*$/.test(digits);

const isValidCpf = (digits: string): boolean => {
  if (digits.length !== 11 || isRepeatedSequence(digits)) {
    return false;
  }

  const calculateDigit = (sliceLength: number): number => {
    let sum = 0;
    for (let i = 0; i < sliceLength; i++) {
      sum += Number.parseInt(digits[i], 10) * (sliceLength + 1 - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(9);
  const secondDigit = calculateDigit(10);

  return firstDigit === Number.parseInt(digits[9], 10) && secondDigit === Number.parseInt(digits[10], 10);
};

const isValidCnpj = (digits: string): boolean => {
  if (digits.length !== 14 || isRepeatedSequence(digits)) {
    return false;
  }

  const calculateDigit = (factors: number[]): number => {
    const total = digits
      .slice(0, factors.length)
      .split("")
      .reduce((sum, char, index) => sum + Number.parseInt(char, 10) * factors[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return (
    firstDigit === Number.parseInt(digits[12], 10) &&
    secondDigit === Number.parseInt(digits[13], 10)
  );
};

const getDocumentValidationError = (value: string): string | null => {
  const digits = sanitizeDocument(value);

  if (digits.length === 11) {
    return isValidCpf(digits) ? null : "CPF inválido. Verifique os números informados.";
  }

  if (digits.length === 14) {
    return isValidCnpj(digits) ? null : "CNPJ inválido. Verifique os números informados.";
  }

  return "Informe um CPF com 11 dígitos ou um CNPJ com 14 dígitos.";
};

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

const hasExistingRegistration = async (
  normalized: string,
  candidates: string[]
): Promise<boolean> => {
  if (!candidates.length) {
    return false;
  }

  const { data: directMatches, error: directError } = await supabase
    .from("exhibitor_registrations")
    .select("id, cpf_cnpj")
    .in("cpf_cnpj", candidates)
    .limit(1);

  if (directError) {
    throw directError;
  }

  if (directMatches && directMatches.length > 0) {
    return true;
  }

  if (!normalized) {
    return false;
  }

  const { data: normalizedMatch, error: normalizedError } = await supabase
    .from("exhibitor_registrations")
    .select("id")
    .eq("cpf_cnpj_normalized", normalized)
    .maybeSingle();

  if (normalizedError) {
    if (isMissingColumnError(normalizedError)) {
      return false;
    }

    throw normalizedError;
  }

  return Boolean(normalizedMatch);
};

const formSchema = z.object({
  cpf_cnpj: z.string().superRefine((value, ctx) => {
    const error = getDocumentValidationError(value);
    if (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
      });
    }
  }),
  company_name: z.string().min(2, "Nome da empresa é obrigatório").max(200),
  responsible_name: z.string().min(3, "Nome completo é obrigatório").max(200),
  phone: z.string().min(10, "Telefone com DDD é obrigatório").max(15),
  company_size: z.enum(["MEI", "ME", "EPP", "Médio", "Grande", "Autônomo informal"]),
  business_segment: z.enum([
    "Alimentação",
    "Moda e Vestuário",
    "Beleza e Estética",
    "Educação",
    "Construção Civil e Reforma",
    "Saúde e Bem-Estar",
    "Turismo e Hospedagem",
    "Artesanato e Produtos Manuais",
    "Marketing e Publicidade",
    "Finanças e Seguros",
    "Imobiliário",
    "Eventos e Entretenimento",
    "Pets e Animais de Estimação",
    "Fitness e Atividades Físicas",
    "Design e Arquitetura",
    "Comércio de Veículos/Peças e Acessórios",
    "Outros",
  ]),
  other_business_segment: z.string().max(200).optional(),
  stands_quantity: z.enum(STAND_OPTIONS),
  payment_method: z.enum(FORMATTED_PAYMENT_METHODS),
}).superRefine((data, ctx) => {
  if (data.business_segment === "Outros" && (!data.other_business_segment || data.other_business_segment.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["other_business_segment"],
      message: "Descreva o segmento quando selecionar Outros.",
    });
  }

  if (data.payment_method === "R$ 750,00 Dois ou mais stands" && data.stands_quantity === "1") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payment_method"],
      message: "Selecione dois ou mais stands para essa opção de pagamento.",
    });
  }
});

type FormData = z.infer<typeof formSchema>;

const businessSegments = [
  "Alimentação",
  "Moda e Vestuário",
  "Beleza e Estética",
  "Educação",
  "Construção Civil e Reforma",
  "Saúde e Bem-Estar",
  "Turismo e Hospedagem",
  "Artesanato e Produtos Manuais",
  "Marketing e Publicidade",
  "Finanças e Seguros",
  "Imobiliário",
  "Eventos e Entretenimento",
  "Pets e Animais de Estimação",
  "Fitness e Atividades Físicas",
  "Design e Arquitetura",
  "Comércio de Veículos/Peças e Acessórios",
  "Outros",
];

const Cadastro = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf_cnpj: "",
      company_name: "",
      responsible_name: "",
      phone: "",
      company_size: undefined,
      business_segment: undefined,
      other_business_segment: "",
      stands_quantity: "1",
      payment_method: undefined,
    },
  });

  const firstStepFields: FieldPath<FormData>[] = [
    "cpf_cnpj",
    "company_name",
    "responsible_name",
    "phone",
  ];

  const handleNextStep = async () => {
    const isValid = await form.trigger(firstStepFields);
    if (isValid) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const standsQuantity = Number.parseInt(form.watch("stands_quantity") ?? "1", 10) || 1;
  const paymentMethod = form.watch("payment_method") as FormattedPaymentMethod | undefined;

  const totalAmount = calculateTotalAmount(standsQuantity, paymentMethod);

  const formattedTotal = formatCurrencyBRL(totalAmount);

  const totalSummaryMessage = paymentMethod
    ? `Total estimado: ${formattedTotal}`
    : "Selecione a forma de pagamento para visualizar o total.";

  const onSubmit = async (data: FormData) => {
    if (submitted) return;

    setLoading(true);
    try {
      const documentError = getDocumentValidationError(data.cpf_cnpj);
      if (documentError) {
        toast.error(documentError);
        setLoading(false);
        return;
      }

      const normalizedDocument = sanitizeDocument(data.cpf_cnpj);
      const documentCandidates = buildDocumentCandidates(data.cpf_cnpj, normalizedDocument);

      const duplicate = await hasExistingRegistration(normalizedDocument, documentCandidates);
      if (duplicate) {
        toast.error("Este CPF/CNPJ já está cadastrado.");
        setLoading(false);
        return;
      }

      const computedTotal = calculateTotalAmount(
        Number.parseInt(data.stands_quantity, 10),
        data.payment_method
      );

      const businessSegment =
        data.business_segment === "Outros" && data.other_business_segment
          ? data.other_business_segment
          : data.business_segment;

      const insertPayload: ExhibitorRegistrationInsert = {
        cpf_cnpj: normalizedDocument || data.cpf_cnpj.trim(),
        cpf_cnpj_normalized: normalizedDocument || null,
        company_name: data.company_name.trim(),
        responsible_name: data.responsible_name.trim(),
        phone: data.phone.trim(),
        company_size: data.company_size,
        business_segment: businessSegment,
        stands_quantity: Number.parseInt(data.stands_quantity, 10),
        payment_method: data.payment_method,
        status: "Pendente" as const,
        total_amount: computedTotal,
        boleto_path: null,
        boleto_uploaded_at: null,
        payment_proof_path: null,
        payment_proof_uploaded_at: null,
      };

      let usedFallbackInsert = false;

      const { error: insertError } = await supabase
        .from("exhibitor_registrations")
        .insert([insertPayload]);

      if (insertError) {
        if (isMissingColumnError(insertError)) {
          console.warn(
            "Coluna cpf_cnpj_normalized ausente no banco. Tentando salvar sem o campo. Aplique a nova migration para restaurar a deduplicação.",
            insertError
          );

          const { cpf_cnpj_normalized: _ignored, ...fallbackPayload } = insertPayload;

          const { error: retryError } = await supabase
            .from("exhibitor_registrations")
            .insert([fallbackPayload as ExhibitorRegistrationInsert]);

          if (retryError) {
            throw retryError;
          }

          usedFallbackInsert = true;
        } else {
          throw insertError;
        }
      }

      toast.success("Cadastro realizado com sucesso!", {
        description: "Atualize a página se precisar enviar outro cadastro.",
      });

      if (usedFallbackInsert) {
        toast.warning("Configure o banco para evitar cadastros duplicados", {
          description: "Execute a migration 20251002153000_add_cpf_cnpj_normalized.sql no Supabase para habilitar a deduplicação automática.",
        });
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      if (isPostgrestError(error) && error.code === "23505") {
        toast.error("Este CPF/CNPJ já está cadastrado.");
      } else {
        const description = isPostgrestError(error) ? error.message : undefined;
        toast.error("Erro ao realizar cadastro. Tente novamente.", description ? { description } : undefined);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 -z-10"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDRENDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTAgMTZjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTE2IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptMC0xNmMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10 -z-10"></div>
      
      <Navigation />

  <main className="flex-1 pt-10 md:pt-28 pb-12 md:pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header Card */}
          <div className="glass-card rounded-3xl p-6 md:p-8 mb-6 md:mb-8 text-center animate-bounce-in shadow-mega glass-card-hover">
            <img
              src={logoFeira}
              alt="Logo 8ª Feira do Empreendedor"
              className="mx-auto mb-4 w-24 md:w-32 h-auto object-contain"
              draggable={false}
            />
            <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 text-primary">
              Cadastro de <span className="gradient-text">Expositor</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Preencha os dados abaixo e garanta seu espaço na 8ª Feira do Empreendedor
            </p>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl shadow-mega p-5 md:p-10 animate-fade-in-up hover-lift glass-card-hover animation-delay-200">
            {!submitted ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-primary">
                    <span className="font-medium">
                      {step === 1 ? "Etapa 1 de 2" : "Etapa 2 de 2"}
                    </span>
                    <span>
                      {step === 1
                        ? "Dados da empresa"
                        : "Detalhes da participação"}
                    </span>
                  </div>

                  {step === 1 ? (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="cpf_cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF ou CNPJ *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                inputMode="numeric"
                                maxLength={18}
                                {...field}
                                onChange={(event) => {
                                  const formatted = formatCpfCnpj(event.target.value);
                                  field.onChange(formatted);
                                }}
                                value={field.value}
                              />
                            </FormControl>
                            <FormDescription>Apenas números serão considerados. A formatação será aplicada automaticamente.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Empresa *</FormLabel>
                            <FormControl>
                              <Input placeholder="Razão social ou nome fantasia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="responsible_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo do Responsável *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone com DDD *</FormLabel>
                            <FormControl>
                              <Input placeholder="(87) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full bg-secondary hover:bg-secondary-light text-white font-semibold"
                      >
                        Avançar para detalhes
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="company_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Porte da Empresa *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o porte" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MEI">MEI</SelectItem>
                                <SelectItem value="ME">ME</SelectItem>
                                <SelectItem value="EPP">EPP</SelectItem>
                                <SelectItem value="Médio">Médio</SelectItem>
                                <SelectItem value="Grande">Grande</SelectItem>
                                <SelectItem value="Autônomo informal">Autônomo informal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business_segment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segmento de Atuação *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o segmento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {businessSegments.map((segment) => (
                                  <SelectItem key={segment} value={segment}>
                                    {segment}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("business_segment") === "Outros" && (
                        <FormField
                          control={form.control}
                          name="other_business_segment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descreva o segmento</FormLabel>
                              <FormControl>
                                <Input placeholder="Informe o segmento da sua empresa" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="stands_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade de Stands Desejada *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a quantidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {STAND_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option} {Number(option) > 1 ? "stands" : "stand"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Os estandes medem 3x3&nbsp;m (9&nbsp;m²). Apenas os estandes de gastronomia medem 4x3&nbsp;m (12&nbsp;m²).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Forma de Pagamento *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a forma" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="R$ 700,00 No lançamento">
                                  R$ 700,00 No lançamento
                                </SelectItem>
                                <SelectItem value="R$ 850,00 Após o lançamento">
                                  R$ 850,00 Após o lançamento
                                </SelectItem>
                                <SelectItem value="R$ 750,00 Dois ou mais stands">
                                  R$ 750,00 Dois ou mais stands
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                        <p className="text-sm text-muted-foreground">Resumo financeiro</p>
                        <p className="text-lg font-semibold text-primary">
                          {totalSummaryMessage}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          Valor calculado automaticamente com base na quantidade de stands e na forma escolhida.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePreviousStep}
                          className="md:w-1/3"
                        >
                          Voltar
                        </Button>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary shadow-mega text-white font-bold rounded-2xl relative overflow-hidden group md:w-2/3"
                          size="lg"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Enviando cadastro...
                            </>
                          ) : (
                            <>
                              <span className="relative z-10">ENVIAR CADASTRO</span>
                              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4 py-10">
                <div className="inline-flex rounded-full bg-secondary/10 p-4 text-secondary">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-semibold text-primary">Cadastro enviado!</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Recebemos os seus dados com sucesso. Nossa equipe entrará em contato para confirmar os próximos passos. Para registrar outro expositor, atualize a página.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Recarregar página
                </Button>
              </div>
            )}
          </div>

          <div className="glass-card rounded-3xl shadow-mega p-6 md:p-10 mt-8 animate-fade-in-up animation-delay-200">
            <h2 className="text-lg font-semibold text-primary mt-6 mb-2">Observações</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>O simples preenchimento dessa ficha não garante a sua participação na feira. A participação é confirmada somente após o pagamento do DAM (Documento de Arrecadação Municipal).</li>
              <li>Todas as informações preenchidas nesse formulário são de responsabilidade do expositor.</li>
              <li>Preencha os dados com atenção para evitar falhas na emissão da guia de pagamento.</li>
            </ol>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cadastro;