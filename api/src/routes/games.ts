import { serializeGame } from "@/lib/serializers.js";
import { prisma } from "@/lib/prisma.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const gameSchema = z.object({
  id: z.string().optional(),
  sportId: z.string(),
  centerId: z.string(),
  courtId: z.string(),
  date: z.string(),
  time: z.string(),
  duration: z.number().int().min(1).max(4),
  description: z.string().min(1).max(1000),
  level: z.enum(["beginner", "intermediate", "professional"]),
  minPlayers: z.number().int().min(2).max(30),
  maxPlayers: z.number().int().min(2).max(30),
  creatorName: z.string().min(1),
  equipment: z.array(z.string()).default([]),
});

const participantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
});

const gameInclude = {
  registrations: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  waitlist: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

export const games = new Hono();

games.get("/", async (c) => {
  const items = await prisma.openGame.findMany({
    include: gameInclude,
    orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "desc" }],
  });

  return c.json(items.map(serializeGame));
});

games.post("/", zValidator("json", gameSchema), async (c) => {
  const payload = c.req.valid("json");

  const game = await prisma.$transaction(async (tx) => {
    await tx.booking.create({
      data: {
        id: `bg${Date.now()}`,
        sportId: payload.sportId,
        centerId: payload.centerId,
        courtId: payload.courtId,
        date: payload.date,
        time: payload.time,
        duration: payload.duration,
        name: payload.creatorName,
        email: "",
        phone: "",
        participants: 1,
        status: "confirmed",
        note: "Open game reservation",
        equipment: payload.equipment,
      },
    });

    return tx.openGame.create({
      data: {
        id: payload.id ?? `g${Date.now()}`,
        sportId: payload.sportId,
        centerId: payload.centerId,
        courtId: payload.courtId,
        date: payload.date,
        time: payload.time,
        duration: payload.duration,
        description: payload.description,
        level: payload.level,
        minPlayers: payload.minPlayers,
        maxPlayers: payload.maxPlayers,
        creatorName: payload.creatorName,
        equipment: payload.equipment,
        registrations: {
          create: {
            name: payload.creatorName,
            email: "",
            phone: "",
          },
        },
      },
      include: gameInclude,
    });
  });

  return c.json(serializeGame(game), 201);
});

games.post("/:id/register", zValidator("json", participantSchema), async (c) => {
  const { id } = c.req.param();
  const payload = c.req.valid("json");

  const game = await prisma.openGame.findUnique({
    where: { id },
    include: gameInclude,
  });

  if (!game) {
    return c.json({ message: "Game not found." }, 404);
  }

  const isRegistered = game.registrations.some(
    (registration) => registration.name === payload.name,
  );

  if (isRegistered) {
    return c.json({ message: "Player is already registered." }, 409);
  }

  const updated = game.registrations.length >= game.maxPlayers
    ? await prisma.openGame.update({
        where: { id },
        data: {
          waitlist: {
            create: payload,
          },
        },
        include: gameInclude,
      })
    : await prisma.openGame.update({
        where: { id },
        data: {
          registrations: {
            create: payload,
          },
        },
        include: gameInclude,
      });

  return c.json(serializeGame(updated));
});

games.delete("/:id/register", async (c) => {
  const { id } = c.req.param();
  const name = c.req.query("name");

  if (!name) {
    return c.json({ message: "Player name is required." }, 400);
  }

  const game = await prisma.openGame.findUnique({
    where: { id },
    include: gameInclude,
  });

  if (!game) {
    return c.json({ message: "Game not found." }, 404);
  }

  const registration = game.registrations.find((player) => player.name === name);

  if (!registration) {
    return c.json({ message: "Registration not found." }, 404);
  }

  const promotedEntry = game.waitlist[0];

  await prisma.$transaction(async (tx) => {
    await tx.gameRegistration.delete({
      where: { id: registration.id },
    });

    if (promotedEntry) {
      await tx.gameRegistration.create({
        data: {
          gameId: id,
          name: promotedEntry.name,
          email: promotedEntry.email,
          phone: promotedEntry.phone,
        },
      });

      await tx.gameWaitlistEntry.delete({
        where: { id: promotedEntry.id },
      });
    }
  });

  const updated = await prisma.openGame.findUniqueOrThrow({
    where: { id },
    include: gameInclude,
  });

  return c.json(serializeGame(updated));
});

games.delete("/:id/waitlist", async (c) => {
  const { id } = c.req.param();
  const name = c.req.query("name");

  if (!name) {
    return c.json({ message: "Player name is required." }, 400);
  }

  const entry = await prisma.gameWaitlistEntry.findFirst({
    where: {
      gameId: id,
      name,
    },
  });

  if (!entry) {
    return c.json({ message: "Waitlist entry not found." }, 404);
  }

  await prisma.gameWaitlistEntry.delete({
    where: { id: entry.id },
  });

  const updated = await prisma.openGame.findUniqueOrThrow({
    where: { id },
    include: gameInclude,
  });

  return c.json(serializeGame(updated));
});
