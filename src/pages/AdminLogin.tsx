import icon from "@/assets/icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firebaseAuth, firebaseFirestore } from "@/integrations/firebase/client";
import { Loader2, Lock, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

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
      await sendPasswordResetEmail(firebaseAuth, trimmedEmail, {
        url: `${window.location.origin}/admin/reset`,
      });

      toast.success("Enviamos um link de redefinição para o e-mail informado.");
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      toast.error("Não foi possível enviar o link de redefinição. Tente novamente.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const { user } = credential;

        if (!user.emailVerified) {
          await sendEmailVerification(user);
          await signOut(firebaseAuth);
          toast.warning("Confirme seu e-mail antes de acessar o painel. Enviamos um novo link.");
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

        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const { user } = credential;

        await setDoc(doc(firebaseFirestore, "adminProfiles", user.uid), {
          email: user.email,
          full_name: user.email ?? "Administrador",
          is_approved: true,
          created_at: serverTimestamp(),
        });

        await sendEmailVerification(user);

        await signOut(firebaseAuth);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8 animate-scale-in">
        <div className="text-center mb-8">
          <img src={icon} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
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