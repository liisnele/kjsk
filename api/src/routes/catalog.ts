import {
  serializeCenter,
  serializeEquipment,
  serializeSport,
} from "@/lib/serializers.js";
import { prisma } from "@/lib/prisma.js";
import { Hono } from "hono";

export const catalog = new Hono();

const DEMO_CENTER_ID = "ahtme";
const HIDDEN_DEMO_SPORT_IDS = ["ahtme-changing-room"];

catalog.get("/", async (c) => {
  const [sports, centers, equipment] = await Promise.all([
    prisma.sport.findMany({
      where: {
        id: {
          notIn: HIDDEN_DEMO_SPORT_IDS,
        },
        centerLinks: {
          some: {
            centerId: DEMO_CENTER_ID,
          },
        },
      },
      include: {
        centerLinks: {
          where: {
            centerId: DEMO_CENTER_ID,
          },
        },
      },
      orderBy: {
        key: "asc",
      },
    }),
    prisma.sportCenter.findMany({
      where: {
        id: DEMO_CENTER_ID,
      },
      include: {
        sports: {
          where: {
            sportId: {
              notIn: HIDDEN_DEMO_SPORT_IDS,
            },
          },
        },
        courts: {
          where: {
            sportId: {
              notIn: HIDDEN_DEMO_SPORT_IDS,
            },
          },
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
