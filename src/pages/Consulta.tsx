import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

type RegistrationStatus = "Pendente" | "Aprovado" | "Recusado";

interface Registration {
  company_name: string;
  status: RegistrationStatus;
  created_at: string;
}

const Consulta = () => {
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cpfCnpj.trim()) {
      toast.error("Digite um CPF ou CNPJ");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exhibitor_registrations")
        .select("company_name, status, created_at")
        .eq("cpf_cnpj", cpfCnpj.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Cadastro não encontrado");
        setRegistration(null);
      } else {
        setRegistration(data);
      }
    } catch (error) {
      console.error("Erro ao buscar cadastro:", error);
      toast.error("Erro ao buscar cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: RegistrationStatus) => {
    switch (status) {
      case "Aprovado":
        return <CheckCircle2 className="text-secondary" size={48} />;
      case "Recusado":
        return <XCircle className="text-destructive" size={48} />;
      default:
        return <Clock className="text-accent" size={48} />;
    }
  };

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case "Aprovado":
        return "bg-secondary/10 border-secondary";
      case "Recusado":
        return "bg-destructive/10 border-destructive";
      default:
        return "bg-accent/10 border-accent";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-16 bg-gradient-sand">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl shadow-elegant p-6 md:p-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold mb-2 text-card-foreground font-['Poppins']">
              Consultar Cadastro
            </h1>
            <p className="text-muted-foreground mb-8">
              Digite seu CPF ou CNPJ para verificar o status da sua inscrição
            </p>

            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    className="bg-accent hover:bg-accent-light"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {registration && (
              <div
                className={`mt-8 p-6 rounded-xl border-2 ${getStatusColor(
                  registration.status
                )} animate-scale-in`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">{getStatusIcon(registration.status)}</div>
                  
                  <h3 className="text-xl font-bold mb-2 font-['Poppins']">
                    {registration.company_name}
                  </h3>
                  
                  <div className="inline-block px-4 py-2 rounded-lg bg-background/50 mb-4">
                    <span className="font-semibold">Status: </span>
                    <span className="font-bold">{registration.status}</span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Cadastro realizado em{" "}
                    {new Date(registration.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {registration.status === "Pendente" && (
                    <p className="mt-4 text-sm">
                      Seu cadastro está em análise. Em breve entraremos em contato.
                    </p>
                  )}

                  {registration.status === "Aprovado" && (
                    <p className="mt-4 text-sm">
                      Parabéns! Seu cadastro foi aprovado. Aguarde instruções por e-mail ou telefone.
                    </p>
                  )}

                  {registration.status === "Recusado" && (
                    <p className="mt-4 text-sm">
                      Infelizmente seu cadastro não foi aprovado. Entre em contato para mais informações.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Consulta;