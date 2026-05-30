import { serializeAvailabilityBooking, serializeBooking } from "@/lib/serializers.js";
import { prisma } from "@/lib/prisma.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const bookingSchema = z.object({
  id: z.string().optional(),
  sportId: z.string(),
  centerId: z.string(),
  courtId: z.string().optional(),
  date: z.string(),
  time: z.string(),
  duration: z.number().int().min(1).max(24 * 60),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  participants: z.number().int().min(1).max(50),
  status: z.enum(["confirmed", "cancelled"]).default("confirmed"),
  note: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

export const bookings = new Hono();

const DEMO_CENTER_ID = "ahtme";
const HIDDEN_DEMO_SPORT_IDS = new Set([
  "ahtme-changing-room",
  "ahtme-registered-training-full",
  "ahtme-registered-training-half",
  "ahtme-registered-training-quarter",
  "ahtme-registered-training-aerobics",
  "ahtme-registered-training-gym",
]);
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
  "ahtme-single-ticket": 0.25,
  "ahtme-club-training-full": 1,
  "ahtme-club-training-half": 0.5,
  "ahtme-club-training-quarter": 0.25,
  "ahtme-supported-club-training": 1,
};

const fullArenaSportIds = new Set([
  "ahtme-club-training-full",
  "ahtme-supported-club-training",
]);
const shouldBookingBlockSlot = (
  requestedSportId: string,
  requestedCourtId: string,
  booking: { sportId: string; courtId: string | null },
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
  existingBookings: Array<{ sportId: string; date: string; time: string; duration: number }>,
  requestedStart: number,
  requestedEnd: number,
) => {
  const requestedCapacity = getArenaCapacity(requestedSportId);

  if (requestedCapacity === 0) {
    return false;
  }

  const usedCapacity = existingBookings.reduce((total, booking) => {
    const bookingCapacity = getArenaCapacity(booking.sportId);

    if (bookingCapacity === 0) {
      return total;
    }

    const bookedStart = new Date(`${booking.date}T${booking.time}`).getTime();
    const bookedEnd = bookedStart + booking.duration * 60 * 1000;
    const overlaps = !(requestedEnd <= bookedStart || requestedStart >= bookedEnd);

    return overlaps ? total + bookingCapacity : total;
  }, 0);

  return usedCapacity + requestedCapacity > 1;
};

const getOpeningWindow = (centerId: string, date: string) => {
  const day = new Date(`${date}T00:00`).getDay();

  if (centerId === DEMO_CENTER_ID) {
    if (day === 0) return { open: 9 * 60, close: 18 * 60 };
    if (day === 6) return { open: 9 * 60, close: 21 * 60 };
    return { open: 7 * 60, close: 21 * 60 };
  }

  return { open: 8 * 60, close: 22 * 60 };
};

const isWithinOpeningWindow = (
  date: string,
  time: string,
  durationMinutes: number,
  centerId: string,
) => {
  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + minute;
  const end = start + durationMinutes;
  const window = getOpeningWindow(centerId, date);

  if (durationMinutes >= 24 * 60) {
    return start >= window.open && start < window.close;
  }

  return start >= window.open && end <= window.close;
};

bookings.get("/", async (c) => {
  const items = await prisma.booking.findMany({
    where: {
      centerId: DEMO_CENTER_ID,
    },
    orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "asc" }],
  });

  return c.json(items.map(serializeAvailabilityBooking));
});

bookings.post("/", zValidator("json", bookingSchema), async (c) => {
  const payload = c.req.valid("json");

  if (payload.centerId !== DEMO_CENTER_ID) {
    return c.json({ message: "Only Ahtme sports hall is available in this demo." }, 400);
  }

  if (HIDDEN_DEMO_SPORT_IDS.has(payload.sportId)) {
    return c.json({ message: "Selected booking option is not available." }, 400);
  }

  const selectedOption = await prisma.bookingOption.findUnique({
    where: { id: payload.sportId },
    include: { components: { orderBy: { position: "asc" } } },
  });
  const componentSportIds = selectedOption?.components.map((component) => component.sportId) ?? [];
  const primarySportId = componentSportIds[0] ?? payload.sportId;
  const sport = await prisma.sport.findUnique({
    where: { id: primarySportId },
  });
  const court = payload.courtId
    ? await prisma.court.findUnique({
        where: { id: payload.courtId },
      })
    : null;

  if (!sport || !court || court.centerId !== DEMO_CENTER_ID || court.sportId !== sport.id) {
    return c.json({ message: "Selected booking option is not available." }, 400);
  }

  if (selectedOption && selectedOption.centerId !== DEMO_CENTER_ID) {
    return c.json({ message: "Selected booking option is not available." }, 400);
  }

  if (!selectedOption && payload.participants > sport.participantMax) {
    return c.json({ message: "Selected booking option has too many participants." }, 400);
  }

  if (selectedOption && payload.participants > selectedOption.participantMax) {
    return c.json({ message: "Selected booking option has too many participants." }, 400);
  }

  if (
    !isWithinOpeningWindow(
      payload.date,
      payload.time,
      selectedOption?.durationMinutes ?? sport.durationMinutes,
      payload.centerId,
    )
  ) {
    return c.json({ message: "Selected time is outside opening hours." }, 400);
  }

  const existingBookings = await prisma.booking.findMany({
    where: {
      centerId: payload.centerId,
    },
  });
  const componentCourts =
    componentSportIds.length > 0
      ? await Promise.all(
          componentSportIds.map((sportId) =>
            prisma.court.findFirst({
              where: { centerId: DEMO_CENTER_ID, sportId },
              orderBy: { id: "asc" },
            }),
          ),
        )
      : [];

  if (componentCourts.some((item) => !item)) {
    return c.json({ message: "Package resources are not available." }, 400);
  }

  if (selectedOption && componentSportIds.length === 0) {
    return c.json({ message: "Booking option has no resources." }, 400);
  }

  const requestedStart = new Date(`${payload.date}T${payload.time}`).getTime();
  const bookingDuration = selectedOption?.durationMinutes ?? sport.durationMinutes;
  const requestedEnd = requestedStart + bookingDuration * 60 * 1000;
  const overlapsCourt = (requestedSportId: string, requestedCourtId: string) =>
    isArenaCapacityUnavailable(
      requestedSportId,
      existingBookings,
      requestedStart,
      requestedEnd,
    ) ||
    existingBookings.some((item) => {
      if (!shouldBookingBlockSlot(requestedSportId, requestedCourtId, item)) {
        return false;
      }

      if (
        getArenaCapacity(requestedSportId) > 0 &&
        getArenaCapacity(item.sportId) > 0
      ) {
        return false;
      }

      const bookedStart = new Date(`${item.date}T${item.time}`).getTime();
      const bookedEnd = bookedStart + item.duration * 60 * 1000;
      return !(requestedEnd <= bookedStart || requestedStart >= bookedEnd);
    });
  const requestedResources =
    selectedOption
      ? componentCourts.map((item, index) => ({
          sportId: componentSportIds[index],
          courtId: item!.id,
        }))
      : [{ sportId: sport.id, courtId: court.id }];
  const overlaps = requestedResources.some((item) =>
    overlapsCourt(item.sportId, item.courtId),
  );

  if (overlaps) {
    return c.json({ message: "Selected time is already booked." }, 409);
  }

  const bookingId = payload.id ?? `b${Date.now()}`;
  const booking = await prisma.$transaction(async (tx) => {
    if (selectedOption) {
      const optionBookings = await Promise.all(
        componentCourts.map((item, index) =>
          tx.booking.create({
            data: {
              id: index === 0 ? bookingId : `${bookingId}-part-${index + 1}`,
              bookingGroupId: bookingId,
              bookingOptionId: selectedOption.id,
              bookingOptionName: selectedOption.key,
              sportId: componentSportIds[index],
              centerId: payload.centerId,
              courtId: item!.id,
              date: payload.date,
              time: payload.time,
              duration: bookingDuration,
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              participants: payload.participants,
              status: payload.status,
              note: index === 0 ? payload.note ?? "" : `Broneerimisvaliku osa: ${selectedOption.key}`,
              equipment: index === 0 ? payload.equipment : [],
            },
          }),
        ),
      );

      return optionBookings[0];
    }

    const mainBooking = await tx.booking.create({
      data: {
        id: bookingId,
        bookingGroupId: bookingId,
        sportId: sport.id,
        centerId: payload.centerId,
        courtId: payload.courtId,
        date: payload.date,
        time: payload.time,
        duration: bookingDuration,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        participants: payload.participants,
        status: payload.status,
        note: payload.note ?? "",
        equipment: payload.equipment,
      },
    });

    return mainBooking;
  });

  return c.json(serializeBooking(booking), 201);
});
