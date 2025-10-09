import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import manualPdf from "@/assets/manualexpositor.pdf";
import { Download, FileText } from "lucide-react";

const Manual = () => {

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 -z-10"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDRENDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTAgMTZjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTE2IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptMC0xNmMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10 -z-10"></div>
      
      <Navigation />

  <main className="flex-1 pt-20 md:pt-24 pb-12 md:pb-16 bg-gradient-to-b from-background via-secondary/10 to-sand-light/25">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="glass-card rounded-[2.5rem] shadow-mega p-8 md:p-12 text-center space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Manual do Expositor
            </span>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-8 w-8" />
              </div>
              <div className="max-w-2xl space-y-3">
                <h1 className="text-3xl font-bold text-card-foreground sm:text-4xl">
                  Tudo o que você precisa para montar seu stand com confiança
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Baixe o manual oficial da feira e confira orientações de montagem, cronograma completo e regras essenciais para garantir uma participação incrível.
                </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl rounded-3xl bg-gradient-to-r from-secondary to-accent p-[1px] shadow-xl">
              <div className="rounded-[calc(1.5rem-1px)] bg-background p-6 sm:p-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Arquivo em PDF atualizado para a edição 2025 da Feira do Empreendedor.
                </p>
                <Button asChild size="lg" className="w-full rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary-light text-base font-semibold py-6">
                  <a href={manualPdf} download>
                    <Download className="mr-2 h-5 w-5" /> Baixar manual completo
                  </a>
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Em caso de dúvidas adicionais, fale com a equipe organizadora pelos canais oficiais.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Manual;
