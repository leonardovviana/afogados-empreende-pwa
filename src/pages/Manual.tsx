import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 -z-10"></div>
      
      <Navigation />

      <main className="flex-1 pt-20 md:pt-24 pb-12 md:pb-16 bg-gradient-sand">
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
                <h3 className="font-bold text-accent-foreground mb-1 text-sm md:text-base">
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
                  <strong className="text-card-foreground">Data do Evento:</strong> 28 a 30 de Novembro de 2025
                </p>
                <p>
                  <strong className="text-card-foreground">Horário de Funcionamento:</strong> 10h às 21h
                </p>
                <p>
                  <strong className="text-card-foreground">Montagem:</strong> 27 de Novembro, das 8h às 18h
                </p>
                <p>
                  <strong className="text-card-foreground">Desmontagem:</strong> 30 de Novembro, após às 21h
                </p>
              </div>
            </section>

            {/* Normas */}
            <section className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-card-foreground">
                Normas e Diretrizes
              </h2>
              <div className="space-y-2 md:space-y-3">
                {guidelines.map((guideline, index) => (
                  <div key={index} className="flex items-start gap-2 md:gap-3 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
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
                Dúvidas?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                Entre em contato com nossa equipe de organização:
              </p>
              <div className="space-y-2 text-xs md:text-sm">
                <p>
                  <strong>WhatsApp:</strong>{" "}
                  <a href="https://wa.me/5587999999999" className="text-primary hover:underline">
                    (87) 99999-9999
                  </a>
                </p>
                <p>
                  <strong>E-mail:</strong>{" "}
                  <a href="mailto:contato@feiradoempreendedor.com" className="text-primary hover:underline">
                    contato@feiradoempreendedor.com
                  </a>
                </p>
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
