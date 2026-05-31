import type { Booking, Court, Sport, SportCenter } from "@/types/api";

export const scheduleStartHour = 7;
export const scheduleEndHour = 21;
export const scheduleMinutes = (scheduleEndHour - scheduleStartHour) * 60;
export const scheduleHourWidth = 80;
export const scheduleLabelWidth = 190;
export const scheduleHours = Array.from(
  { length: scheduleEndHour - scheduleStartHour },
  (_, index) => scheduleStartHour + index,
);
export const scheduleTimelineWidth = scheduleHours.length * scheduleHourWidth;
export const scheduleTableWidth = scheduleLabelWidth + scheduleTimelineWidth;

export const arenaRowId = "ahtme-arena";
export const arenaRowName = "Kergejõustikuareen";

export const arenaSportIds = new Set([
  "ahtme-single-ticket",
  "ahtme-club-training-full",
  "ahtme-club-training-half",
  "ahtme-club-training-quarter",
  "ahtme-supported-club-training",
  "ahtme-registered-training-full",
  "ahtme-registered-training-half",
  "ahtme-registered-training-quarter",
]);

export const arenaCapacityBySportId: Record<string, number> = {
  "ahtme-single-ticket": 1,
  "ahtme-club-training-full": 4,
  "ahtme-supported-club-training": 4,
  "ahtme-registered-training-full": 4,
  "ahtme-club-training-half": 2,
  "ahtme-registered-training-half": 2,
  "ahtme-club-training-quarter": 1,
  "ahtme-registered-training-quarter": 1,
};

export type ScheduleBooking = Booking & {
  sportName?: string;
  resourceName?: string;
  courtName?: string;
};

export type ScheduleRow<TBooking extends ScheduleBooking> = {
  id: string;
  name: string;
  bookings: TBooking[];
};

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${hours.toString().padStart(2, "0")}:${remainder
    .toString()
    .padStart(2, "0")}`;
};

export const bookingEndTime = (booking: Pick<Booking, "time" | "duration">) =>
  minutesToTime(timeToMinutes(booking.time) + booking.duration);

export const getBookingStartMinutes = (booking: Pick<Booking, "time">) =>
  timeToMinutes(booking.time) - scheduleStartHour * 60;

export const getScheduleLeft = (booking: Pick<Booking, "time">) =>
  `${(Math.max(0, getBookingStartMinutes(booking)) / 60) * scheduleHourWidth}px`;

export const getScheduleWidth = (booking: Pick<Booking, "duration">) =>
  `${(Math.min(booking.duration, scheduleMinutes) / 60) * scheduleHourWidth}px`;

export const getScheduleWidthPixels = (booking: Pick<Booking, "duration">) =>
  (Math.min(booking.duration, scheduleMinutes) / 60) * scheduleHourWidth;

export const getArenaCapacity = (sportId: string) =>
  Math.min(4, Math.max(1, arenaCapacityBySportId[sportId] ?? 4));

export const getArenaLaneStyle = <TBooking extends ScheduleBooking>(
  booking: TBooking,
  arenaBookings: TBooking[],
) => {
  const capacity = getArenaCapacity(booking.sportId);
  const sameTimeBookings = arenaBookings
    .filter((item) => item.date === booking.date && item.time === booking.time)
    .sort((a, b) => a.id.localeCompare(b.id));
  let usedLanes = 0;

  for (const item of sameTimeBookings) {
    if (item.id === booking.id) break;
    usedLanes += getArenaCapacity(item.sportId);
  }

  const laneTop = (Math.min(usedLanes, 4) / 4) * 100;
  const laneHeight = (capacity / 4) * 100;

  return {
    top: `calc(${laneTop}% + 2px)`,
    height: `calc(${laneHeight}% - 4px)`,
  };
};

export const buildScheduleRows = <TBooking extends ScheduleBooking>(
  center: SportCenter | undefined,
  bookings: TBooking[],
  sports: Sport[] = [],
) => {
  const rows = new Map<string, ScheduleRow<TBooking>>();
  const sportsById = new Map(sports.map((sport) => [sport.id, sport]));
  const courtsById = new Map((center?.courts ?? []).map((court) => [court.id, court]));
  const firstCourtBySportId = new Map<string, Court>();

  for (const court of center?.courts ?? []) {
    if (!firstCourtBySportId.has(court.sportId)) {
      firstCourtBySportId.set(court.sportId, court);
    }
  }

  rows.set(arenaRowId, {
    id: arenaRowId,
    name: arenaRowName,
    bookings: [],
  });

  for (const court of center?.courts ?? []) {
    if (arenaSportIds.has(court.sportId)) {
      continue;
    }

    rows.set(court.id, {
      id: court.id,
      name: court.name || sportsById.get(court.sportId)?.key || court.sportId,
      bookings: [],
    });
  }

  for (const booking of bookings) {
    if (center && booking.centerId !== center.id) {
      continue;
    }

    const isArena = arenaSportIds.has(booking.sportId);
    const fallbackCourt = booking.courtId
      ? courtsById.get(booking.courtId)
      : firstCourtBySportId.get(booking.sportId);
    const rowId = isArena ? arenaRowId : booking.courtId ?? fallbackCourt?.id ?? booking.sportId;
    const rowName = isArena
      ? arenaRowName
      : booking.courtName ||
        fallbackCourt?.name ||
        booking.resourceName ||
        sportsById.get(booking.sportId)?.key ||
        booking.sportName ||
        booking.sportId;
    const row = rows.get(rowId);

    if (row) {
      row.bookings.push(booking);
    } else {
      rows.set(rowId, { id: rowId, name: rowName, bookings: [booking] });
    }
  }

  return Array.from(rows.values()).sort((a, b) => {
    if (a.id === arenaRowId) return -1;
    if (b.id === arenaRowId) return 1;
    return a.name.localeCompare(b.name);
  });
};

