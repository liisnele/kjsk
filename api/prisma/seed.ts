import "dotenv/config";

import { auth } from "../src/lib/auth.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { pricingRules, serializePricingRuleSeed } from "./pricing-rules.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const getAdminUsersFromEnv = () => {
  if (!process.env.ADMIN_USERS_JSON) {
    return [];
  }

  const parsed = JSON.parse(process.env.ADMIN_USERS_JSON) as Array<{
    username?: string;
    email?: string;
    password?: string;
    role?: "admin" | "senior_admin";
  }>;

  return parsed.map((user) => {
    if (!user.username || !user.password) {
      throw new Error("ADMIN_USERS_JSON entries must include username and password.");
    }

    if (user.password.length < 12) {
      throw new Error("Admin passwords must be at least 12 characters long.");
    }

    return {
      username: user.username.toLowerCase(),
      email: (user.email ?? `${user.username}@admin.local`).toLowerCase(),
      password: user.password,
      role: user.role ?? "admin",
    };
  });
};

const ahtmeServices = [
  { id: "ahtme-single-ticket", key: "Kergejõustik", hourlyPrice: 6, priceMin: 4, priceMax: 6 },
  { id: "ahtme-club-training-full", key: "Kergejõustikuareen", hourlyPrice: 28, priceMin: 20, priceMax: 30 },
  { id: "ahtme-club-training-half", key: "Kergejõustikuareen 1/2", hourlyPrice: 15, priceMin: 12, priceMax: 17 },
  { id: "ahtme-club-training-quarter", key: "Kergejõustikuareen 1/4", hourlyPrice: 8, priceMin: 6, priceMax: 10 },
  { id: "ahtme-club-training-aerobics", key: "Aeroobikasaal", hourlyPrice: 12, priceMin: 9, priceMax: 14 },
  { id: "ahtme-club-training-gym", key: "Jõusaal", hourlyPrice: 10, priceMin: 7, priceMax: 12 },
  { id: "ahtme-school-pe-free", key: "Koolide liikumisõpe, treeningud ja üritused", hourlyPrice: 0 },
  { id: "ahtme-tennis-court", key: "Tennis", hourlyPrice: 10, priceMin: 5, priceMax: 10 },
  { id: "ahtme-volleyball-court", key: "Võrkpall", hourlyPrice: 10, priceMin: 5, priceMax: 10 },
  { id: "ahtme-badminton-court", key: "Sulgpall", hourlyPrice: 10, priceMin: 5, priceMax: 10 },
  { id: "ahtme-supported-club-training", key: "Toetatavate spordiklubide ja Jõhvi Spordikooli treeningud", hourlyPrice: 10 },
  { id: "ahtme-state-school-pe", key: "HTM hallatavate koolide kehaline kasvatus ja üritused", hourlyPrice: 15, priceMin: 10, priceMax: 15 },
  { id: "ahtme-table-tennis", key: "Lauatennis", hourlyPrice: 4, priceMin: 2, priceMax: 4 },
  { id: "ahtme-private-running-track", key: "Jooksurada", hourlyPrice: 10, priceMin: 6, priceMax: 10 },
  { id: "ahtme-sauna-small", key: "Saun", hourlyPrice: 10 },
];

const ahtmeBookingOptions = [
  {
    id: "ahtme-single-ticket-gym",
    key: "Kergejõustik + jõusaal",
    hourlyPrice: 6,
    priceMin: 4,
    priceMax: 6,
    durationMinutes: 120,
    category: "individual",
    componentSportIds: ["ahtme-single-ticket", "ahtme-club-training-gym"],
  },
  {
    id: "ahtme-sauna-gym",
    key: "Saun + jõusaal",
    hourlyPrice: 15,
    priceMin: 15,
    priceMax: 15,
    durationMinutes: 60,
    category: "individual",
    participantMax: 10,
    note: "Maksimaalselt 10 inimest",
    componentSportIds: ["ahtme-sauna-small", "ahtme-club-training-gym"],
  },
  {
    id: "ahtme-package-arena-gym-tennis-sauna",
    key: "Kergejõustik + jalgpall + jõusaal + tennis + saun",
    hourlyPrice: 25,
    priceMin: 25,
    priceMax: 25,
    durationMinutes: 120,
    category: "packages",
    componentSportIds: ["ahtme-single-ticket", "ahtme-club-training-gym", "ahtme-tennis-court", "ahtme-sauna-small"],
  },
  {
    id: "ahtme-package-volleyball-sauna",
    key: "Võrkpall + saun",
    hourlyPrice: 20,
    priceMin: 20,
    priceMax: 20,
    durationMinutes: 120,
    category: "packages",
    componentSportIds: ["ahtme-volleyball-court", "ahtme-sauna-small"],
  },
  {
    id: "ahtme-package-gym-tabletennis-sauna",
    key: "Jõusaal + lauatennis + saun",
    hourlyPrice: 20,
    priceMin: 20,
    priceMax: 20,
    durationMinutes: 120,
    category: "packages",
    componentSportIds: ["ahtme-club-training-gym", "ahtme-table-tennis", "ahtme-sauna-small"],
  },
  {
    id: "ahtme-family-package",
    key: "Perepakett: Kergejõustik + lauatennis + tennis",
    hourlyPrice: 12,
    priceMin: 12,
    priceMax: 12,
    durationMinutes: 120,
    category: "packages",
    note: "2 täiskasvanut ja kuni 3 last",
    componentSportIds: ["ahtme-single-ticket", "ahtme-table-tennis", "ahtme-tennis-court"],
  },
];

const clubAndSchoolServiceIds = new Set([
  "ahtme-club-training-full",
  "ahtme-club-training-half",
  "ahtme-club-training-quarter",
  "ahtme-club-training-aerobics",
  "ahtme-club-training-gym",
  "ahtme-school-pe-free",
  "ahtme-supported-club-training",
  "ahtme-state-school-pe",
]);

const serviceMetadata: Record<
  string,
  {
    category?: string;
    participantMax?: number;
    note?: string;
  }
> = {
  "ahtme-sauna-small": {
    participantMax: 5,
    note: "Maksimaalselt 5 inimest",
  },
};

const getAhtmeServiceDurationMinutes = (serviceId: string) => {
  if (serviceId.includes("single-")) return 120;
  if (serviceId.includes("package")) return 120;
  if (
    serviceId.includes("carpet") ||
    serviceId.includes("high-jump-mat") ||
    serviceId.includes("tables-chairs")
  ) {
    return 24 * 60;
  }

  return 60;
};

const sports = [
  ...ahtmeServices.map((service) => {
    const metadata = serviceMetadata[service.id] ?? {};

    return {
      ...service,
      priceMin: service.priceMin ?? service.hourlyPrice,
      priceMax: service.priceMax ?? service.hourlyPrice,
      durationMinutes: getAhtmeServiceDurationMinutes(service.id),
      category:
        metadata.category ??
        (clubAndSchoolServiceIds.has(service.id) ? "clubsAndSchools" : "individual"),
      participantMax: metadata.participantMax ?? 50,
      note: metadata.note,
      centerIds: ["ahtme"],
      equipmentOptions: [],
    };
  }),
];

const equipmentPrices = {
  yogaMat: 2,
  rackets: 5,
  shuttlecocks: 1,
  kickboard: 3,
  goggles: 2,
  balls: 3,
  ball: 2,
  net: 5,
  skates: 10,
  helmet: 5,
  stick: 3,
  pads: 10,
  music: 0,
};

const centers = [
  {
    id: "ahtme",
    name: "Ahtme kergejõustikuhall",
    location: "Ahtme mnt. 61, Kohtla-Järve",
    descriptionEt:
      "Kergejõustikuhall pakub professionaalset ja aastaringset treeningkeskkonda erinevate kergejõustikualade harrastamiseks.",
    descriptionEn:
      "Athletics hall offers a professional and year-round training environment for various athletics disciplines.",
    image: "",
    openingHour: 7,
    closingHour: 21,
    sportIds: ahtmeServices.map((service) => service.id),
    courts: ahtmeServices.map((service, index) => ({
      id: `ahtme-service-${index + 1}`,
      name: service.key,
      sportId: service.id,
    })),
  },
];

const bookings: Array<{
  id: string;
  sportId: string;
  centerId: string;
  date: string;
  time: string;
  duration: number;
  name: string;
  email: string;
  phone: string;
  participants: number;
  status: "confirmed" | "cancelled";
  courtId: string;
  equipment: string[];
  note: string;
}> = [];

const games: Array<{
  id: string;
  sportId: string;
  centerId: string;
  courtId: string;
  date: string;
  time: string;
  duration: number;
  description: string;
  level: "beginner" | "intermediate" | "professional";
  minPlayers: number;
  maxPlayers: number;
  registeredPlayers: string[];
  creatorName: string;
  equipment: string[];
}> = [];
async function main() {
  const adminUsers = getAdminUsersFromEnv();

  await prisma.gameWaitlistEntry.deleteMany();
  await prisma.gameRegistration.deleteMany();
  await prisma.openGame.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.court.deleteMany();
  await prisma.centerSport.deleteMany();
  await prisma.bookingOptionComponent.deleteMany();
  await prisma.bookingOption.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.equipmentItem.deleteMany();
  await prisma.sportCenter.deleteMany();
  await prisma.sport.deleteMany();

  for (const sport of sports) {
    await prisma.sport.create({
      data: {
        id: sport.id,
        key: sport.key,
        hourlyPrice: sport.hourlyPrice,
        priceMin: sport.priceMin,
        priceMax: sport.priceMax,
        durationMinutes: sport.durationMinutes,
        equipmentOptions: sport.equipmentOptions,
      },
    });
  }

  for (const [id, price] of Object.entries(equipmentPrices)) {
    await prisma.equipmentItem.create({
      data: { id, price },
    });
  }

  for (const center of centers) {
    await prisma.sportCenter.create({
      data: {
        id: center.id,
        name: center.name,
        location: center.location,
        descriptionEt: center.descriptionEt,
        descriptionEn: center.descriptionEn,
        image: center.image,
        openingHour: center.openingHour,
        closingHour: center.closingHour,
        sports: {
          create: center.sportIds.map((sportId) => ({ sportId })),
        },
        courts: {
          create: center.courts,
        },
      },
    });
  }

  for (const booking of bookings) {
    await prisma.booking.create({
      data: booking,
    });
  }

  for (const game of games) {
    await prisma.openGame.create({
      data: {
        id: game.id,
        sportId: game.sportId,
        centerId: game.centerId,
        courtId: game.courtId,
        date: game.date,
        time: game.time,
        duration: game.duration,
        description: game.description,
        level: game.level,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        creatorName: game.creatorName,
        equipment: game.equipment,
        registrations: {
          create: game.registeredPlayers.map((name) => ({
            name,
            email: "",
            phone: "",
          })),
        },
      },
    });
  }

  for (const option of ahtmeBookingOptions) {
    await prisma.bookingOption.create({
      data: {
        id: option.id,
        key: option.key,
        centerId: "ahtme",
        hourlyPrice: option.hourlyPrice,
        priceMin: option.priceMin,
        priceMax: option.priceMax,
        durationMinutes: option.durationMinutes,
        category: option.category,
        participantMax: option.participantMax ?? 50,
        note: option.note,
        components: {
          create: option.componentSportIds.map((sportId, position) => ({ sportId, position })),
        },
      },
    });
  }

  await prisma.pricingRule.createMany({
    data: pricingRules.map(serializePricingRuleSeed),
  });

  for (const adminUser of adminUsers) {
    await auth.api.signUpEmail({
      body: {
        email: adminUser.email,
        password: adminUser.password,
        name: adminUser.username,
        username: adminUser.username,
      },
    });

    await prisma.user.update({
      where: {
        email: adminUser.email,
      },
      data: {
        role: adminUser.role,
        active: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });


