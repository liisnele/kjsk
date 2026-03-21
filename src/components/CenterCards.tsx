import { useLang } from "@/contexts/LanguageContext";
import { sportCenters } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { MapPin, Star } from "lucide-react";

export default function CenterCards() {
  const { lang, t } = useLang();
  const navigate = useNavigate();

  return (
    <section className="bg-sport-gray-light py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl text-balance">
            {t.centers.title}
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            {t.centers.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {sportCenters.map((center, i) => (
            <button
              key={center.id}
              onClick={() => navigate(`/booking?center=${center.id}`)}
              className="sport-card text-left"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    {center.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {center.location}
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-sport-yellow-light px-2 py-1 text-sm font-medium">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {center.rating}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {center.description[lang]}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {center.sportIds.slice(0, 4).map((sid) => (
                  <span
                    key={sid}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {t.sportNames[sid as keyof typeof t.sportNames]}
                  </span>
                ))}
                {center.sportIds.length > 4 && (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    +{center.sportIds.length - 4}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
