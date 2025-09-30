import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: "Início", path: "/" },
    { name: "Cadastro", path: "/cadastro" },
    { name: "Consulta", path: "/consulta" },
    { name: "Mapa", path: "/mapa" },
    { name: "Sobre", path: "/sobre" },
    { name: "Manual", path: "/manual" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Section with institutional spaces */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Espaço para logo da Prefeitura */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center hover-lift backdrop-blur-sm shadow-sm">
              <span className="text-[10px] md:text-xs text-white/70 text-center font-medium">Prefeitura</span>
            </div>
            
            {/* Espaço para logo da Secretaria */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center hover-lift backdrop-blur-sm shadow-sm">
              <span className="text-[10px] md:text-xs text-white/70 text-center font-medium">Secretaria</span>
            </div>

            <Link to="/" className="text-base md:text-lg font-semibold text-white hover:scale-105 transition-transform">
              <span className="hidden lg:inline">8ª Feira do Empreendedor</span>
              <span className="lg:hidden">Feira 2025</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  location.pathname === link.path
                    ? "bg-white/25 text-white shadow-sm backdrop-blur-sm"
                    : "text-white/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white hover:bg-white/15 p-2 rounded-xl transition-colors backdrop-blur-sm"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-3 animate-fade-in-up">
            <div className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    location.pathname === link.path
                      ? "bg-white/25 text-white backdrop-blur-sm"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
