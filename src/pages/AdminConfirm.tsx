import icon from "@/assets/icon.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AdminConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Confirmando seu acesso...");

  const typeParam = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supportedTypes: EmailOtpType[] = ["signup", "invite"];
  const isSupportedType = typeParam ? supportedTypes.includes(typeParam) : false;

  const getFriendlyErrorMessage = useCallback(
    (error: unknown) => {
      const defaultMessage =
        "Não foi possível confirmar o e-mail. Solicite um novo link na tela de login.";

      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : defaultMessage;

      const normalized = message.toLowerCase();

      if (normalized.includes("expired")) {
        return "O link de confirmação expirou. Solicite um novo acesso.";
      }

      if (normalized.includes("invalid") && normalized.includes("code")) {
        return "O código de confirmação é inválido ou já foi utilizado.";
      }

      return defaultMessage;
    },
    []
  );

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!typeParam || !code || !isSupportedType) {
        setStatus("error");
        setMessage("Link inválido ou expirado. Solicite um novo acesso.");
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession({
          type: typeParam,
          code,
        });

        if (error) {
          throw error;
        }

        await supabase.auth.signOut();

        setStatus("success");
        setMessage(
          "E-mail confirmado com sucesso! Agora você já pode fazer login no painel administrativo."
        );
      } catch (error) {
        console.error("Erro ao confirmar e-mail:", error);
        setStatus("error");
        setMessage(getFriendlyErrorMessage(error));
        await supabase.auth.signOut();
      }
    };

    void handleConfirmation();
  }, [code, getFriendlyErrorMessage, isSupportedType, typeParam]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8 text-center space-y-6 animate-scale-in">
        <img src={icon} alt="Logo" className="w-16 h-16 mx-auto rounded-2xl" />

        {status === "processing" && (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-secondary" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="inline-flex rounded-full bg-secondary/10 p-4 text-secondary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-semibold text-card-foreground">Confirmação concluída!</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => navigate("/admin")}>Ir para o login</Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="inline-flex rounded-full bg-destructive/10 p-4 text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-semibold text-card-foreground">Não foi possível confirmar</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => navigate("/admin")}>Voltar ao login</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConfirm;
