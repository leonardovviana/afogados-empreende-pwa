import { Button } from "@/components/ui/button";
import { Calendar, FileText, Map, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Countdown from "@/components/Countdown";
import InstallPrompt from "@/components/InstallPrompt";
import logo from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.jpg";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <InstallPrompt />

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center bg-gradient-hero pt-16"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0, 77, 64, 0.95), rgba(76, 175, 80, 0.85)), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-fade-in-up">
            <img
              src={logo}
              alt="Logo 8ª Feira do Empreendedor"
              className="w-32 h-32 mx-auto mb-6 animate-float"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4 font-['Poppins']">
              8ª Feira do Empreendedor
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 font-light">
              Conectando ideias, transformando o futuro
            </p>
          </div>

          <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 inline-block shadow-elegant">
              <p className="text-primary-foreground mb-6 text-lg font-medium">
                28 a 30 de Novembro de 2025
              </p>
              <Countdown />
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/cadastro">
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary-light text-secondary-foreground text-lg px-8 py-6 shadow-secondary hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                FAÇA SEU CADASTRO
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-gradient-sand">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary font-['Poppins']">
            Acesso Rápido
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Link to="/mapa" className="group">
              <div className="bg-card rounded-xl p-6 shadow-primary hover:shadow-elegant transition-all duration-300 hover:-translate-y-2">
                <div className="bg-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Map className="text-accent" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-card-foreground font-['Poppins']">
                  Mapa do Evento
                </h3>
                <p className="text-muted-foreground">
                  Visualize a localização dos stands e espaços
                </p>
              </div>
            </Link>

            <Link to="/sobre" className="group">
              <div className="bg-card rounded-xl p-6 shadow-primary hover:shadow-elegant transition-all duration-300 hover:-translate-y-2">
                <div className="bg-secondary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Users className="text-secondary" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-card-foreground font-['Poppins']">
                  Conheça o Evento
                </h3>
                <p className="text-muted-foreground">
                  Saiba mais sobre a feira e sua história
                </p>
              </div>
            </Link>

            <Link to="/manual" className="group">
              <div className="bg-card rounded-xl p-6 shadow-primary hover:shadow-elegant transition-all duration-300 hover:-translate-y-2">
                <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <FileText className="text-primary" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-card-foreground font-['Poppins']">
                  Manual do Expositor
                </h3>
                <p className="text-muted-foreground">
                  Orientações importantes para expositores
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Event Info */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-accent">
              <Calendar className="text-accent-foreground" size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-6 text-foreground font-['Poppins']">
              Um Evento Para Empreendedores
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A Feira do Empreendedor de Afogados da Ingazeira é o maior evento de negócios
              da região, reunindo empreendedores, empresários e entusiastas para três dias de
              networking, oportunidades e crescimento.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;