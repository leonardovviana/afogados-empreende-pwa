import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Building2, Users, TrendingUp, Award } from "lucide-react";

const Sobre = () => {
  const stats = [
    { icon: Building2, label: "Expositores", value: "100+" },
    { icon: Users, label: "Visitantes", value: "5.000+" },
    { icon: TrendingUp, label: "Negócios", value: "R$ 2M+" },
    { icon: Award, label: "Edições", value: "8ª" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 -z-10"></div>
      
      <Navigation />

      <main className="flex-1 pt-20 md:pt-24 pb-12 md:pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-12 md:py-16 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 animate-fade-in-up">
              Conheça o Evento
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              A maior feira de empreendedorismo de Afogados da Ingazeira
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-16 bg-gradient-sand">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="glass-card rounded-2xl p-4 md:p-6 text-center shadow-primary animate-scale-in glass-card-hover"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-primary/10 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <stat.icon className="text-primary" size={24} />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-foreground">
                Nossa História
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                A Feira do Empreendedor de Afogados da Ingazeira nasceu com o objetivo de fortalecer
                o ecossistema empreendedor da região, conectando negócios locais, promovendo networking
                e gerando oportunidades de crescimento para pequenos, médios e grandes empreendedores.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                Ao longo de suas edições, a feira se consolidou como o principal evento de negócios
                da cidade, reunindo expositores de diversos segmentos e atraindo milhares de visitantes
                interessados em conhecer produtos, serviços e inovações.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 mt-8 md:mt-12 text-foreground">
                O Que Esperar
              </h2>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6 not-prose">
                <div className="glass-card rounded-2xl p-5 md:p-6 shadow-primary glass-card-hover">
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-card-foreground">
                    Networking
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Conecte-se com outros empreendedores, encontre parceiros de negócio e expanda
                    sua rede de contatos.
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-5 md:p-6 shadow-primary glass-card-hover">
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-card-foreground">
                    Oportunidades
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Descubra novas oportunidades de negócio, fornecedores e clientes em potencial.
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-5 md:p-6 shadow-primary glass-card-hover">
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-card-foreground">
                    Conhecimento
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Participe de palestras, workshops e painéis com especialistas do mercado.
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-5 md:p-6 shadow-primary glass-card-hover">
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-card-foreground">
                    Visibilidade
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Aumente a visibilidade do seu negócio e alcance novos públicos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;
