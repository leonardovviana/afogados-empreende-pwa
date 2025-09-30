import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  cpf_cnpj: z.string().min(11, "CPF/CNPJ deve ter no mínimo 11 caracteres").max(18, "CPF/CNPJ inválido"),
  company_name: z.string().min(2, "Nome da empresa é obrigatório").max(200),
  responsible_name: z.string().min(3, "Nome completo é obrigatório").max(200),
  phone: z.string().min(10, "Telefone com DDD é obrigatório").max(15),
  company_size: z.enum(["MEI", "ME", "EPP", "Médio", "Grande", "Autônomo informal"]),
  business_segment: z.string().min(2, "Segmento é obrigatório").max(200),
  stands_quantity: z.string().min(1, "Quantidade é obrigatória"),
  payment_method: z.enum(["À vista", "Parcelado", "PIX", "Boleto"]),
});

type FormData = z.infer<typeof formSchema>;

const businessSegments = [
  "Alimentação",
  "Artesanato",
  "Tecnologia",
  "Moda e Vestuário",
  "Beleza e Estética",
  "Construção",
  "Serviços",
  "Educação",
  "Saúde",
  "Outros",
];

const Cadastro = () => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf_cnpj: "",
      company_name: "",
      responsible_name: "",
      phone: "",
      company_size: undefined,
      business_segment: "",
      stands_quantity: "1",
      payment_method: undefined,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("exhibitor_registrations").insert([
        {
          cpf_cnpj: data.cpf_cnpj,
          company_name: data.company_name,
          responsible_name: data.responsible_name,
          phone: data.phone,
          company_size: data.company_size,
          business_segment: data.business_segment,
          stands_quantity: parseInt(data.stands_quantity),
          payment_method: data.payment_method,
        },
      ]);

      if (error) throw error;

      toast.success("Cadastro realizado com sucesso!", {
        description: "Em breve entraremos em contato.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      if (error.code === "23505") {
        toast.error("Este CPF/CNPJ já está cadastrado.");
      } else {
        toast.error("Erro ao realizar cadastro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-16 bg-gradient-sand">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl shadow-elegant p-6 md:p-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold mb-2 text-card-foreground font-['Poppins']">
              Cadastro de Expositor
            </h1>
            <p className="text-muted-foreground mb-8">
              Preencha os dados abaixo para se cadastrar como expositor
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cpf_cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF ou CNPJ *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" {...field} />
                      </FormControl>
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

                <FormField
                  control={form.control}
                  name="stands_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Stands Desejada *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="1" {...field} />
                      </FormControl>
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
                          <SelectItem value="À vista">À vista</SelectItem>
                          <SelectItem value="Parcelado">Parcelado</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Boleto">Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary-light shadow-secondary"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Cadastro"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cadastro;