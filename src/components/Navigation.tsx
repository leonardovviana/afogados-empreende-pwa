import logoAfadm from "@/assets/logoafadm2.png";
import logoFeira from "@/assets/logofeira.png";
import logoSala from "@/assets/logosala.png";
import logoSebrae from "@/assets/logosebrae.png";
import { Menu, X } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { name: "Início", path: "/" },
  { name: "Cadastro", path: "/cadastro" },
  { name: "Consulta", path: "/consulta" },
  { name: "Mapa", path: "/mapa" },
  { name: "Sobre", path: "/sobre" },
  { name: "Manual", path: "/manual" },
] as const;

const REALIZATION_LOGOS = [
  {
    src: logoAfadm,
    alt: "Secretaria de Administração de Afogados da Ingazeira",
  },
  {
    src: logoSala,
    alt: "Sala do Empreendedor",
  },
  {
    src: logoSebrae,
    alt: "SEBRAE",
  },
] as const;

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = useMemo(() => NAV_LINKS, []);
  const realizationLogos = useMemo(() => REALIZATION_LOGOS, []);
  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);
  const toggleMenu = useCallback(() => setIsOpen((previous) => !previous), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 shadow-elegant bg-white/85 text-primary backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Section with institutional logos */}
          <div className="flex flex-1 items-center justify-center md:justify-start gap-1.5 md:gap-3">
            <Link
              to="/"
              className="flex items-center gap-3 md:gap-4 text-base md:text-xl font-semibold text-primary hover:scale-105 transition-transform"
            >
              <img
                src={logoFeira}
                alt="Logo 8ª Feira do Empreendedor"
                className="h-9 sm:h-10 md:h-12 w-auto object-contain"
                draggable={false}
              />
            </Link>

            <div className="hidden xl:flex items-center gap-1 md:gap-1.5 pl-1.5 border-l border-primary/15">
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.28em] text-primary/60">
                Realização
              </span>
              <div className="flex items-center gap-1.5 md:gap-1.5">
                {realizationLogos.map((logo) => (
                  <div
                    key={logo.alt}
                    className="flex h-9 md:h-11 items-center justify-center rounded-xl border border-primary/10 bg-white/90 px-2.5 py-2 shadow-sm backdrop-blur-md"
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="h-5 md:h-7 w-auto object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 ml-3 lg:ml-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  isActive(link.path)
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-primary/80 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-primary hover:bg-primary/10 p-2 rounded-xl transition-colors backdrop-blur-sm"
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
                  onClick={closeMenu}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "text-primary/80 hover:bg-primary/5 hover:text-primary"
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
  <div className="sm:hidden mt-20 mb-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/10 bg-white/80 p-3 shadow-sm backdrop-blur">
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary/60">
            Realização
          </span>
          <div className="flex items-center gap-3">
            {realizationLogos.map((logo) => (
              <div
                key={logo.alt}
                className="flex h-12 w-20 items-center justify-center rounded-xl border border-primary/10 bg-white/95 p-2 shadow-sm"
              >
                <img src={logo.src} alt={logo.alt} className="max-h-full w-full object-contain" draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default memo(Navigation);
