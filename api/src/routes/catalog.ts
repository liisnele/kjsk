import {
  serializeCenter,
  serializeEquipment,
  serializeSport,
} from "@/lib/serializers.js";
import { prisma } from "@/lib/prisma.js";
import { Hono } from "hono";

export const catalog = new Hono();

catalog.get("/", async (c) => {
  const [sports, centers, equipment] = await Promise.all([
    prisma.sport.findMany({
      include: {
        centerLinks: true,
      },
      orderBy: {
        key: "asc",
      },
    }),
    prisma.sportCenter.findMany({
      include: {
        sports: true,
        courts: {
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.equipmentItem.findMany({
      orderBy: {
        id: "asc",
      },
    }),
  ]);

  return c.json({
    sports: sports.map(serializeSport),
    sportCenters: centers.map(serializeCenter),
    equipmentPrices: Object.fromEntries(
      equipment.map((item) => [item.id, serializeEquipment(item).price]),
    ),
    sportPrices: Object.fromEntries(
      sports.map((sport) => [sport.id, sport.hourlyPrice]),
    ),
  });
});
