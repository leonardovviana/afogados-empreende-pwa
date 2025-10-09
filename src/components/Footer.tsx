import logoAfadm from "@/assets/logoafadm2.png";
import logoCdl from "@/assets/logocdl.png";
import logoFeira from "@/assets/logofeira.png";
import logoSala from "@/assets/logosala.png";
import logoSebrae from "@/assets/logosebrae.png";
import logoUnicef from "@/assets/logounicef.png";
import { CalendarDays, Instagram, MapPin, MessageCircle } from "lucide-react";
import { memo, useMemo } from "react";
import { Link } from "react-router-dom";

const REALIZATION_BRANDS = [
  { src: logoAfadm, alt: "Secretaria de Administração de Afogados da Ingazeira" },
  { src: logoSala, alt: "Sala do Empreendedor" },
  { src: logoSebrae, alt: "SEBRAE" },
] as const;

const PARTNER_BRANDS = [
  { src: logoCdl, alt: "CDL Afogados da Ingazeira" },
  { src: logoUnicef, alt: "UNICEF" },
] as const;

const SOCIAL_LINKS = [
  {
    href: "https://wa.me/5587999781331",
    label: "WhatsApp",
    icon: MessageCircle,
    ariaLabel: "WhatsApp",
  },
  {
    href: "https://instagram.com/sadetur_afdaingazeira",
    label: "Instagram",
    icon: Instagram,
    ariaLabel: "Instagram",
  },
] as const;

const Footer = () => {
  const realizationLogos = useMemo(() => REALIZATION_BRANDS, []);
  const partnerLogos = useMemo(() => PARTNER_BRANDS, []);
  const socialLinks = useMemo(() => SOCIAL_LINKS, []);

  return (
  <footer className="border-t border-primary/10 bg-gradient-to-b from-background via-primary/5 to-background text-muted-foreground" data-dev="leonardovviana">
      <div className="container mx-auto px-4 py-8 md:py-14 space-y-8 md:space-y-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoFeira}
                alt="Logo 8ª Feira do Empreendedor"
                className="h-12 w-auto object-contain hidden sm:block"
                draggable={false}
              />
              <h3 className="text-2xl font-bold text-primary">8ª Feira do Empreendedor</h3>
            </div>
            <p className="text-sm text-muted-foreground/90">
              Um encontro para acelerar negócios, fortalecer conexões e inspirar o Sertão do Pajeú.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground/80">
              <p className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                Praça Arruda Câmara e Praça Padre Carlos Cottart • Afogados da Ingazeira - PE
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" />
                6, 7 e 8 de novembro de 2025
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4">
              {socialLinks.map(({ href, icon: Icon, ariaLabel }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-white/70 text-primary transition hover:-translate-y-1 hover:bg-white md:h-11 md:w-11"
                  aria-label={ariaLabel}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
                Realização
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 md:mt-4 md:gap-4">
                {realizationLogos.map((logo) => (
                  <div
                    key={logo.alt}
                    className="flex h-14 w-24 items-center justify-center rounded-2xl border border-primary/10 bg-white/80 p-2 shadow-sm backdrop-blur-md md:h-16 md:w-28"
                  >
                    <img src={logo.src} alt={logo.alt} className="max-h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
                Parceiros
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 md:mt-4 md:gap-4">
                {partnerLogos.map((logo) => (
                  <div
                    key={logo.alt}
                    className="flex h-14 w-24 items-center justify-center rounded-2xl border border-primary/10 bg-white/80 p-2 shadow-sm backdrop-blur-md md:h-16 md:w-28"
                  >
                    <img src={logo.src} alt={logo.alt} className="max-h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-primary/10 pt-5 text-xs text-muted-foreground/80 md:flex-row md:pt-6 md:text-sm">
          <p>© 2025 Feira do Empreendedor. Todos os direitos reservados.<span className="ml-2 select-none opacity-30" title="dev">LV</span></p>
          <Link to="/admin/dashboard" className="text-primary/70 underline transition hover:text-primary">
            Painel Administrativo
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
