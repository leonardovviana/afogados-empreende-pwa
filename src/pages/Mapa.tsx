import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Mapa = () => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-16 bg-gradient-sand">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl shadow-elegant p-6 md:p-8 animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-2 text-card-foreground font-['Poppins']">
                Mapa do Evento
              </h1>
              <p className="text-muted-foreground mb-6">
                Visualize a distribuição dos stands e espaços do evento
              </p>

              <div className="flex gap-2 mb-4">
                <Button
                  onClick={handleZoomIn}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ZoomIn size={16} />
                  Ampliar
                </Button>
                <Button
                  onClick={handleZoomOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ZoomOut size={16} />
                  Reduzir
                </Button>
              </div>

              <div className="bg-muted rounded-xl p-4 overflow-auto">
                <div
                  className="transition-transform duration-300 origin-top-left"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {/* Placeholder Map */}
                  <div className="bg-background rounded-lg p-8 min-h-[600px] flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center max-w-md">
                      <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🗺️</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 font-['Poppins']">
                        Mapa em Breve
                      </h3>
                      <p className="text-muted-foreground">
                        O mapa detalhado do evento será disponibilizado em breve. 
                        Aguarde novidades!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-accent/10 rounded-lg">
                <h3 className="font-bold mb-2 text-accent-foreground">Informações Importantes:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
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