import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBookingsQuery, useCatalogQuery } from "@/hooks/use-api-data";
import { useLang } from "@/contexts/LanguageContext";
import { getDurationLabel, getSportPriceRange } from "@/lib/pricing";

const shuffle = <T,>(items: T[]) =>
  [...items].sort(() => Math.random() - 0.5);

export default function SportCards() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const { data, isLoading } = useCatalogQuery();
  const { data: bookings = [] } = useBookingsQuery();

  const services = useMemo(() => {
    const allServices = [...(data?.sports ?? []), ...(data?.bookingOptions ?? [])].filter(
      (service) => ["individual", "packages"].includes(service.category ?? "individual"),
    );
    const bookingCounts = new Map<string, number>();
    const countedBookings = new Set<string>();

    for (const booking of bookings) {
      if (booking.status !== "confirmed") continue;

      const serviceId = booking.bookingOptionId ?? booking.sportId;
      const groupId = booking.bookingGroupId ?? booking.id;
      const countKey = `${serviceId}:${groupId}`;

      if (countedBookings.has(countKey)) continue;

      countedBookings.add(countKey);
      bookingCounts.set(serviceId, (bookingCounts.get(serviceId) ?? 0) + 1);
    }

    return shuffle(allServices)
      .sort((a, b) => (bookingCounts.get(b.id) ?? 0) - (bookingCounts.get(a.id) ?? 0))
      .slice(0, 5);
  }, [bookings, data?.bookingOptions, data?.sports]);

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
            {services.map((sport, index) => (
              <button
                key={sport.id}
                onClick={() => navigate(`/booking?sport=${sport.id}`)}
                className={`sport-card flex flex-col items-center gap-3 text-center fade-in-up stagger-${Math.min(index + 1, 5)}`}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <span className="text-base font-semibold">
                  {sport.key}
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
