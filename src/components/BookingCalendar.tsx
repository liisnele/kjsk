import { useMemo, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useBookingsQuery, useCatalogQuery } from "@/hooks/use-api-data";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { enUS, et, ru } from "date-fns/locale";
import {
  arenaRowId,
  arenaSportIds,
  bookingEndTime,
  buildScheduleRows,
  getArenaLaneStyle,
  getScheduleLeft,
  getScheduleWidth,
  scheduleHours,
  scheduleLabelWidth,
  scheduleTableWidth,
  scheduleTimelineWidth,
  scheduleHourWidth,
} from "@/lib/schedule";
import type { Booking } from "@/types/api";

function getConfirmedBookings(bookings: Booking[], date: string) {
  return bookings.filter(
    (booking) => booking.date === date && booking.status === "confirmed",
  );
}

export default function BookingCalendar() {
  const { lang, t } = useLang();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const { data: catalog, isLoading: catalogLoading } = useCatalogQuery();
  const { data: bookings = [] } = useBookingsQuery();

  const sportCenters = useMemo(
    () => catalog?.sportCenters ?? [],
    [catalog?.sportCenters],
  );
  const sports = useMemo(() => catalog?.sports ?? [], [catalog?.sports]);
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const calendarLocale = lang === "ru" ? ru : lang === "en" ? enUS : et;

  const centersToShow = useMemo(
    () =>
      selectedCenter === "all"
        ? sportCenters
        : sportCenters.filter((center) => center.id === selectedCenter),
    [selectedCenter, sportCenters],
  );

  const confirmedBookings = useMemo(
    () => getConfirmedBookings(bookings, dateStr),
    [bookings, dateStr],
  );

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
                  locale={calendarLocale}
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
              <div style={{ minWidth: scheduleTableWidth }}>
                {centersToShow.map((center) => {
                  const scheduleRows = buildScheduleRows(center, confirmedBookings, sports);
                  const arenaBookings = confirmedBookings.filter((booking) =>
                    arenaSportIds.has(booking.sportId),
                  );

                  return (
                  <div key={center.id} className="mb-6">
                    <h3 className="mb-3 font-display text-base font-semibold">
                      {center.name}
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `${scheduleLabelWidth}px repeat(${scheduleHours.length}, ${scheduleHourWidth}px)`,
                        }}
                      >
                        <div className="border-b border-r border-border bg-secondary/50 p-2 text-xs font-medium text-muted-foreground">
                          {t.booking.courts}
                        </div>
                        {scheduleHours.map((hour) => (
                          <div
                            key={hour}
                            className="border-b border-r border-border bg-secondary/50 p-2 text-center text-xs text-muted-foreground last:border-r-0"
                          >
                            {String(hour).padStart(2, "0")}:00
                          </div>
                        ))}
                      </div>

                      {scheduleRows.map((row) => {
                        return (
                          <div
                            key={row.id}
                            className="grid"
                            style={{
                              gridTemplateColumns: `${scheduleLabelWidth}px ${scheduleTimelineWidth}px`,
                            }}
                          >
                            <div className="flex min-h-16 items-center gap-1.5 border-b border-r border-border p-2 text-xs font-medium whitespace-nowrap last:border-b-0">
                              {row.name}
                            </div>
                            <div
                              className="relative min-h-16 border-b border-border bg-sport-success/20"
                              style={{
                                gridColumn: `2 / span ${scheduleHours.length}`,
                              }}
                            >
                              <div
                                className="absolute inset-0 grid"
                                style={{
                                  gridTemplateColumns: `repeat(${scheduleHours.length}, ${scheduleHourWidth}px)`,
                                }}
                              >
                                {scheduleHours.map((hour) => (
                                  <div
                                    className="border-r border-border last:border-r-0"
                                    key={hour}
                                  />
                                ))}
                              </div>
                              {row.bookings.length === 0 ? (
                                <div className="absolute inset-y-0 left-0 flex items-center px-4 text-xs text-muted-foreground/60">
                                  {t.calendar.available}
                                </div>
                              ) : null}

                              {row.bookings.map((booking) => {
                                const isArena = row.id === arenaRowId;
                                const timeLabel = `${booking.time}-${bookingEndTime(booking)}`;

                                return (
                                  <div
                                    key={booking.id}
                                    className="absolute z-10 overflow-hidden rounded-md border border-destructive/40 bg-destructive/20 px-2 py-1 text-left text-[10px] font-semibold leading-tight text-destructive shadow-sm"
                                    style={{
                                      left: getScheduleLeft(booking),
                                      width: getScheduleWidth(booking),
                                      ...(isArena
                                        ? getArenaLaneStyle(booking, arenaBookings)
                                        : { top: "14%", height: "72%" }),
                                    }}
                                    title={timeLabel}
                                  >
                                    <span className="block truncate">
                                      {t.calendar.booked}
                                    </span>
                                    <span className="block truncate font-medium opacity-90">
                                      {timeLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )})}

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
