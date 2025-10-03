import logoShield from "@/assets/logoescudo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { AdminProfileRow } from "@/integrations/supabase/types";
import type { PostgrestError } from "@supabase/supabase-js";
import { Loader2, Lock, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Informe o e-mail para receber o link de redefinição.");
      return;
    }

    setResetLoading(true);
    try {
      const redirectTo = `${window.location.origin}/admin/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      toast.success("Enviamos um link de redefinição para o e-mail informado.");
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      toast.error("Não foi possível enviar o link de redefinição. Tente novamente.");
    } finally {
      setResetLoading(false);
    }
  };

  const mapProfileErrorMessage = (error: unknown): string => {
    const defaultMessage = "Não foi possível validar seu perfil de administrador.";

    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return defaultMessage;
  };

  const ensureProfileApproval = async (userId: string): Promise<AdminProfileRow | null> => {
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && (error as PostgrestError).code !== "PGRST116") {
      throw error;
    }

    return data ?? null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);
    setLoading(true);

    try {
      const sanitizedEmail = email.trim();

      if (!sanitizedEmail) {
        toast.error("Informe um e-mail válido.");
        setLoading(false);
        return;
      }

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

        if (error) {
          const message = error.message?.toLowerCase?.() ?? "";

          if (message.includes("email") && message.includes("confirm")) {
            toast.error("Confirme seu e-mail antes de acessar o painel.");
            setInfoMessage(
              "Seu e-mail ainda não foi confirmado. Reenvie o link pela opção de redefinição ou procure a coordenação."
            );
            await supabase.auth.signOut();
            return;
          }

          throw error;
        }

        const user = data.user;

        if (!user) {
          throw new Error("Não foi possível identificar o usuário autenticado.");
        }

        if (!user.email_confirmed_at) {
          toast.error("Confirme seu e-mail antes de acessar o painel.");
          setInfoMessage(
            "Confirme seu e-mail pelo link enviado antes de tentar entrar no painel administrativo."
          );
          await supabase.auth.signOut();
          return;
        }

        const profile = await ensureProfileApproval(user.id);

        if (!profile) {
          toast.error(
            "Seu perfil ainda não foi configurado como administrador. Solicite acesso à coordenação."
          );
          setInfoMessage(
            "Seu perfil administrativo ainda não foi configurado. Entre em contato com a coordenação para vincular seu usuário."
          );
          await supabase.auth.signOut();
          return;
        }

        if (!profile.is_approved) {
          toast.error(
            "Seu acesso ainda não foi aprovado pela equipe. Aguarde a confirmação para entrar."
          );
          setInfoMessage(
            "Seu acesso ainda está em análise. Assim que for aprovado, você poderá fazer login normalmente."
          );
          await supabase.auth.signOut();
          return;
        }

        toast.success("Login realizado com sucesso!");
        navigate("/admin/dashboard");
      } else {
        if (password !== confirmPassword) {
          toast.error("As senhas não coincidem.");
          setLoading(false);
          return;
        }

        const redirectTo = `${window.location.origin}/admin/confirm`;
        const { data, error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              role: "admin",
            },
          },
        });

        if (error) {
          throw error;
        }

        const user = data.user;

        if (user) {
          const { error: profileError } = await supabase
            .from("admin_profiles")
            .upsert(
              {
                user_id: user.id,
                email: user.email,
                full_name: user.email ?? "Administrador",
                is_approved: false,
              },
              { onConflict: "user_id" }
            );

          if (profileError) {
            throw profileError;
          }
        }

        await supabase.auth.signOut();

        setInfoMessage(
          "Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login."
        );
        toast.success("Verifique seu e-mail para confirmar o cadastro.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error(
        mode === "login"
          ? "Credenciais inválidas. Verifique e tente novamente."
          : "Não foi possível criar a conta. Verifique os dados e tente novamente."
      );
      const message = mapProfileErrorMessage(error);
      if (message) {
        console.error("Detalhes do erro de perfil:", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8 animate-scale-in">
        <div className="text-center mb-8">
          <img
            src={logoShield}
            alt="Feira do Empreendedor"
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/90 p-1 shadow-md object-contain"
          />
          <h1 className="text-2xl font-bold text-card-foreground mb-2 font-['Poppins']">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Acesso restrito a administradores
          </p>
        </div>

        {infoMessage ? (
          <div className="mb-6 rounded-xl border border-secondary/30 bg-secondary/10 p-4 text-sm text-secondary">
            {infoMessage}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-primary">
            <p className="font-semibold mb-2">{mode === "login" ? "Acesso ao painel" : "Confirmação necessária"}</p>
            <p className="text-primary/80">
              {mode === "login"
                ? "Use suas credenciais cadastradas ou crie uma nova conta institucional."
                : "Enviaremos um link para confirmar o seu e-mail antes de liberar o acesso."}
            </p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {mode === "register" && (
            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-2"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-light"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "Entrando..." : "Criando conta..."}
              </>
            ) : mode === "login" ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Entrar
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar conta
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
            className="text-sm text-primary hover:text-primary-light transition-colors font-medium"
          >
            {mode === "login" ? "Criar conta de administrador" : "Já tenho conta, fazer login"}
          </button>

          <button
            onClick={handlePasswordReset}
            className="block w-full text-sm text-primary/80 hover:text-primary transition-colors"
            disabled={resetLoading || loading}
          >
            {resetLoading ? "Enviando link de redefinição..." : "Esqueci minha senha"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Voltar para o site
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;