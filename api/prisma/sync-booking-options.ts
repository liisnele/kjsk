import "dotenv/config";

import { prisma } from "../src/lib/prisma.js";
import { pricingRules, serializePricingRuleSeed } from "./pricing-rules.js";

const resourceSports = [
  { id: "ahtme-single-ticket", key: "Kergejõustik", hourlyPrice: 6, priceMin: 4, priceMax: 6, durationMinutes: 120 },
  { id: "ahtme-club-training-gym", key: "Jõusaal", hourlyPrice: 10, priceMin: 7, priceMax: 12, durationMinutes: 60 },
  { id: "ahtme-sauna-small", key: "Saun", hourlyPrice: 10, priceMin: 10, priceMax: 10, durationMinutes: 60 },
  { id: "ahtme-volleyball-court", key: "Võrkpall", hourlyPrice: 10, priceMin: 5, priceMax: 10, durationMinutes: 60 },
  { id: "ahtme-table-tennis", key: "Lauatennis", hourlyPrice: 4, priceMin: 2, priceMax: 4, durationMinutes: 60 },
  { id: "ahtme-tennis-court", key: "Tennis", hourlyPrice: 10, priceMin: 5, priceMax: 10, durationMinutes: 60 },
];

const bookingOptions = [
  {
    id: "ahtme-single-ticket-gym",
    legacyIds: [],
    key: "Kergejõustik + jõusaal",
    hourlyPrice: 6,
    priceMin: 4,
    priceMax: 6,
    durationMinutes: 120,
    category: "individual",
    participantMax: 50,
    componentSportIds: ["ahtme-single-ticket", "ahtme-club-training-gym"],
  },
  {
    id: "ahtme-sauna-gym",
    legacyIds: ["ahtme-sauna-gym"],
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
    legacyIds: ["ahtme-package-arena-gym-tennis-sauna"],
    key: "Kergejõustik + jalgpall + jõusaal + tennis + saun",
    hourlyPrice: 25,
    priceMin: 25,
    priceMax: 25,
    durationMinutes: 120,
    category: "packages",
    participantMax: 50,
    componentSportIds: ["ahtme-single-ticket", "ahtme-club-training-gym", "ahtme-tennis-court", "ahtme-sauna-small"],
  },
  {
    id: "ahtme-package-volleyball-sauna",
    legacyIds: ["ahtme-package-volleyball-sauna"],
    key: "Võrkpall + saun",
    hourlyPrice: 20,
    priceMin: 20,
    priceMax: 20,
    durationMinutes: 120,
    category: "packages",
    participantMax: 50,
    componentSportIds: ["ahtme-volleyball-court", "ahtme-sauna-small"],
  },
  {
    id: "ahtme-package-gym-tabletennis-sauna",
    legacyIds: ["ahtme-package-gym-tabletennis-sauna"],
    key: "Jõusaal + lauatennis + saun",
    hourlyPrice: 20,
    priceMin: 20,
    priceMax: 20,
    durationMinutes: 120,
    category: "packages",
    participantMax: 50,
    componentSportIds: ["ahtme-club-training-gym", "ahtme-table-tennis", "ahtme-sauna-small"],
  },
  {
    id: "ahtme-family-package",
    legacyIds: ["ahtme-family-package"],
    key: "Perepakett: Kergejõustik + lauatennis + tennis",
    hourlyPrice: 12,
    priceMin: 12,
    priceMax: 12,
    durationMinutes: 120,
    category: "packages",
    participantMax: 50,
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

const findCourt = async (sportId: string) =>
  prisma.court.findFirst({
    where: { centerId: "ahtme", sportId },
    orderBy: { id: "asc" },
  });

async function main() {
  await prisma.pricingRule.deleteMany();
  await prisma.pricingRule.createMany({
    data: pricingRules.map(serializePricingRuleSeed),
  });

  for (const sport of resourceSports) {
    const metadata = serviceMetadata[sport.id] ?? {};
    const sportData = {
      ...sport,
      category:
        metadata.category ??
        (clubAndSchoolServiceIds.has(sport.id) ? "clubsAndSchools" : "individual"),
      participantMax: metadata.participantMax ?? 50,
      note: metadata.note,
    };

    await prisma.sport.upsert({
      where: { id: sport.id },
      update: sportData,
      create: { ...sportData, equipmentOptions: [] },
    });
    await prisma.centerSport.upsert({
      where: { centerId_sportId: { centerId: "ahtme", sportId: sport.id } },
      update: {},
      create: { centerId: "ahtme", sportId: sport.id },
    });
    await prisma.court.updateMany({
      where: { centerId: "ahtme", sportId: sport.id },
      data: { name: sport.key },
    });
  }

  for (const option of bookingOptions) {
    await prisma.bookingOption.upsert({
      where: { id: option.id },
      update: {
        key: option.key,
        hourlyPrice: option.hourlyPrice,
        priceMin: option.priceMin,
        priceMax: option.priceMax,
        durationMinutes: option.durationMinutes,
        category: option.category,
        participantMax: option.participantMax,
        note: option.note,
      },
      create: {
        id: option.id,
        key: option.key,
        centerId: "ahtme",
        hourlyPrice: option.hourlyPrice,
        priceMin: option.priceMin,
        priceMax: option.priceMax,
        durationMinutes: option.durationMinutes,
        category: option.category,
        participantMax: option.participantMax,
        note: option.note,
      },
    });
    await prisma.bookingOptionComponent.deleteMany({ where: { optionId: option.id } });
    await prisma.bookingOptionComponent.createMany({
      data: option.componentSportIds.map((sportId, position) => ({
        optionId: option.id,
        sportId,
        position,
      })),
      skipDuplicates: true,
    });
    await prisma.booking.updateMany({
      where: { bookingOptionId: option.id },
      data: { bookingOptionName: option.key },
    });
  }

  for (const option of bookingOptions) {
    const legacyBookings = await prisma.booking.findMany({
      where: {
        sportId: { in: option.legacyIds },
        bookingOptionId: null,
      },
      orderBy: { createdAt: "asc" },
    });

    for (const legacyBooking of legacyBookings) {
      const groupId = legacyBooking.bookingGroupId ?? legacyBooking.id;
      const primarySportId = option.componentSportIds[0];
      const primaryCourt = await findCourt(primarySportId);

      await prisma.booking.update({
        where: { id: legacyBooking.id },
        data: {
          sportId: primarySportId,
          courtId: primaryCourt?.id,
          bookingGroupId: groupId,
          bookingOptionId: option.id,
          bookingOptionName: option.key,
        },
      });

      for (const [index, sportId] of option.componentSportIds.slice(1).entries()) {
        const court = await findCourt(sportId);
        if (!court) continue;

        await prisma.booking.upsert({
          where: { id: `${groupId}-part-${index + 2}` },
          update: {
            sportId,
            courtId: court.id,
            bookingGroupId: groupId,
            bookingOptionId: option.id,
            bookingOptionName: option.key,
          },
          create: {
            id: `${groupId}-part-${index + 2}`,
            sportId,
            centerId: legacyBooking.centerId,
            courtId: court.id,
            bookingGroupId: groupId,
            bookingOptionId: option.id,
            bookingOptionName: option.key,
            date: legacyBooking.date,
            time: legacyBooking.time,
            duration: legacyBooking.duration,
            name: legacyBooking.name,
            email: legacyBooking.email,
            phone: legacyBooking.phone,
            participants: legacyBooking.participants,
            status: legacyBooking.status,
            note: `Broneerimisvaliku osa: ${option.key}`,
            equipment: [],
            createdAt: legacyBooking.createdAt,
          },
        });
      }
    }
  }

  const resourceSportIds = new Set(resourceSports.map((sport) => sport.id));
  const legacySportIds = bookingOptions
    .flatMap((option) => option.legacyIds)
    .filter((sportId) => !resourceSportIds.has(sportId));

  await prisma.court.deleteMany({ where: { sportId: { in: legacySportIds } } });
  await prisma.centerSport.deleteMany({ where: { sportId: { in: legacySportIds } } });
  await prisma.sport.deleteMany({ where: { id: { in: legacySportIds } } });
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

