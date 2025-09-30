import { Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-2 font-['Poppins']">8ª Feira do Empreendedor</h3>
            <p className="text-sm text-primary-foreground/80">
              Conectando ideias, transformando o futuro
            </p>
          </div>

          <div className="flex gap-6 items-center">
            <a
              href="https://wa.me/5587999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-secondary transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle size={20} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <a
              href="https://instagram.com/feiraempreendedorafogados"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-secondary transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
              <span className="hidden sm:inline">Instagram</span>
            </a>
          </div>

          <Link
            to="/admin"
            className="text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors"
          >
            Acesso Admin
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/70">
          <p>© 2025 Prefeitura de Afogados da Ingazeira. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;