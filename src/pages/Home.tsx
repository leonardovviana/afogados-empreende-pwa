import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Countdown from "@/components/Countdown";
import InstallPrompt from "@/components/InstallPrompt";
import logo from "@/assets/logo.png";
import heroImage from "@/assets/hero-bg.jpg";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 -z-10"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDRENDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTAgMTZjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTE2IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptMC0xNmMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10 -z-10"></div>
      
      <Navigation />
      <InstallPrompt />

      {/* Hero Section */}
      <main className="flex-1 pt-20">
        <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Animated Background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${heroImage})`,
              animation: "gradient-shift 15s ease infinite",
              backgroundSize: "120%"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/90"></div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>

          <div className="relative z-10 container mx-auto px-4 text-center py-20">
            <div className="glass-effect rounded-3xl p-8 md:p-12 max-w-4xl mx-auto shadow-mega animate-bounce-in">
              <img 
                src={logo} 
                alt="Logo 8ª Feira do Empreendedor" 
                className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 floating drop-shadow-2xl" 
              />

              <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 font-['Poppins'] leading-tight">
                8ª Feira do <span className="gradient-text bg-gradient-to-r from-secondary-light via-accent-light to-sand-light">Empreendedor</span>
              </h1>

              <p className="text-xl md:text-3xl text-white/90 mb-8 font-['Inter'] font-light">
                Conectando ideias, transformando o futuro
              </p>

              <div className="mb-10 bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                <Countdown />
              </div>

              <Link to="/cadastro">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary shadow-mega text-white text-xl px-12 py-8 rounded-2xl font-bold hover-lift animate-pulse-glow relative overflow-hidden group"
                >
                  <span className="relative z-10">FAÇA SEU CADASTRO</span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links - Modern Cards */}
        <div className="relative py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground font-['Poppins']">
              Acesso Rápido
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Link
                to="/mapa"
                className="group glass-card p-8 rounded-3xl hover-lift relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">🗺️</div>
                  <h3 className="text-2xl font-bold text-primary mb-3 font-['Poppins']">Mapa do Evento</h3>
                  <p className="text-muted-foreground">Veja a localização e distribuição completa dos stands</p>
                </div>
              </Link>

              <Link
                to="/sobre"
                className="group glass-card p-8 rounded-3xl hover-lift relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">ℹ️</div>
                  <h3 className="text-2xl font-bold text-primary mb-3 font-['Poppins']">Conheça o Evento</h3>
                  <p className="text-muted-foreground">História, números e tudo sobre nossa feira</p>
                </div>
              </Link>

              <Link
                to="/manual"
                className="group glass-card p-8 rounded-3xl hover-lift relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">📋</div>
                  <h3 className="text-2xl font-bold text-primary mb-3 font-['Poppins']">Manual do Expositor</h3>
                  <p className="text-muted-foreground">Guia completo com todas as orientações</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
