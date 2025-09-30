import { Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-primary via-primary to-primary-light text-primary-foreground py-12 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-2xl mb-3 font-['Poppins']">8ª Feira do Empreendedor</h3>
            <p className="text-base text-primary-foreground/90">📍 Afogados da Ingazeira - PE</p>
            <p className="text-base text-primary-foreground/90">📅 28 a 30 de novembro de 2025</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-primary-foreground/80 font-semibold">Siga-nos nas redes</p>
            <div className="flex items-center gap-4">
              <a
                href="https://wa.me/5587999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 hover:shadow-glow"
                aria-label="WhatsApp"
              >
                <MessageCircle size={24} />
              </a>
              <a
                href="https://instagram.com/feiradoempreendedor"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 hover:shadow-glow"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-primary-foreground/20 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/70">
          <p>© 2025 Feira do Empreendedor - Todos os direitos reservados</p>
          <Link
            to="/admin"
            className="text-primary-foreground/40 hover:text-primary-foreground/80 transition-colors text-xs underline"
          >
            Acesso Admin
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
