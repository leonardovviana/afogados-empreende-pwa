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
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-16 bg-gradient-sand">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card rounded-2xl shadow-elegant p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-xl">
                <FileText className="text-primary" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground font-['Poppins']">
                  Manual do Expositor
                </h1>
                <p className="text-muted-foreground">
                  Orientações importantes para sua participação
                </p>
              </div>
            </div>

            {/* Download Button */}
            <div className="bg-accent/10 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-accent-foreground mb-1">
                  Manual Completo em PDF
                </h3>
                <p className="text-sm text-muted-foreground">
                  Baixe o manual completo com todas as informações
                </p>
              </div>
              <Button className="bg-accent hover:bg-accent-light shrink-0">
                <Download className="mr-2" size={16} />
                Baixar PDF
              </Button>
            </div>

            {/* Informações Gerais */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-card-foreground font-['Poppins']">
                Informações Gerais
              </h2>
              <div className="space-y-4 text-muted-foreground">
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
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-card-foreground font-['Poppins']">
                Normas e Diretrizes
              </h2>
              <div className="space-y-3">
                {guidelines.map((guideline, index) => (
                  <div key={index} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CheckCircle className="text-secondary shrink-0 mt-1" size={20} />
                    <p className="text-muted-foreground">{guideline}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* O que levar */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-card-foreground font-['Poppins']">
                O Que Levar
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-card-foreground">Documentação</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• RG e CPF do responsável</li>
                    <li>• CNPJ ou MEI</li>
                    <li>• Alvará de funcionamento</li>
                    <li>• Notas fiscais dos produtos</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-card-foreground">Material do Stand</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Banners e material de divulgação</li>
                    <li>• Produtos para exposição</li>
                    <li>• Material de ponto de venda</li>
                    <li>• Equipamentos necessários</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contato */}
            <section className="bg-primary/10 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-3 text-primary font-['Poppins']">
                Dúvidas?
              </h2>
              <p className="text-muted-foreground mb-4">
                Entre em contato com nossa equipe de organização:
              </p>
              <div className="space-y-2 text-sm">
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