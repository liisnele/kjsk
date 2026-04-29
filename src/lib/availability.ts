import type { Booking, SportCenter, TimeSlot } from "@/types/api";

export function generateTimeSlots(
  date: string,
  centerId: string,
  sportId: string,
  centers: SportCenter[],
  bookings: Booking[] = [],
): TimeSlot[] {
  const center = centers.find((item) => item.id === centerId);
  if (!center) {
    return [];
  }

  const relevantCourts = center.courts.filter((court) => court.sportId === sportId);
  if (relevantCourts.length === 0) {
    return [];
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, dayOfMonth] = date.split("-").map(Number);
  const slotDate = new Date(year, month - 1, dayOfMonth);

  const buildUnavailableSlots = () =>
    relevantCourts.flatMap((court) => {
      const slots: TimeSlot[] = [];

      for (let hour = center.openingHours.open; hour < center.openingHours.close; hour += 1) {
        slots.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          available: false,
          courtId: court.id,
        });

        if (hour < center.openingHours.close - 1) {
          slots.push({
            time: `${hour.toString().padStart(2, "0")}:30`,
            available: false,
            courtId: court.id,
          });
        }
      }

      return slots;
    });

  if (slotDate < nowDate) {
    return buildUnavailableSlots();
  }

  const isTimeBooked = (courtId: string, time: string, duration = 1) =>
    bookings.some((booking) => {
      if (
        booking.date !== date ||
        booking.centerId !== centerId ||
        booking.courtId !== courtId
      ) {
        return false;
      }

      const [bookingHour, bookingMinute] = booking.time.split(":").map(Number);
      const [slotHour, slotMinute] = time.split(":").map(Number);
      const bookingStart = bookingHour * 60 + bookingMinute;
      const bookingEnd = bookingStart + booking.duration * 60;
      const slotStart = slotHour * 60 + slotMinute;
      const slotEnd = slotStart + duration * 60;

      return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
    });

  let open = center.openingHours.open;
  let close = center.openingHours.close;
  const day = new Date(date).getDay();

  if (center.id === "wiru") {
    if (day >= 1 && day <= 5) {
      open = 7;
      close = 21;
    } else {
      open = 8;
      close = 19;
    }
  }

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

  const seed =
    date.split("-").reduce((sum, part) => sum + Number.parseInt(part, 10), 0) +
    centerId.length +
    sportId.length;

  const slots: TimeSlot[] = [];
  let hasAvailableSlot = false;

  for (let hour = open; hour < close; hour += 1) {
    const fullHourTime = `${hour.toString().padStart(2, "0")}:00`;

    for (const court of relevantCourts) {
      const hash = (seed * (hour + 1) * (court.id.charCodeAt(1) + 1)) % 10;
      const isBooked = isTimeBooked(court.id, fullHourTime);
      let available = !isBooked && (hour === open || hash > 2);

      if (date === todayStr) {
        if (hour < now.getHours() || (hour === now.getHours() && now.getMinutes() > 0)) {
          available = false;
        }
      }

      slots.push({ time: fullHourTime, available, courtId: court.id });
      hasAvailableSlot ||= available;
    }

    if (hour >= close - 1) {
      continue;
    }

    const halfHourTime = `${hour.toString().padStart(2, "0")}:30`;

    for (const court of relevantCourts) {
      const hash = (seed * (hour + 0.5) * (court.id.charCodeAt(1) + 1)) % 10;
      const isBooked = isTimeBooked(court.id, halfHourTime);
      let available = !isBooked && (hour === open || hash > 2);

      if (date === todayStr) {
        if (hour < now.getHours() || (hour === now.getHours() && now.getMinutes() > 30)) {
          available = false;
        }
      }

      slots.push({ time: halfHourTime, available, courtId: court.id });
      hasAvailableSlot ||= available;
    }
  }

  if (!hasAvailableSlot && slots.length > 0) {
    slots[0].available = true;
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
  const [timeHour, timeMinute] = time.split(":").map(Number);
  const slotStart = timeHour * 60 + timeMinute;
  const slotEnd = slotStart + duration * 60;

  return !bookings.some((booking) => {
    if (
      booking.date !== date ||
      booking.centerId !== centerId ||
      booking.courtId !== courtId
    ) {
      return false;
    }

    const [bookingHour, bookingMinute] = booking.time.split(":").map(Number);
    const bookingStart = bookingHour * 60 + bookingMinute;
    const bookingEnd = bookingStart + booking.duration * 60;

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

  for (let hour = center.openingHours.open; hour < center.openingHours.close; hour += 1) {
    const fullHourTime = `${hour.toString().padStart(2, "0")}:00`;

    if (
      relevantCourts.some((court) =>
        isDurationAvailable(date, fullHourTime, minDuration, centerId, court.id, bookings),
      )
    ) {
      availableTimes.add(fullHourTime);
    }

    if (hour >= center.openingHours.close - 1) {
      continue;
    }

    const halfHourTime = `${hour.toString().padStart(2, "0")}:30`;

    if (
      relevantCourts.some((court) =>
        isDurationAvailable(date, halfHourTime, minDuration, centerId, court.id, bookings),
      )
    ) {
      availableTimes.add(halfHourTime);
    }
  }

  return Array.from(availableTimes).sort();
}
