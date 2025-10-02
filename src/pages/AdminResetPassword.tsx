import icon from "@/assets/icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firebaseAuth } from "@/integrations/firebase/client";
import { Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

const AdminResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const isRecovery = mode === "resetPassword" && !!oobCode;

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

    setLoading(true);
    try {
      if (!oobCode) {
        throw new Error("Código inválido ou ausente.");
      }

      await verifyPasswordResetCode(firebaseAuth, oobCode);
      await confirmPasswordReset(firebaseAuth, oobCode, password);

      toast.success("Senha atualizada com sucesso. Faça login novamente.");
      navigate("/admin");
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      toast.error("Não foi possível redefinir a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8 text-center space-y-4">
          <img src={icon} alt="Logo" className="w-16 h-16 mx-auto rounded-2xl" />
          <h1 className="text-xl font-semibold text-card-foreground">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">
            O link de redefinição é inválido ou já foi utilizado. Solicite um novo link na tela de login.
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
          <img src={icon} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold text-card-foreground font-['Poppins']">
            Definir nova senha
          </h1>
          <p className="text-muted-foreground text-sm">
            Escolha uma senha forte e mantenha-a em segurança.
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
            />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary-light" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando senha...
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
            disabled={loading}
          >
            Cancelar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminResetPassword;
