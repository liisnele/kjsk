import { useMemo, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useBookingsQuery, useCatalogQuery } from "@/hooks/use-api-data";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { enUS, et, ru } from "date-fns/locale";
import type { Booking, Court, SportCenter } from "@/types/api";

const SLOT_MINUTES = 30;
const FALLBACK_OPEN = 8 * 60;
const FALLBACK_CLOSE = 22 * 60;

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${hours.toString().padStart(2, "0")}:${remainder
    .toString()
    .padStart(2, "0")}`;
}

function bookingEndTime(booking: Booking) {
  return minutesToTime(timeToMinutes(booking.time) + booking.duration);
}

function getConfirmedBookings(bookings: Booking[], date: string) {
  return bookings.filter(
    (booking) => booking.date === date && booking.status === "confirmed",
  );
}

function getCalendarRange(
  centers: SportCenter[],
  confirmedBookings: Booking[],
) {
  const openingTimes = centers.map((center) => center.openingHours.open * 60);
  const closingTimes = centers.map((center) => center.openingHours.close * 60);
  const bookingStarts = confirmedBookings.map((booking) => timeToMinutes(booking.time));
  const bookingEnds = confirmedBookings.map(
    (booking) => timeToMinutes(booking.time) + booking.duration,
  );

  return {
    open: Math.min(FALLBACK_OPEN, ...openingTimes, ...bookingStarts),
    close: Math.max(FALLBACK_CLOSE, ...closingTimes, ...bookingEnds),
  };
}

function getBookingSpan(booking: Booking, rangeStart: number) {
  const start = timeToMinutes(booking.time);
  const end = start + booking.duration;

  return {
    columnStart: Math.floor((start - rangeStart) / SLOT_MINUTES) + 1,
    span: Math.max(1, Math.ceil((end - start) / SLOT_MINUTES)),
  };
}

function getCourtBookings(
  bookings: Booking[],
  center: SportCenter,
  court: Court,
) {
  return bookings.filter(
    (booking) =>
      booking.centerId === center.id &&
      (booking.courtId === court.id ||
        (!booking.courtId &&
          booking.sportId === court.sportId &&
          center.courts.find((item) => item.sportId === booking.sportId)?.id ===
            court.id)),
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

  const { open, close } = useMemo(
    () => getCalendarRange(centersToShow, confirmedBookings),
    [centersToShow, confirmedBookings],
  );

  const timeSlots = useMemo(
    () =>
      Array.from(
        { length: Math.ceil((close - open) / SLOT_MINUTES) },
        (_, index) => minutesToTime(open + index * SLOT_MINUTES),
      ),
    [close, open],
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

  const gridTemplateColumns = `${firstColumnWidth}px repeat(${timeSlots.length}, minmax(42px, 1fr))`;

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
              <div className="min-w-[760px]">
                {centersToShow.map((center) => (
                  <div key={center.id} className="mb-6">
                    <h3 className="mb-3 font-display text-base font-semibold">
                      {center.name}
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div
                        className="grid"
                        style={{ gridTemplateColumns }}
                      >
                        <div className="border-b border-r border-border bg-secondary/50 p-2 text-xs font-medium text-muted-foreground">
                          {t.booking.courts}
                        </div>
                        {timeSlots.map((time) => (
                          <div
                            key={time}
                            className="border-b border-r border-border bg-secondary/50 p-2 text-center text-xs text-muted-foreground last:border-r-0"
                          >
                            {time.endsWith(":00") ? time : ""}
                          </div>
                        ))}
                      </div>

                      {center.courts.map((court) => {
                        const sport = sports.find((item) => item.id === court.sportId);
                        const courtBookings = getCourtBookings(
                          confirmedBookings,
                          center,
                          court,
                        );

                        return (
                          <div
                            key={court.id}
                            className="grid"
                            style={{ gridTemplateColumns }}
                          >
                            <div className="flex min-h-12 items-center gap-1.5 border-b border-r border-border p-2 text-xs font-medium whitespace-nowrap last:border-b-0">
                              <span>{sport?.icon}</span>
                              {court.name}
                            </div>
                            <div
                              className="relative grid border-b border-border"
                              style={{
                                gridColumn: `2 / span ${timeSlots.length}`,
                                gridTemplateColumns: `repeat(${timeSlots.length}, minmax(42px, 1fr))`,
                              }}
                            >
                              {timeSlots.map((time) => {
                                const slotStart = timeToMinutes(time);
                                const slotEnd = slotStart + SLOT_MINUTES;
                                const isBooked = courtBookings.some((booking) => {
                                  const bookingStart = timeToMinutes(booking.time);
                                  const bookingEnd =
                                    bookingStart + booking.duration;

                                  return slotStart < bookingEnd && slotEnd > bookingStart;
                                });

                                return (
                                  <div
                                    key={time}
                                    className={cn(
                                      "min-h-12 border-r border-border last:border-r-0",
                                      isBooked
                                        ? "bg-destructive/10"
                                        : "bg-sport-success/10",
                                    )}
                                  />
                                );
                              })}

                              {courtBookings.map((booking) => {
                                const { columnStart, span } = getBookingSpan(booking, open);
                                const timeLabel = `${booking.time}-${bookingEndTime(booking)}`;

                                return (
                                  <div
                                    key={booking.id}
                                    className="z-10 m-1 overflow-hidden rounded-md bg-destructive px-2 py-1 text-[10px] font-semibold leading-tight text-destructive-foreground shadow-sm"
                                    style={{
                                      gridColumn: `${columnStart} / span ${span}`,
                                      gridRow: 1,
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
