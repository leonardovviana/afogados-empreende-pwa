import heroImage1 from "@/assets/hero-bg.jpg";
import heroImage2 from "@/assets/hero-bg2.jpg";
import heroImage3 from "@/assets/hero-bg3.jpg";
import Countdown from "@/components/Countdown";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { getMixedPhotoUrls } from "@/lib/photos";
import {
    ArrowRight,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Info,
    Map,
    MapPin,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const HERO_DYNAMIC_IMAGES = getMixedPhotoUrls();

const HERO_IMAGES = [heroImage1, heroImage2, heroImage3] as const;
const HERO_IMAGES_WITH_PHOTOS: string[] = [...HERO_IMAGES, ...HERO_DYNAMIC_IMAGES];

const HERO_METRICS = [
  {
    icon: Building2,
    label: "Expositores",
    value: "200+",
  },
  {
    icon: Users,
    label: "Visitantes",
    value: "15.000+",
  },
  {
    icon: TrendingUp,
    label: "NPS dos expositores",
    value: "9.5",
  },
] as const;

const HERO_HIGHLIGHTS = [
  {
    colorClass: "bg-secondary",
    text: "Workshops e mentorias exclusivas",
  },
  {
    colorClass: "bg-accent",
    text: "Rodadas de negócio e networking",
  },
  {
    colorClass: "bg-sand",
    text: "Espaço gastronômico e experiências",
  },
] as const;

const QUICK_LINKS = [
  {
    to: "/mapa",
    title: "Mapa do Evento",
    description: "Veja a localização e distribuição completa dos stands",
    icon: Map,
    gradientClass: "from-primary/5 to-secondary/5",
  },
  {
    to: "/sobre",
    title: "Conheça o Evento",
    description: "História, números e tudo sobre nossa feira",
    icon: Info,
    gradientClass: "from-secondary/5 to-accent/5",
  },
  {
    to: "/manual",
    title: "Manual do Expositor",
    description: "Guia completo com todas as orientações",
    icon: ClipboardList,
    gradientClass: "from-accent/5 to-primary/5",
  },
] as const;

const Home = () => {
  const heroMetrics = HERO_METRICS;
  const heroHighlights = HERO_HIGHLIGHTS;
  const quickLinks = QUICK_LINKS;
  const heroImages = HERO_IMAGES_WITH_PHOTOS;
  const totalImages = heroImages.length;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }, 5000);
  }, [totalImages]);

  const goToImage = useCallback(
    (direction: "next" | "prev") => {
      setCurrentImageIndex((prev) => {
        if (direction === "next") {
          return (prev + 1) % totalImages;
        }
        return (prev - 1 + totalImages) % totalImages;
      });
      startAutoPlay();
    },
    [startAutoPlay, totalImages]
  );

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startAutoPlay]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 -z-10"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDRENDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTAgMTZjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTE2IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptMC0xNmMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10 -z-10"></div>
      
      <Navigation />
      <InstallPrompt />

      {/* Hero Section */}
      <main className="flex-1 bg-gradient-to-b from-background via-secondary/10 to-sand-light/25">
  <section className="relative overflow-hidden pt-16 md:pt-32 pb-16 md:pb-24">
          <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-secondary/25 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-accent/15 blur-3xl"></div>
          <div className="absolute -bottom-32 right-0 h-96 w-96 translate-x-1/3 rounded-full bg-primary/15 blur-3xl"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background"></div>

          <div className="container relative z-10 px-4">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:bg-primary/15 dark:text-primary-foreground">
                  <Sparkles size={16} className="text-secondary" />
                  8ª edição • 2025
                </span>
                <h1 className="mt-6 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-6xl dark:text-primary-foreground">
                  A vitrine do empreendedorismo sertanejo
                </h1>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                  Três dias de negócios, inovação e conexões para quem transforma Afogados da Ingazeira. Reserve o seu estande e participe da maior feira empreendedora do Sertão.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-primary/40 dark:bg-primary/20">
                    <div className="rounded-full bg-secondary/10 p-2 text-secondary">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary dark:text-primary-foreground">6, 7 e 8 de novembro</p>
                      <p className="text-xs text-muted-foreground">Programação intensa de 18h às 23h</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-primary/40 dark:bg-primary/20">
                    <div className="rounded-full bg-secondary/10 p-2 text-secondary">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary dark:text-primary-foreground">Praça Arruda Câmara e Praça Padre Carlos Cottart </p>
                      <p className="text-xs text-muted-foreground">Centro de Afogados da Ingazeira - PE</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link to="/cadastro" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full rounded-2xl bg-gradient-to-r from-secondary via-secondary-light to-accent px-10 py-6 text-base font-semibold shadow-mega transition hover:from-secondary-light hover:via-secondary hover:to-secondary sm:w-auto"
                    >
                      Garanta seu estande
                    </Button>
                  </Link>
                  <Link to="/manual" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full rounded-2xl border-primary/30 bg-white/70 px-8 py-6 text-base font-semibold text-primary transition hover:bg-primary/10 dark:border-primary/40 dark:bg-primary/10 dark:text-primary-foreground sm:w-auto"
                    >
                      Manual do expositor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="mt-12 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
                  {heroHighlights.map(({ colorClass, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${colorClass}`}></span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/15 bg-primary/5 shadow-mega">
                  <div className="relative h-[260px] w-full sm:h-[320px] lg:h-[360px]">
                    {heroImages.map((imageSrc, index) => (
                      <img
                        key={imageSrc}
                        src={imageSrc}
                        alt="Empreendedores na feira do empreendedor"
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                          index === currentImageIndex ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    ))}

                    <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/50 to-secondary/60 mix-blend-multiply"></div>

                    <div className="absolute inset-0 flex flex-col justify-between p-6 text-white md:p-8">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                          Arena principal
                        </span>
                      </div>
                      <div>
                        <h3 className="mt-3 text-2xl font-semibold md:text-3xl">Programação inspiradora para todas as áreas</h3>
                        <p className="mt-3 max-w-md text-sm text-white/80 md:text-base">
                          Conteúdo curado para impulsionar vendas, fortalecer marcas e abrir novos mercados para o seu negócio.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Imagem anterior"
                      onClick={() => goToImage("prev")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Próxima imagem"
                      onClick={() => goToImage("next")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                      {heroImages.map((_, index) => (
                        <span
                          key={`indicator-${index}`}
                          className={`h-2 w-2 rounded-full transition-all ${
                            index === currentImageIndex ? "bg-white" : "bg-white/50"
                          }`}
                        ></span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-3xl border border-white/30 p-6 shadow-mega backdrop-blur-xl dark:border-white/10 md:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary dark:text-primary-foreground">
                      Contagem regressiva
                    </span>
                    <Sparkles size={18} className="text-secondary" />
                  </div>
                  <div className="mt-6">
                    <Countdown />
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {heroMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-2xl border border-primary/15 bg-white/80 p-4 text-center shadow-sm backdrop-blur-md dark:border-primary/40 dark:bg-primary/20"
                      >
                        <metric.icon className="mx-auto h-6 w-6 text-secondary" />
                        <p className="mt-2 text-xl font-semibold text-primary dark:text-primary-foreground">{metric.value}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links - Modern Cards */}
        <div className="relative px-4 py-12 md:py-20">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-foreground">
              Acesso Rápido
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {quickLinks.map(({ to, icon: Icon, title, description, gradientClass }) => (
                <Link
                  key={to}
                  to={to}
                  className="group glass-card p-6 md:p-8 rounded-3xl hover-lift relative overflow-hidden glass-card-hover"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity`}
                  ></div>
                  <div className="relative z-10">
                    <div className="text-5xl md:text-6xl mb-3 md:mb-4 transform group-hover:scale-110 transition-transform">
                      <Icon className="w-12 h-12 md:w-14 md:h-14 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-primary mb-2 md:mb-3">{title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
