import { useCatalogQuery } from "@/hooks/use-api-data";
import { useLang } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

export default function CenterCards() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const { data, isLoading } = useCatalogQuery();

  const centers = data?.sportCenters ?? [];
  const services = [...(data?.sports ?? []), ...(data?.bookingOptions ?? [])];
  const getServiceName = (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    return service?.key ?? serviceId;
  };

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

        {isLoading ? (
          <p className="mt-12 text-center text-muted-foreground">Loading centers...</p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {centers.map((center, index) => (
              <button
                key={center.id}
                onClick={() => navigate(`/booking?center=${center.id}`)}
                className="sport-card text-left"
                style={{ animationDelay: `${index * 0.08}s` }}
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
                </div>
                <p className="text-sm text-muted-foreground">
                  {center.description[lang === "ru" ? "en" : lang]}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[...center.sportIds, ...center.bookingOptionIds].slice(0, 4).map((sportId) => (
                    <span
                      key={sportId}
                      className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                    >
                      {getServiceName(sportId)}
                    </span>
                  ))}
                  {center.sportIds.length + center.bookingOptionIds.length > 4 && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      +{center.sportIds.length + center.bookingOptionIds.length - 4}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
