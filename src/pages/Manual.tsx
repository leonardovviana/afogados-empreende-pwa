import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, FileText, Instagram, MapPin, Phone } from "lucide-react";

const Manual = () => {
  const guidelines = [
    "Chegue com antecedência para montagem do stand",
    "Mantenha seu espaço organizado e limpo",
    "Respeite os horários de funcionamento do evento",
    "Utilize apenas o espaço contratado",
    "Não é permitida música alta ou barulhos excessivos",
    "Produtos e serviços devem estar de acordo com a legislação",
    "É obrigatório o uso de crachá de identificação",
    "Respeite as normas de segurança e saúde",
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 -z-10"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDRENDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTAgMTZjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTE2IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptMC0xNmMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10 -z-10"></div>
      
      <Navigation />

  <main className="flex-1 pt-20 md:pt-24 pb-12 md:pb-16 bg-gradient-to-b from-background via-secondary/10 to-sand-light/25">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="glass-card rounded-3xl shadow-elegant p-5 md:p-8 animate-fade-in-up glass-card-hover">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-primary/10 p-2 md:p-3 rounded-xl">
                <FileText className="text-primary" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-card-foreground">
                  Manual do Expositor
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Orientações importantes para sua participação
                </p>
              </div>
            </div>

            {/* Download Button */}
            <div className="bg-accent/10 rounded-xl p-4 md:p-6 mb-6 md:mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
              <div>
                <h3 className="font-bold text-card-foreground mb-1 text-sm md:text-base">
                  Manual Completo em PDF
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Baixe o manual completo com todas as informações
                </p>
              </div>
              <Button className="bg-accent hover:bg-accent-light shrink-0 text-sm">
                <Download className="mr-2" size={16} />
                Baixar PDF
              </Button>
            </div>

            {/* Informações Gerais */}
            <section className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-card-foreground">
                Informações Gerais
              </h2>
              <div className="space-y-3 md:space-y-4 text-sm md:text-base text-muted-foreground">
                <p>
                  <strong className="text-card-foreground">Data do Evento:</strong> 6, 7 e 8 de Novembro de 2025
                </p>
                <p>
                  <strong className="text-card-foreground">Horário de Funcionamento:</strong> 10h às 21h
                </p>
                <p>
                  <strong className="text-card-foreground">Montagem:</strong> 5 de Novembro, das 8h às 18h
                </p>
                <p>
                  <strong className="text-card-foreground">Desmontagem:</strong> 9 de Novembro, a partir das 8h (funcionamento normal no dia 8)
                </p>
              </div>
            </section>

            {/* Normas */}
            <section className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-card-foreground">
                Normas e Diretrizes
              </h2>
              <div className="space-y-2 md:space-y-3">
                {guidelines.map((guideline) => (
                  <div key={guideline} className="flex items-start gap-2 md:gap-3 animate-fade-in">
                    <CheckCircle className="text-secondary shrink-0 mt-1" size={18} />
                    <p className="text-sm md:text-base text-muted-foreground">{guideline}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* O que levar */}
            <section className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-card-foreground">
                O Que Levar
              </h2>
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-muted/50 rounded-lg p-3 md:p-4">
                  <h3 className="font-bold mb-2 text-card-foreground text-sm md:text-base">Documentação</h3>
                  <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                    <li>• RG e CPF do responsável</li>
                    <li>• CNPJ ou MEI</li>
                    <li>• Alvará de funcionamento</li>
                    <li>• Notas fiscais dos produtos</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 md:p-4">
                  <h3 className="font-bold mb-2 text-card-foreground text-sm md:text-base">Material do Stand</h3>
                  <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                    <li>• Banners e material de divulgação</li>
                    <li>• Produtos para exposição</li>
                    <li>• Material de ponto de venda</li>
                    <li>• Equipamentos necessários</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contato */}
            <section className="bg-primary/10 rounded-xl p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-primary">
                Fale com a organização
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Estamos prontos para ajudar expositores e visitantes com qualquer dúvida:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/15 text-primary rounded-lg p-2">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-card-foreground">Telefone / WhatsApp</p>
                    <a
                      href="https://wa.me/5587999781331"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm md:text-base text-primary hover:underline"
                    >
                      +55 (87) 99978-1331
                    </a>
                    <p className="text-xs md:text-sm text-muted-foreground">Atendimento de segunda a sexta, das 8h às 17h</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/15 text-primary rounded-lg p-2">
                    <Instagram size={18} />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-card-foreground">Instagram oficial</p>
                    <a
                      href="https://instagram.com/sadetur_afdaingazeira"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm md:text-base text-primary hover:underline"
                    >
                      @sadetur_afdaingazeira
                    </a>
                    <p className="text-xs md:text-sm text-muted-foreground">Acompanhe avisos, cronograma e bastidores</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/15 text-primary rounded-lg p-2">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-card-foreground">Endereço da feira</p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Praça Arruda Câmara, Centro<br />
                      Afogados da Ingazeira - PE
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">Estrutura principal montada ao lado da Prefeitura Municipal</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Manual;
