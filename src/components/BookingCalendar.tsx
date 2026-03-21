import { useState, useMemo } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { sportCenters, generateTimeSlots, sports, getBookingsFromStorage, type Booking } from "@/data/mockData";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function BookingCalendar() {
  const { lang, t } = useLang();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>(getBookingsFromStorage());

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const centersToShow = selectedCenter === "all"
    ? sportCenters
    : sportCenters.filter((c) => c.id === selectedCenter);

  const hours = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);
  }, []);

  return (
    <section className="bg-sport-gray-light py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl text-balance">
            {t.calendar.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{t.calendar.subtitle}</p>
        </div>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row">
          {/* Left: calendar + center filter */}
          <div className="flex flex-col gap-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="rounded-2xl border border-border bg-card p-4 pointer-events-auto"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCenter("all")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                  selectedCenter === "all"
                    ? "bg-sport-dark text-white"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                )}
              >
                {t.calendar.allCenters}
              </button>
              {sportCenters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCenter(c.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                    selectedCenter === c.id
                      ? "bg-sport-dark text-white"
                      : "bg-card border border-border text-foreground hover:bg-secondary"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right: schedule grid */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[600px]">
              {centersToShow.map((center) => (
                <div key={center.id} className="mb-6">
                  <h3 className="mb-3 font-display text-base font-semibold">{center.name}</h3>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="grid" style={{ gridTemplateColumns: `120px repeat(${hours.length}, 1fr)` }}>
                      {/* Header row */}
                      <div className="border-b border-r border-border bg-secondary/50 p-2 text-xs font-medium text-muted-foreground">
                        {t.booking.courts}
                      </div>
                      {hours.map((h) => (
                        <div key={h} className="border-b border-r border-border bg-secondary/50 p-2 text-center text-xs text-muted-foreground last:border-r-0">
                          {h}
                        </div>
                      ))}

                      {/* Court rows */}
                      {center.courts.map((court) => {
                        const sport = sports.find((s) => s.id === court.sportId);
                        const slots = generateTimeSlots(dateStr, center.id, court.sportId, bookings);
                        const courtSlots = slots.filter((s) => s.courtId === court.id);

                        return (
                          <div key={court.id} className="contents">
                            <div className="flex items-center gap-1.5 border-b border-r border-border p-2 text-xs font-medium last:border-b-0">
                              <span>{sport?.icon}</span>
                              {court.name}
                            </div>
                            {hours.map((h) => {
                              const slot = courtSlots.find((s) => s.time === h);
                              return (
                                <div
                                  key={h}
                                  className={cn(
                                    "border-b border-r border-border p-1 last:border-r-0 last:border-b-0",
                                    slot?.available
                                      ? "bg-sport-success/10"
                                      : "bg-destructive/10"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "h-full w-full rounded text-center text-[10px] font-medium leading-6",
                                      slot?.available
                                        ? "text-sport-success"
                                        : "text-destructive"
                                    )}
                                  >
                                    {slot?.available ? "●" : "●"}
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

              {/* Legend */}
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
      </div>
    </section>
  );
}
