import { Download, Info, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const InstallPrompt = () => {
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMiniVisible, setIsMiniVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsMiniVisible(true);
      setIsCardVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isStandalone) {
      setIsMiniVisible(false);
      setIsCardVisible(false);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isAppleDevice) {
      setIsIos(true);
      setIsMiniVisible(true);
      setIsCardVisible(true);
    }
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsCardVisible(false);
      setIsMiniVisible(false);
    }
  };

  if (!isMiniVisible && !isCardVisible) return null;

  const closeCard = () => {
    setIsCardVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 flex justify-end">
      {isCardVisible ? (
        <div className="relative w-full max-w-sm animate-slide-in-right">
          <div className="bg-gradient-hero text-primary-foreground rounded-xl shadow-elegant p-4 pr-10">
            <button
              onClick={closeCard}
              className="absolute top-2 right-2 text-primary-foreground/70 hover:text-primary-foreground"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3">
              <div className="bg-secondary/20 p-2 rounded-lg">
                <Download className="text-secondary" size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 font-['Poppins']">Instalar aplicativo</h3>
                {isIos ? (
                  <div className="space-y-3 text-sm text-primary-foreground/90">
                    <p className="flex items-center gap-2 font-semibold">
                      <Info size={18} />
                      Como instalar no iPhone/iPad
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-primary-foreground/80">
                      <li>
                        Toque em <strong>Compartilhar</strong> na barra inferior do Safari.
                      </li>
                      <li>
                        Escolha <strong>Adicionar à Tela de Início</strong>, personalize o nome e confirme.
                      </li>
                    </ol>
                    <p className="text-xs text-primary-foreground/65">
                      Depois de adicionado, o atalho abrirá a feira em tela cheia como um app instalado.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-primary-foreground/90 mb-3">
                      Instale a Feira do Empreendedor como um aplicativo e acesse mais rápido.
                    </p>
                    <Button onClick={handleInstall} variant="secondary" size="sm" className="w-full">
                      Instalar app
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isCardVisible && isMiniVisible ? (
        <Button
          onClick={() => setIsCardVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg border-primary/30 bg-white/90 text-primary hover:bg-primary/10"
        >
          Instalar app
        </Button>
      ) : null}
    </div>
  );
};

export default InstallPrompt;