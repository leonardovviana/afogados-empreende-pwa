import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Mapa = () => {
  const [zoom, setZoom] = useState(1);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zoomContainerRef.current) {
      zoomContainerRef.current.style.transform = `scale(${zoom})`;
    }
  }, [zoom]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 -z-10"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDRENDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTAgMTZjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTE2IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptMC0xNmMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10 -z-10"></div>
      
      <Navigation />

  <main className="flex-1 pt-20 md:pt-24 pb-12 md:pb-16 bg-gradient-to-b from-background via-secondary/10 to-sand-light/25">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="glass-card rounded-3xl shadow-elegant p-5 md:p-8 animate-fade-in-up glass-card-hover">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-card-foreground">
                Mapa do Evento
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                Visualize a distribuição dos stands e espaços do evento
              </p>

              <div className="flex gap-2 mb-4">
                <Button
                  onClick={handleZoomIn}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs md:text-sm"
                >
                  <ZoomIn size={16} />
                  Ampliar
                </Button>
                <Button
                  onClick={handleZoomOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs md:text-sm"
                >
                  <ZoomOut size={16} />
                  Reduzir
                </Button>
              </div>

              <div className="bg-muted rounded-xl p-4 overflow-auto">
                <div
                  ref={zoomContainerRef}
                  className="origin-top-left transition-transform duration-300"
                >
                  {/* Placeholder Map */}
                  <div className="bg-background rounded-lg p-6 md:p-8 min-h-[400px] md:min-h-[600px] flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center max-w-md">
                      <div className="bg-primary/10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                        <MapIcon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">
                        Mapa em Breve
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        O mapa detalhado do evento será disponibilizado em breve. 
                        Aguarde novidades!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-6 p-4 bg-accent/10 rounded-lg">
                <h3 className="font-bold mb-2 text-accent-foreground text-sm md:text-base">Informações Importantes:</h3>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                  <li>• Use os controles de zoom para visualizar melhor</li>
                  <li>• Os stands serão numerados e identificados por segmento</li>
                  <li>• Áreas de alimentação e descanso estão destacadas</li>
                  <li>• Banheiros e saídas de emergência estão sinalizados</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Mapa;
