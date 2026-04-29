import "dotenv/config";

import { getAllowedOrigins } from "@/lib/utils.js";
import { routes } from "@/routes/index.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

app.use(
  "/*",
  cors({
    origin: getAllowedOrigins(),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS", "DELETE", "PATCH"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/api/health", (c) => c.json({ ok: true }));

routes(app);

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3001,
  },
  ({ port }) => {
    console.log(`Server is running on http://localhost:${port}`);
  },
);
