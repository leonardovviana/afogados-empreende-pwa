import { Apple, Download, Smartphone, X } from "lucide-react";
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
  const [hasInstallPrompt, setHasInstallPrompt] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isApple: false, isAndroid: false });

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
      setHasInstallPrompt(true);
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
    const isAndroidDevice = /android/.test(userAgent);

    setDeviceInfo({ isApple: isAppleDevice, isAndroid: isAndroidDevice });

    if (isAppleDevice || isAndroidDevice || hasInstallPrompt) {
      setIsMiniVisible(true);
      setIsCardVisible(true);
    }
  }, [hasInstallPrompt, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsCardVisible(false);
      setIsMiniVisible(false);
      setHasInstallPrompt(false);
    }
  };

  if (!isMiniVisible && !isCardVisible) return null;

  const closeCard = () => {
    setIsCardVisible(false);
  };

  type InstructionSection = {
    id: "android" | "ios";
    title: string;
    icon: JSX.Element;
    steps: string[];
  };

  const instructionSections: InstructionSection[] = [
    {
      id: "android",
      title: "Android (Chrome)",
      icon: <Smartphone size={18} />,
      steps: [
        "Abra o menu ⋮ do Chrome",
        "Toque em Adicionar à Tela Inicial",
        "Confirme o nome e toque em Adicionar",
      ],
    },
    {
      id: "ios",
      title: "iPhone / iPad (Safari)",
      icon: <Apple size={18} />,
      steps: [
        "Toque em Compartilhar na barra inferior",
        "Escolha Adicionar à Tela de Início",
        "Confirme para criar o atalho em tela cheia",
      ],
    },
  ];

  const highlightClass = (id: InstructionSection["id"]) => {
    if (id === "android" && deviceInfo.isAndroid) return "border-white/60 bg-white/20";
    if (id === "ios" && deviceInfo.isApple) return "border-white/60 bg-white/20";
    return "border-white/20 bg-white/10";
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
                <div className="space-y-4 text-sm text-primary-foreground/90">
                  {hasInstallPrompt ? (
                    <div className="space-y-2">
                      <p>Instale a Feira do Empreendedor como um app para acessar com mais rapidez.</p>
                      <Button onClick={handleInstall} variant="secondary" size="sm" className="w-full">
                        Instalar automaticamente
                      </Button>
                      <p className="text-xs text-primary-foreground/65">
                        Se preferir, siga os passos abaixo para instalar manualmente.
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {instructionSections.map((section) => (
                      <div
                        key={section.id}
                        className={`rounded-lg border px-3 py-3 transition ${highlightClass(section.id as "android" | "ios")}`}
                      >
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          {section.icon}
                          {section.title}
                        </p>
                        <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-primary-foreground/80">
                          {section.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-primary-foreground/65">
                    Instalando pela tela inicial, o aplicativo abre em tela cheia, funciona offline nas principais telas e fica disponível ao lado dos outros apps.
                  </p>
                </div>
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