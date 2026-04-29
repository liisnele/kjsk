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
  duration: z.number().int().min(1).max(4),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  participants: z.number().int().min(1).max(50),
  status: z.enum(["confirmed", "cancelled"]).default("confirmed"),
  note: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

export const bookings = new Hono();

bookings.get("/", async (c) => {
  const items = await prisma.booking.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "asc" }],
  });

  return c.json(items.map(serializeBooking));
});

bookings.post("/", zValidator("json", bookingSchema), async (c) => {
  const payload = c.req.valid("json");
  const booking = await prisma.booking.create({
    data: {
      id: payload.id ?? `b${Date.now()}`,
      sportId: payload.sportId,
      centerId: payload.centerId,
      courtId: payload.courtId,
      date: payload.date,
      time: payload.time,
      duration: payload.duration,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      participants: payload.participants,
      status: payload.status,
      note: payload.note ?? "",
      equipment: payload.equipment,
    },
  });

  return c.json(serializeBooking(booking), 201);
});
