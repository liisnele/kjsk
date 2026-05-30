import { admin } from "@/routes/admin.js";
import { auth } from "@/lib/auth.js";
import { bookings } from "@/routes/bookings.js";
import { catalog } from "@/routes/catalog.js";
import { games } from "@/routes/games.js";
import type { Hono } from "hono";

export const routes = (app: Hono) => {
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  app.route("/api/admin", admin);
  app.route("/api/catalog", catalog);
  app.route("/api/bookings", bookings);
  app.route("/api/games", games);
};
