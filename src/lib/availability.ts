import type { Booking, SportCenter, TimeSlot } from "@/types/api";

const individualArenaSportIds = new Set([
  "ahtme-single-ticket",
]);

const arenaClubTrainingSportIds = new Set([
  "ahtme-club-training-full",
  "ahtme-club-training-half",
  "ahtme-club-training-quarter",
  "ahtme-registered-training-full",
  "ahtme-registered-training-half",
  "ahtme-registered-training-quarter",
  "ahtme-supported-club-training",
]);

const arenaCapacityBySportId: Record<string, number> = {
  "ahtme-single-ticket": 0.5,
  "ahtme-club-training-full": 1,
  "ahtme-club-training-half": 0.5,
  "ahtme-club-training-quarter": 0.25,
  "ahtme-supported-club-training": 1,
};

const fullArenaSportIds = new Set([
  "ahtme-club-training-full",
  "ahtme-supported-club-training",
]);

const packageComponentSportIds: Record<string, string[]> = {
  "ahtme-package-arena-gym-tennis-sauna": [
    "ahtme-single-ticket",
    "ahtme-tennis-court",
    "ahtme-sauna-small",
  ],
  "ahtme-package-volleyball-sauna": [
    "ahtme-volleyball-court",
    "ahtme-sauna-small",
  ],
  "ahtme-package-gym-tabletennis-sauna": [
    "ahtme-single-ticket",
    "ahtme-table-tennis",
    "ahtme-sauna-small",
  ],
  "ahtme-family-package": [
    "ahtme-single-ticket",
    "ahtme-table-tennis",
    "ahtme-tennis-court",
  ],
};

const getPackageComponentSportIds = (sportId: string) =>
  packageComponentSportIds[sportId] ?? [];

const getCourtsForSportIds = (center: SportCenter, sportIds: string[]) =>
  sportIds
    .map((sportId) => center.courts.find((court) => court.sportId === sportId))
    .filter((court): court is SportCenter["courts"][number] => Boolean(court));

const getOpeningWindow = (
  center: SportCenter,
  date: string,
): { open: number; close: number } => {
  const day = new Date(`${date}T00:00`).getDay();

  if (center.id === "ahtme") {
    if (day === 0) return { open: 9 * 60, close: 18 * 60 };
    if (day === 6) return { open: 9 * 60, close: 21 * 60 };
    return { open: 7 * 60, close: 21 * 60 };
  }

  if (center.id === "wiru") {
    if (day >= 1 && day <= 5) {
      return { open: 7 * 60, close: 21 * 60 };
    }

    return { open: 8 * 60, close: 19 * 60 };
  }

  return {
    open: center.openingHours.open * 60,
    close: center.openingHours.close * 60,
  };
};

const isWithinOpeningWindow = (
  time: string,
  durationMinutes: number,
  window: { open: number; close: number },
) => {
  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + minute;
  const end = start + durationMinutes;

  if (durationMinutes >= 24 * 60) {
    return start >= window.open && start < window.close;
  }

  return start >= window.open && end <= window.close;
};

const shouldBookingBlockSlot = (
  requestedSportId: string,
  requestedCourtId: string,
  booking: Booking,
) => {
  const requestedIndividual = individualArenaSportIds.has(requestedSportId);
  const bookedIndividual = individualArenaSportIds.has(booking.sportId);
  const requestedClubTraining = arenaClubTrainingSportIds.has(requestedSportId);
  const bookedClubTraining = arenaClubTrainingSportIds.has(booking.sportId);

  if (requestedIndividual && bookedIndividual) {
    return false;
  }

  if (
    (requestedIndividual && fullArenaSportIds.has(booking.sportId)) ||
    (fullArenaSportIds.has(requestedSportId) && bookedIndividual)
  ) {
    return true;
  }

  if (
    (requestedClubTraining && bookedClubTraining)
  ) {
    return true;
  }

  return booking.courtId === requestedCourtId;
};

const getArenaCapacity = (sportId: string) =>
  arenaCapacityBySportId[sportId] ?? 0;

const isArenaCapacityUnavailable = (
  requestedSportId: string,
  bookings: Booking[],
  date: string,
  time: string,
  duration: number,
) => {
  const requestedCapacity = getArenaCapacity(requestedSportId);

  if (requestedCapacity === 0) {
    return false;
  }

  const slotStart = new Date(`${date}T${time}`).getTime();
  const slotEnd = slotStart + duration * 60 * 1000;
  const usedCapacity = bookings.reduce((total, booking) => {
    const bookingCapacity = getArenaCapacity(booking.sportId);

    if (bookingCapacity === 0) {
      return total;
    }

    const bookingStart = new Date(`${booking.date}T${booking.time}`).getTime();
    const bookingEnd = bookingStart + booking.duration * 60 * 1000;
    const overlaps = !(slotEnd <= bookingStart || slotStart >= bookingEnd);

    return overlaps ? total + bookingCapacity : total;
  }, 0);

  return usedCapacity + requestedCapacity > 1;
};

export function generateTimeSlots(
  date: string,
  centerId: string,
  sportId: string,
  centers: SportCenter[],
  bookings: Booking[] = [],
  durationMinutes = 60,
): TimeSlot[] {
  const center = centers.find((item) => item.id === centerId);
  if (!center) {
    return [];
  }

  const relevantCourts = center.courts.filter((court) => court.sportId === sportId);
  if (relevantCourts.length === 0) {
    return [];
  }
  const packageComponentCourts = getCourtsForSportIds(
    center,
    getPackageComponentSportIds(sportId),
  );
  const packageHasAllComponentCourts =
    getPackageComponentSportIds(sportId).length === packageComponentCourts.length;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, dayOfMonth] = date.split("-").map(Number);
  const slotDate = new Date(year, month - 1, dayOfMonth);

  const buildUnavailableSlots = () => {
    const window = getOpeningWindow(center, date);

    return relevantCourts.flatMap((court) => {
      const slots: TimeSlot[] = [];

      for (let minute = window.open; minute < window.close; minute += 30) {
        slots.push({
          time: `${Math.floor(minute / 60).toString().padStart(2, "0")}:${(minute % 60)
            .toString()
            .padStart(2, "0")}`,
          available: false,
          courtId: court.id,
        });
      }

      return slots;
    });
  };

  if (slotDate < nowDate) {
    return buildUnavailableSlots();
  }

  const toTimestamp = (dateValue: string, timeValue: string) =>
    new Date(`${dateValue}T${timeValue}`).getTime();

  const isTimeBooked = (courtId: string, time: string, duration = durationMinutes) =>
    isArenaCapacityUnavailable(
      sportId,
      bookings.filter((booking) => booking.centerId === centerId),
      date,
      time,
      duration,
    ) ||
    bookings.some((booking) => {
      if (
        booking.centerId !== centerId ||
        (getArenaCapacity(sportId) > 0 && getArenaCapacity(booking.sportId) > 0) ||
        !shouldBookingBlockSlot(sportId, courtId, booking)
      ) {
        return false;
      }

      const bookingStart = toTimestamp(booking.date, booking.time);
      const bookingEnd = bookingStart + booking.duration * 60 * 1000;
      const slotStart = toTimestamp(date, time);
      const slotEnd = slotStart + duration * 60 * 1000;

      return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
    });
  const isPackageTimeBooked = (packageCourtId: string, time: string) =>
    !packageHasAllComponentCourts ||
    [packageCourtId, ...packageComponentCourts.map((court) => court.id)].some((courtId) =>
      isTimeBooked(courtId, time),
    );

  const window = getOpeningWindow(center, date);
  const open = Math.floor(window.open / 60);
  const close = Math.ceil(window.close / 60);
  const day = new Date(`${date}T00:00`).getDay();

  if (center.id === "jaahall" && (sportId === "skating" || sportId === "hockey")) {
    if (day !== 0 && day !== 6) {
      return [];
    }

    return [11, 19].flatMap((hour) => {
      const time = `${hour.toString().padStart(2, "0")}:00`;
      return relevantCourts.map((court) => ({
        time,
        available: !isTimeBooked(court.id, time),
        courtId: court.id,
      }));
    });
  }

  const slots: TimeSlot[] = [];

  for (let hour = open; hour < close; hour += 1) {
    const fullHourTime = `${hour.toString().padStart(2, "0")}:00`;

    for (const court of relevantCourts) {
      const isBooked =
        packageComponentCourts.length > 0
          ? isPackageTimeBooked(court.id, fullHourTime)
          : isTimeBooked(court.id, fullHourTime);
      let available =
        !isBooked &&
        isWithinOpeningWindow(fullHourTime, durationMinutes, window);

      if (date === todayStr) {
        if (hour < now.getHours() || (hour === now.getHours() && now.getMinutes() > 0)) {
          available = false;
        }
      }

      slots.push({ time: fullHourTime, available, courtId: court.id });
    }

    if (hour >= close - 1) {
      continue;
    }

    const halfHourTime = `${hour.toString().padStart(2, "0")}:30`;

    for (const court of relevantCourts) {
      const isBooked =
        packageComponentCourts.length > 0
          ? isPackageTimeBooked(court.id, halfHourTime)
          : isTimeBooked(court.id, halfHourTime);
      let available =
        !isBooked &&
        isWithinOpeningWindow(halfHourTime, durationMinutes, window);

      if (date === todayStr) {
        if (hour < now.getHours() || (hour === now.getHours() && now.getMinutes() > 30)) {
          available = false;
        }
      }

      slots.push({ time: halfHourTime, available, courtId: court.id });
    }
  }

  return slots;
}

export function isDurationAvailable(
  date: string,
  time: string,
  duration: number,
  centerId: string,
  courtId: string,
  bookings: Booking[],
): boolean {
  const toTimestamp = (dateValue: string, timeValue: string) =>
    new Date(`${dateValue}T${timeValue}`).getTime();
  const slotStart = toTimestamp(date, time);
  const slotEnd = slotStart + duration * 60 * 1000;

  return !bookings.some((booking) => {
    if (booking.centerId !== centerId || booking.courtId !== courtId) {
      return false;
    }

    const bookingStart = toTimestamp(booking.date, booking.time);
    const bookingEnd = bookingStart + booking.duration * 60 * 1000;

    return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
  });
}

export function getAvailableTimesWithMinDuration(
  date: string,
  centerId: string,
  sportId: string,
  minDuration: number,
  centers: SportCenter[],
  bookings: Booking[] = [],
): string[] {
  const center = centers.find((item) => item.id === centerId);
  if (!center) {
    return [];
  }

  const relevantCourts = center.courts.filter((court) => court.sportId === sportId);
  const availableTimes = new Set<string>();

  const window = getOpeningWindow(center, date);

  for (let minute = window.open; minute < window.close; minute += 30) {
    const time = `${Math.floor(minute / 60).toString().padStart(2, "0")}:${(minute % 60)
      .toString()
      .padStart(2, "0")}`;

    if (
      relevantCourts.some((court) =>
        isWithinOpeningWindow(time, minDuration * 60, window) &&
        isDurationAvailable(date, time, minDuration, centerId, court.id, bookings),
      )
    ) {
      availableTimes.add(time);
    }
  }

  return Array.from(availableTimes).sort();
}
