import {
  serializeCenter,
  serializeBookingOption,
  serializeEquipment,
  serializePricingRule,
  serializeSport,
} from "@/lib/serializers.js";
import { prisma } from "@/lib/prisma.js";
import { Hono } from "hono";

export const catalog = new Hono();

const DEMO_CENTER_ID = "ahtme";
const HIDDEN_DEMO_SPORT_IDS = [
  "ahtme-changing-room",
  "ahtme-unregistered-event-hall",
  "ahtme-unregistered-event-territory",
  "ahtme-unregistered-prep-time",
  "ahtme-registered-event-hall",
  "ahtme-registered-event-territory",
  "ahtme-supported-prep-time",
  "ahtme-city-event-free",
  "ahtme-registered-training-full",
  "ahtme-registered-training-half",
  "ahtme-registered-training-quarter",
  "ahtme-registered-training-aerobics",
  "ahtme-registered-training-gym",
];

catalog.get("/", async (c) => {
  const [sports, bookingOptions, centers, equipment, pricingRules] = await Promise.all([
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
    prisma.bookingOption.findMany({
      where: {
        centerId: DEMO_CENTER_ID,
      },
      include: {
        components: {
          orderBy: {
            position: "asc",
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
        bookingOptions: true,
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
    prisma.pricingRule.findMany({
      orderBy: [{ serviceId: "asc" }, { priority: "desc" }, { id: "asc" }],
    }),
  ]);

  return c.json({
    sports: sports.map(serializeSport),
    bookingOptions: bookingOptions.map(serializeBookingOption),
    sportCenters: centers.map(serializeCenter),
    pricingRules: pricingRules.map(serializePricingRule),
    equipmentPrices: Object.fromEntries(
      equipment.map((item) => [item.id, serializeEquipment(item).price]),
    ),
    sportPrices: Object.fromEntries(
      [
        ...sports.map((sport) => [sport.id, sport.hourlyPrice] as const),
        ...bookingOptions.map((option) => [option.id, option.hourlyPrice] as const),
      ],
    ),
  });
});
