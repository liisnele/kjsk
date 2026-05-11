import { serializeBooking } from "@/lib/serializers.js";
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
const HIDDEN_DEMO_SPORT_IDS = new Set(["ahtme-changing-room"]);
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
    (requestedIndividual && bookedClubTraining) ||
    (requestedClubTraining && bookedIndividual) ||
    (requestedClubTraining && bookedClubTraining)
  ) {
    return true;
  }

  return booking.courtId === requestedCourtId;
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

  return c.json(items.map(serializeBooking));
});

bookings.post("/", zValidator("json", bookingSchema), async (c) => {
  const payload = c.req.valid("json");

  if (payload.centerId !== DEMO_CENTER_ID) {
    return c.json({ message: "Only Ahtme sports hall is available in this demo." }, 400);
  }

  if (HIDDEN_DEMO_SPORT_IDS.has(payload.sportId)) {
    return c.json({ message: "Selected booking option is not available." }, 400);
  }

  const sport = await prisma.sport.findUnique({
    where: { id: payload.sportId },
  });
  const court = payload.courtId
    ? await prisma.court.findUnique({
        where: { id: payload.courtId },
      })
    : null;

  if (!sport || !court || court.centerId !== DEMO_CENTER_ID || court.sportId !== sport.id) {
    return c.json({ message: "Selected booking option is not available." }, 400);
  }

  if (sport.id === "ahtme-sauna-small" && payload.participants > 5) {
    return c.json({ message: "Sauna booking allows a maximum of 5 participants." }, 400);
  }

  if (sport.id === "ahtme-sauna-gym" && payload.participants > 10) {
    return c.json({ message: "Sauna and gym booking allows a maximum of 10 participants." }, 400);
  }

  if (
    !isWithinOpeningWindow(
      payload.date,
      payload.time,
      sport.durationMinutes,
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
  const componentSportIds = getPackageComponentSportIds(sport.id);
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

  const requestedStart = new Date(`${payload.date}T${payload.time}`).getTime();
  const requestedEnd = requestedStart + sport.durationMinutes * 60 * 1000;
  const overlapsCourt = (requestedSportId: string, requestedCourtId: string) =>
    existingBookings.some((item) => {
      if (!shouldBookingBlockSlot(requestedSportId, requestedCourtId, item)) {
        return false;
      }

      const bookedStart = new Date(`${item.date}T${item.time}`).getTime();
      const bookedEnd = bookedStart + item.duration * 60 * 1000;
      return !(requestedEnd <= bookedStart || requestedStart >= bookedEnd);
    });
  const requestedResources = [
    { sportId: sport.id, courtId: court.id },
    ...componentCourts.map((item, index) => ({
      sportId: componentSportIds[index],
      courtId: item!.id,
    })),
  ];
  const overlaps = requestedResources.some((item) =>
    overlapsCourt(item.sportId, item.courtId),
  );

  if (overlaps) {
    return c.json({ message: "Selected time is already booked." }, 409);
  }

  const bookingId = payload.id ?? `b${Date.now()}`;
  const booking = await prisma.$transaction(async (tx) => {
    const mainBooking = await tx.booking.create({
      data: {
        id: bookingId,
        sportId: payload.sportId,
        centerId: payload.centerId,
        courtId: payload.courtId,
        date: payload.date,
        time: payload.time,
        duration: sport.durationMinutes,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        participants: payload.participants,
        status: payload.status,
        note: payload.note ?? "",
        equipment: payload.equipment,
      },
    });

    if (componentCourts.length > 0) {
      await tx.booking.createMany({
        data: componentCourts.map((item, index) => ({
          id: `${bookingId}-part-${index + 1}`,
          sportId: componentSportIds[index],
          centerId: payload.centerId,
          courtId: item!.id,
          date: payload.date,
          time: payload.time,
          duration: sport.durationMinutes,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          participants: payload.participants,
          status: payload.status,
          note: `Paketi osa: ${sport.key}`,
          equipment: [],
        })),
      });
    }

    return mainBooking;
  });

  return c.json(serializeBooking(booking), 201);
});
