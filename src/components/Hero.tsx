import { useLang } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-sport-dark py-24 md:py-32">
      {/* Abstract decorative elements */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="fade-in-up font-display text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl text-balance">
            {t.hero.title}
          </h1>
          <p className="fade-in-up stagger-1 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 text-pretty">
            {t.hero.subtitle}
          </p>
          <div className="fade-in-up stagger-2 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate("/booking")}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97]"
            >
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                document.getElementById("sports-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-8 py-4 font-display text-base font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.97]"
            >
              {t.hero.ctaSecondary}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
