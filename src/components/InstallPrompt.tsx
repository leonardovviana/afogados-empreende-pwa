import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-in-right">
      <div className="bg-gradient-hero text-primary-foreground rounded-xl shadow-elegant p-4">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-2 right-2 text-primary-foreground/70 hover:text-primary-foreground"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="bg-secondary/20 p-2 rounded-lg">
            <Download className="text-secondary" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1 font-['Poppins']">Adicionar à Tela Inicial</h3>
            <p className="text-sm text-primary-foreground/90 mb-3">
              Acesse rapidamente a Feira do Empreendedor como um app!
            </p>
            <Button
              onClick={handleInstall}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Instalar App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;