import { auth } from "@/lib/auth.js";
import { prisma } from "@/lib/prisma.js";
import { serializeAdminBooking } from "@/lib/serializers.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

export const admin = new Hono();

const cancelSchema = z.object({
  status: z.literal("cancelled"),
});

const getAdminUser = async (headers: Headers) => {
  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      active: true,
    },
  });

  if (!user?.active) {
    return null;
  }

  return user;
};

admin.get("/me", async (c) => {
  const user = await getAdminUser(c.req.raw.headers);

  if (!user) {
    return c.json({ message: "Admin login on vajalik." }, 401);
  }

  return c.json({
    user: {
      id: user.id,
      username: user.username ?? user.email,
      role: user.role,
    },
  });
});

admin.post("/logout", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (session?.session?.id) {
    await prisma.session.deleteMany({
      where: {
        id: session.session.id,
      },
    });
  }

  const response = c.json({ success: true });
  const cookieNames = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
    "better-auth.session_data",
    "__Secure-better-auth.session_data",
    "better-auth.account_data",
    "__Secure-better-auth.account_data",
    "better-auth.dont_remember",
    "__Secure-better-auth.dont_remember",
  ];

  for (const cookieName of cookieNames) {
    response.headers.append(
      "Set-Cookie",
      `${cookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
    );
  }

  return response;
});

admin.get("/bookings", async (c) => {
  const user = await getAdminUser(c.req.raw.headers);

  if (!user) {
    return c.json({ message: "Admin login on vajalik." }, 401);
  }

  const status = c.req.query("status");
  const date = c.req.query("date");
  const search = c.req.query("search")?.trim();

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status === "confirmed" || status === "cancelled" ? { status } : {}),
      ...(date ? { date } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { id: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      center: true,
      court: true,
      sport: true,
    },
    orderBy: [{ date: "desc" }, { time: "desc" }, { createdAt: "desc" }],
  });

  return c.json(bookings.map(serializeAdminBooking));
});

admin.patch("/bookings/:id", zValidator("json", cancelSchema), async (c) => {
  const user = await getAdminUser(c.req.raw.headers);

  if (!user) {
    return c.json({ message: "Admin login on vajalik." }, 401);
  }

  const payload = c.req.valid("json");
  const existingBooking = await prisma.booking.findUnique({
    where: {
      id: c.req.param("id"),
    },
  });

  if (!existingBooking) {
    return c.json({ message: "Broneeringut ei leitud." }, 404);
  }

  if (existingBooking.bookingGroupId) {
    await prisma.booking.updateMany({
      where: {
        bookingGroupId: existingBooking.bookingGroupId,
      },
      data: {
        status: payload.status,
      },
    });
  } else {
    await prisma.booking.update({
      where: {
        id: existingBooking.id,
      },
      data: {
        status: payload.status,
      },
    });
  }

  const booking = await prisma.booking.findUniqueOrThrow({
    where: {
      id: existingBooking.id,
    },
    include: {
      center: true,
      court: true,
      sport: true,
    },
  });

  return c.json(serializeAdminBooking(booking));
});
