import heroBg from "@/assets/hero-bg.jpg";
import heroBg2 from "@/assets/hero-bg2.jpg";
import heroBg3 from "@/assets/hero-bg3.jpg";
import logoAfogados from "@/assets/logoaf.png";
import logoCdl from "@/assets/logocdl.png";
import logoSebrae from "@/assets/logosebrae.png";
import logoUnicef from "@/assets/logounicef.png";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Award,
  Building2,
  CalendarCheck,
  Handshake,
  HeartHandshake,
  Lightbulb,
  Rocket,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { icon: Building2, label: "Expositores", value: "100+" },
  { icon: Users, label: "Visitantes", value: "5.000+" },
  { icon: TrendingUp, label: "Negócios", value: "R$ 2 milhões" },
  { icon: Award, label: "Edições", value: "8ª" },
];

const values = [
  {
    title: "Missão",
    description:
      "Fortalecer o ecossistema empreendedor do Sertão, impulsionando negócios locais e conectando pessoas a oportunidades reais.",
  },
  {
    title: "Visão",
    description:
      "Ser referência regional em eventos de inovação e empreendedorismo, gerando impacto econômico e social sustentável.",
  },
  {
    title: "Propósito",
    description:
      "Transformar histórias empreendedoras em cases de sucesso, abrindo caminho para que novas ideias prosperem.",
  },
];

const pillars = [
  {
    icon: Lightbulb,
    title: "Inovação",
    description: "Conteúdos curados, lançamentos de produtos e um ambiente feito para quem pensa à frente.",
  },
  {
    icon: Handshake,
    title: "Conexão",
    description: "Networking estruturado, rodadas de negócios e aproximação estratégica entre empresas e público.",
  },
  {
    icon: Rocket,
    title: "Crescimento",
    description: "Mentorias, workshops e parcerias que aceleram resultados e fortalecem marcas.",
  },
  {
    icon: HeartHandshake,
    title: "Impacto Social",
    description: "Projetos que valorizam a cultura local, criam empregos e movimentam a economia criativa.",
  },
];

const timeline = [
  {
    year: "2017",
    title: "Primeira edição",
    description: "Nasce a feira com 35 expositores locais e o objetivo de aquecer o comércio regional.",
  },
  {
    year: "2019",
    title: "Expansão",
    description: "Programa de capacitações e rodadas de negócios consolida o evento como agenda do empreendedor.",
  },
  {
    year: "2022",
    title: "Transformação digital",
    description: "A feira ganha versão híbrida, plataforma de matchmaking e cobertura online.",
  },
  {
    year: "2025",
    title: "8ª edição",
    description: "Recorde de público, novas trilhas temáticas e um ecossistema conectado ao futuro do Sertão.",
  },
];

const supporters = [
  { name: "Prefeitura de Afogados da Ingazeira", logo: logoAfogados },
  { name: "SEBRAE", logo: logoSebrae },
  { name: "CDL Afogados", logo: logoCdl },
  { name: "Unicef", logo: logoUnicef },
];

const galleryImages = [
  {
    src: heroBg,
    caption: "Edição 2022 – Arena principal lotada",
  },
  {
    src: heroBg2,
    caption: "Networking no lounge de negócios",
  },
  {
    src: heroBg3,
    caption: "Experiência gastronômica dos expositores",
  },
  {
    src: heroBg2,
    caption: "Mentorias coletivas com especialistas",
  },
  {
    src: heroBg3,
    caption: "Palco multi-trilhas com cases do Sertão",
  },
];

const Sobre = () => {
  const [mainImage, ...secondaryImages] = galleryImages;
  const leftImages = secondaryImages.slice(0, 2);
  const rightImages = secondaryImages.slice(2);

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-background via-secondary/10 to-background/40">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_55%)]" />

      <Navigation />

      <main className="flex-1 pt-20 md:pt-24 pb-16 space-y-16 md:space-y-24">
        <section className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-gradient-to-br from-primary/15 via-white/85 to-secondary/15 text-foreground shadow-mega backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,40,80,0.25),_transparent_60%)] mix-blend-multiply" />
            <div className="relative grid gap-10 px-6 py-12 md:px-12 md:py-16 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
              <div className="space-y-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                  8ª Edição • 2025
                </span>
                <h1 className="text-3xl font-bold leading-tight text-primary sm:text-4xl lg:text-5xl">
                  A feira que faz o Sertão empreender em alta velocidade
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg lg:max-w-xl">
                  Somos o ponto de encontro entre inovação, tradição e negócios. Há oito edições, a Feira do Empreendedor conecta histórias que impulsionam Afogados da Ingazeira.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link to="/cadastro" className="w-full sm:w-auto">
                    <Button className="w-full rounded-2xl bg-secondary px-8 py-6 text-base font-semibold text-secondary-foreground transition hover:bg-secondary-light focus-visible:ring-secondary sm:w-auto">
                      Quero expor meu negócio
                    </Button>
                  </Link>
                  <Link to="/manual" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl border-primary/20 bg-primary/5 px-8 py-6 text-base font-semibold text-primary transition hover:bg-primary/10 focus-visible:ring-primary sm:w-auto"
                    >
                      Conheça o manual do expositor
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-card rounded-2xl border border-primary/10 bg-primary/5 p-6 text-primary shadow-lg backdrop-blur"
                  >
                    <div className="flex items-center justify-between text-primary/70">
                      <stat.icon className="h-6 w-6" />
                      <span className="text-xs uppercase tracking-[0.3em]">{stat.label}</span>
                    </div>
                    <div className="mt-6 text-3xl font-bold lg:text-4xl text-primary">{stat.value}</div>
                    <div className="mt-2 h-1 rounded-full bg-gradient-to-r from-primary via-secondary to-accent/80" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.75fr]">
            <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-white/85 to-secondary/12 p-6 shadow-elegant backdrop-blur-md dark:bg-primary/10">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Nossa essência
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                Um evento feito para o desenvolvimento do Sertão
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Desde a primeira edição, somos movidos pela missão de posicionar Afogados da Ingazeira como um polo de empreendedorismo. A feira cresceu, diversificou sua programação e hoje oferece uma experiência imersiva que combina conhecimento, networking e oportunidades de negócios.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {values.map((value) => (
                  <div key={value.title} className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <h3 className="text-sm font-semibold text-primary sm:text-base">{value.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-secondary/10 via-secondary/5 to-accent/10 p-6 shadow-primary">
              <h3 className="text-lg font-semibold text-primary sm:text-xl">Histórias que inspiram</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Resultados alcançados por quem já apostou na feira e transformou sua jornada empreendedora.
              </p>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 text-primary">
                    <Handshake className="h-5 w-5" />
                    <span className="font-semibold">Parcerias estratégicas</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm">
                    63% dos expositores firmaram novos acordos comerciais após participarem da última edição.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 text-primary">
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold">Crescimento acelerado</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm">
                    Marcas locais registraram aumento médio de 35% no faturamento nos meses seguintes ao evento.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 text-primary">
                    <CalendarCheck className="h-5 w-5" />
                    <span className="font-semibold">Visibilidade contínua</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm">
                    O ecossistema permanece ativo com mentorias, missões técnicas e encontros após a feira.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[3rem] border border-primary/15 bg-gradient-to-br from-primary/25 via-secondary/20 to-accent/25 p-6 shadow-mega md:p-12">
            <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.35),_transparent_65%)]" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl" />

            <div className="relative text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                Memórias da feira
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                Reviva os momentos que marcaram empreendedores e visitantes
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
                Cada edição deixa histórias inesquecíveis. Confira alguns registros que ilustram a energia, a diversidade e o clima colaborativo da Feira do Empreendedor ao longo dos anos.
              </p>
            </div>

            <div className="relative mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-[0.75fr_1.35fr_0.75fr] xl:items-stretch">
              <div className="order-2 flex flex-col gap-4 rounded-[2rem] bg-white/5 p-1 shadow-lg backdrop-blur-sm md:order-2 xl:order-1">
                {leftImages.map((image) => (
                  <figure
                    key={image.caption}
                    className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10"
                  >
                    <img
                      src={image.src}
                      alt={image.caption}
                      className="h-48 w-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent px-4 pb-4 pt-12 text-left text-xs font-medium text-white/90">
                      {image.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>

              <div className="order-1 overflow-hidden rounded-[2.75rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur md:order-1 md:col-span-2 xl:order-2 xl:col-span-1">
                <figure className="relative h-[340px] sm:h-[420px] lg:h-[520px]">
                  <img
                    src={mainImage.src}
                    alt={mainImage.caption}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent" />
                  <figcaption className="absolute bottom-0 left-0 right-0 space-y-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pb-6 pt-20 text-left text-white">
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                      Destaque
                    </span>
                    <p className="text-lg font-semibold leading-tight sm:text-xl">
                      {mainImage.caption}
                    </p>
                  </figcaption>
                </figure>
              </div>

              <div className="order-3 flex flex-col gap-4 rounded-[2rem] bg-white/5 p-1 shadow-lg backdrop-blur-sm md:order-3 md:col-span-1 xl:col-span-1 xl:order-3">
                {rightImages.map((image) => (
                  <figure
                    key={image.caption}
                    className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10"
                  >
                    <img
                      src={image.src}
                      alt={image.caption}
                      className="h-48 w-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent px-4 pb-4 pt-12 text-left text-xs font-medium text-white/90">
                      {image.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-white/85 to-accent/10 p-6 shadow-primary backdrop-blur md:p-10 dark:bg-primary/10">
            <div className="grid gap-6 lg:grid-cols-[0.35fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Linha do tempo
                </span>
                <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                  Como evoluímos ao lado dos empreendedores
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Cada edição reflete uma etapa importante da nossa jornada. A feira acompanhou o ritmo da cidade e hoje é palco das histórias que moldam o futuro do Sertão.
                </p>
              </div>

              <div className="relative">
                <ul className="space-y-6">
                  {timeline.map((item) => (
                    <li key={item.year} className="relative overflow-hidden rounded-2xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                      <div className="absolute left-5 top-5 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary/80 opacity-10 blur-2xl" />
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-6">
                        <div className="flex items-center gap-3 text-primary">
                          <span className="text-xl font-bold lg:text-2xl">{item.year}</span>
                            <span className="hidden h-2 w-2 rounded-full bg-secondary lg:block" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground sm:text-lg">{item.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
              Nossa base
            </span>
            <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
              Os pilares que sustentam a experiência da feira
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Cada área da programação foi pensada para gerar valor imediato para expositores e visitantes. Do estande ao palco principal, criamos rotas que estimulam conhecimento, conexões e resultados.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-3xl border border-primary/10 bg-gradient-to-tr from-white/70 via-white/80 to-secondary/10 p-6 shadow-elegant backdrop-blur dark:bg-primary/10">
                <pillar.icon className="h-10 w-10 text-secondary" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-6 shadow-primary md:p-10">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Quem faz acontecer
              </span>
              <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                Parcerias que transformam a feira em realidade
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                A Feira do Empreendedor é resultado da união entre setor público, iniciativa privada e instituições que acreditam no potencial do Sertão.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              {supporters.map((supporter) => (
                <div
                  key={supporter.name}
                  className="flex h-28 items-center justify-center rounded-2xl border border-primary/10 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:shadow-lg dark:bg-primary/10"
                >
                  <img
                    src={supporter.logo}
                    alt={supporter.name}
                    className="max-h-16 w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="rounded-[2.5rem] border border-primary/10 bg-primary/5 p-10 text-center shadow-elegant">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              Pronto para viver a Feira do Empreendedor por dentro?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Garanta o seu espaço, envolva sua equipe e prepare seu estande para três noites de oportunidades. A próxima história de sucesso pode ser a sua.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/cadastro">
                <Button className="rounded-2xl bg-secondary px-8 py-6 text-base font-semibold text-secondary-foreground transition hover:bg-secondary-light">
                  Reservar estande agora
                </Button>
              </Link>
              <Link to="/contato">
                <Button variant="outline" className="rounded-2xl border-primary/20 px-8 py-6 text-base font-semibold text-primary hover:bg-primary/10">
                  Falar com a organização
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;
