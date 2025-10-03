import logoShield from "@/assets/logoescudo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const AdminResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [preparingSession, setPreparingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const typeParam = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const isRecovery = useMemo(() => typeParam === "recovery" && !!code, [code, typeParam]);

  useEffect(() => {
    if (!isRecovery || !code) {
      setPreparingSession(false);
      return;
    }

    const exchangeSession = async () => {
      try {
        setPreparingSession(true);
        const { error } = await supabase.auth.exchangeCodeForSession({
          type: "recovery",
          code,
        });

        if (error) {
          throw error;
        }

        setSessionReady(true);
      } catch (error) {
        console.error("Erro ao validar link de recuperação:", error);
        setSessionReady(false);
        setSessionError(
          "O link de redefinição é inválido ou expirou. Solicite um novo link na tela de login."
        );
      } finally {
        setPreparingSession(false);
      }
    };

    void exchangeSession();
  }, [code, isRecovery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isRecovery) {
      navigate("/admin");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!sessionReady) {
      toast.error("Não foi possível validar o link de redefinição. Solicite um novo acesso.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();

      toast.success("Senha atualizada com sucesso. Faça login novamente.");
      navigate("/admin");
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      toast.error("Não foi possível redefinir a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery || sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8 text-center space-y-4">
          <img src={logoShield} alt="Feira do Empreendedor" className="w-16 h-16 mx-auto rounded-2xl" />
          <h1 className="text-xl font-semibold text-card-foreground">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">
            {sessionError ?? "O link de redefinição é inválido ou já foi utilizado. Solicite um novo link na tela de login."}
          </p>
          <Button onClick={() => navigate("/admin")}>Voltar ao login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8 animate-scale-in">
        <div className="text-center mb-8">
          <img src={logoShield} alt="Feira do Empreendedor" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold text-card-foreground font-['Poppins']">
            Definir nova senha
          </h1>
          <p className="text-muted-foreground text-sm">
            {preparingSession
              ? "Validando seu link de redefinição. Aguarde um instante."
              : "Escolha uma senha forte e mantenha-a em segurança."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2"
              disabled={loading || preparingSession}
            />
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="mt-2"
              disabled={loading || preparingSession}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-light"
            disabled={loading || preparingSession}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando senha...
              </>
            ) : preparingSession ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando link...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Salvar nova senha
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/admin")}
            disabled={loading || preparingSession}
          >
            Cancelar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminResetPassword;
