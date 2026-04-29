import { useMemo, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useBookingsQuery, useCatalogQuery } from "@/hooks/use-api-data";
import { generateTimeSlots } from "@/lib/availability";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { et } from "date-fns/locale";

export default function BookingCalendar() {
  const { t } = useLang();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const { data: catalog, isLoading: catalogLoading } = useCatalogQuery();
  const { data: bookings = [] } = useBookingsQuery();

  const sportCenters = catalog?.sportCenters ?? [];
  const sports = catalog?.sports ?? [];
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const centersToShow =
    selectedCenter === "all"
      ? sportCenters
      : sportCenters.filter((center) => center.id === selectedCenter);

  const hours = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) =>
        `${(8 + index).toString().padStart(2, "0")}:00`,
      ),
    [],
  );

  const firstColumnWidth = useMemo(() => {
    if (sportCenters.length === 0) {
      return 140;
    }

    const longestCourtNameLength = Math.max(
      ...sportCenters.flatMap((center) =>
        center.courts.map((court) => court.name.length),
      ),
    );

    return Math.max(140, longestCourtNameLength * 8);
  }, [sportCenters]);

  return (
    <section className="bg-sport-gray-light py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl text-balance">
            {t.calendar.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{t.calendar.subtitle}</p>
        </div>

        {catalogLoading ? (
          <p className="mt-10 text-center text-muted-foreground">Loading schedule...</p>
        ) : (
          <div className="mt-10 flex flex-col gap-8 lg:flex-row">
            <div className="flex shrink-0 flex-col gap-4">
              <div className="w-fit rounded-2xl border border-border bg-card p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={et}
                  className="pointer-events-auto"
                  disabled={{
                    before: new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      new Date().getDate(),
                    ),
                  }}
                />
              </div>

              <div className="flex max-w-[260px] flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCenter("all")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                    selectedCenter === "all"
                      ? "bg-sport-dark text-white"
                      : "bg-card border border-border text-foreground hover:bg-secondary",
                  )}
                >
                  {t.calendar.allCenters}
                </button>
                {sportCenters.map((center) => (
                  <button
                    key={center.id}
                    onClick={() => setSelectedCenter(center.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                      selectedCenter === center.id
                        ? "bg-sport-dark text-white"
                        : "bg-card border border-border text-foreground hover:bg-secondary",
                    )}
                  >
                    {center.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[600px]">
                {centersToShow.map((center) => (
                  <div key={center.id} className="mb-6">
                    <h3 className="mb-3 font-display text-base font-semibold">
                      {center.name}
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `${firstColumnWidth}px repeat(${hours.length}, 1fr)`,
                        }}
                      >
                        <div className="border-b border-r border-border bg-secondary/50 p-2 text-xs font-medium text-muted-foreground">
                          {t.booking.courts}
                        </div>
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className="border-b border-r border-border bg-secondary/50 p-2 text-center text-xs text-muted-foreground last:border-r-0"
                          >
                            {hour}
                          </div>
                        ))}

                        {center.courts.map((court) => {
                          const sport = sports.find((item) => item.id === court.sportId);
                          const slots = generateTimeSlots(
                            dateStr,
                            center.id,
                            court.sportId,
                            sportCenters,
                            bookings,
                          );
                          const courtSlots = slots.filter((slot) => slot.courtId === court.id);

                          return (
                            <div key={court.id} className="contents">
                              <div className="flex items-center gap-1.5 border-b border-r border-border p-2 text-xs font-medium whitespace-nowrap last:border-b-0">
                                <span>{sport?.icon}</span>
                                {court.name}
                              </div>
                              {hours.map((hour) => {
                                const slot = courtSlots.find((item) => item.time === hour);
                                return (
                                  <div
                                    key={hour}
                                    className={cn(
                                      "border-b border-r border-border p-1 last:border-r-0 last:border-b-0",
                                      slot?.available
                                        ? "bg-sport-success/10"
                                        : "bg-destructive/10",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "h-full w-full rounded text-center text-[10px] font-medium leading-6",
                                        slot?.available
                                          ? "text-sport-success"
                                          : "text-destructive",
                                      )}
                                    >
                                      ●
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-sport-success/20" />
                    {t.calendar.available}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-destructive/20" />
                    {t.calendar.booked}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
