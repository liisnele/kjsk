import { bookings } from "@/routes/bookings.js";
import { catalog } from "@/routes/catalog.js";
import { games } from "@/routes/games.js";
import type { Hono } from "hono";

export const routes = (app: Hono) => {
  app.route("/api/catalog", catalog);
  app.route("/api/bookings", bookings);
  app.route("/api/games", games);
};
