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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section with institutional spaces */}
          <div className="flex items-center gap-4">
            {/* Espaço para logo da Prefeitura */}
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover-lift">
              <span className="text-xs text-white/60 text-center">Logo Prefeitura</span>
            </div>
            
            {/* Espaço para logo da Secretaria */}
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover-lift">
              <span className="text-xs text-white/60 text-center">Logo Secretaria</span>
            </div>

            <Link to="/" className="text-lg md:text-xl font-bold text-white font-['Poppins'] hover:scale-105 transition-transform">
              <span className="hidden lg:inline">8ª Feira do Empreendedor</span>
              <span className="lg:hidden">Feira 2025</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  location.pathname === link.path
                    ? "bg-white/20 text-white shadow-glow"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-fade-in-up">
            <div className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    location.pathname === link.path
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
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
