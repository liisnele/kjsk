import { useCatalogQuery } from "@/hooks/use-api-data";
import { useLang } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { getDurationLabel, getSportPriceRange } from "@/lib/pricing";
import { getLocalizedSportName } from "@/lib/sport-labels";

export default function SportCards() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const { data, isLoading } = useCatalogQuery();

  const sports = data?.sports ?? [];
  const getSportName = (sport: typeof sports[number]) =>
    getLocalizedSportName(sport, lang, t.sportNames);

  return (
    <section id="sports-section" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl text-balance">
            {t.sports.title}
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            {t.sports.subtitle}
          </p>
        </div>

        {isLoading ? (
          <p className="mt-12 text-center text-muted-foreground">Loading sports...</p>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {sports.map((sport, index) => (
              <button
                key={sport.id}
                onClick={() => navigate(`/booking?sport=${sport.id}`)}
                className={`sport-card flex flex-col items-center gap-3 text-center fade-in-up stagger-${Math.min(index + 1, 5)}`}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <span className="text-3xl">{sport.icon}</span>
                <span className="text-sm font-medium">
                  {getSportName(sport)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getSportPriceRange(sport, lang)} · {getDurationLabel(sport.durationMinutes)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
